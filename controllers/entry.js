"use strict";

const constants = require('../helpers/constants');
const Entry = require('../models/entry');
const Like = require('../models/like');
const Flag = require('../models/flag');
const Bookmark = require('../models/bookmark');
const {
  // isValidKeyword,
  isValidKeywordArray
} = require('../helpers/validation');

async function paramEntryId(req, res, next, value) {
  if (typeof value != 'string' || !/^[0-9a-f]{24}$/.test(value)) {
    return res.status(400).json({ error: "That is not a properly formatted entryId." })
  }
  const entryId = value;
  try {
    const result = await Entry.findByIdAndPopulate(entryId, req.session?.user?._id);
    if (result) {
      req.foundEntryById = result;
    } else {
      return res.status(404).json({ error: "There is no entry with that entryId." });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

async function paramFlagId(req, res, next, value) {
  if (typeof value != 'string' || !/^[0-9a-f]{24}$/.test(value)) {
    return res.status(400).json({ error: "That is not a properly formatted flagId." });
  }
  const flagId = value;
  try {
    const result = await Flag.findById(flagId, req.session?.user?._id);
    if (result) {
      req.foundFlagById = result;
    } else {
      return res.status(404).json({ error: "There is no flag with that flagId." });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

async function getEntryList(req, res) {
  const orderLookup = {
    s: ['storyTitle', 1],
    e: ['entryTitle', 1],
    a: ['authorName', 1],
    l: ['likes', 1],
    c: ['createDate', 1],
    S: ['storyTitle', -1],
    E: ['entryTitle', -1],
    A: ['authorName', -1],
    L: ['likes', -1],
    C: ['createDate', -1],
  }
  const { page, storiesOnly, search, } = req.query;
  const zPage = Number.isSafeInteger(page) && page > 0 ? page - 1 : 0;

  // Validate and separate tokens
  const tokenList = search ? search.split(/\s+/).filter(x => x) : "o:C".split(/\s+/).filter(x => x);
  const searchREString = '^((?<fields>[seabkSEAK]+):)?(?<word>[\\w.-]+)$'
  const sortREString = '^o:(?<sort>[sealcSEALC]+)$'
  const searchRE = new RegExp(searchREString);
  const sortRE = new RegExp(sortREString);
  const tokenRE = new RegExp(searchREString + '|' + sortREString);
  if (!tokenList.every(token => tokenRE.test(token))) {
    return res.status(400).json({ error: "Misformed query string." });
  }
  const sortList = tokenList.filter(token => sortRE.test(token));
  const searchList = tokenList.filter(token => searchRE.test(token));
  if (sortList.length > 1) {
    return res.status(400).json({ error: "Misformed query string." });
  }
  const sortTerm = sortList.length ? sortRE.exec(sortList[0]).groups.sort : 'C'; // default to latest first
  if (/([sealc]).*\1/i.test(sortTerm)) {
    return res.status(400).json({ error: "Misformed query string." });
  }
  if (searchList.some(token => /([seabk]).*\1.*:/i.test(token))) {
    return res.status(400).json({ error: "Misformed query string." });
  }

  // Construct the sort query
  const sortQuery = {};
  for (const field of sortTerm) {
    const [name, order] = orderLookup[field];
    sortQuery[name] = order;
  }
  sortQuery._id = -1; // make sure the sort order is completely unambiguous so it plays well with pagination


  // Construct the search query
  const termArray = [];
  const searchQuery = storiesOnly ? { previousEntry: null } : {};
  for (const searchTerm of searchList) {
    const groups = searchRE.exec(searchTerm).groups;
    const fields = groups.fields ?? "seabK";
    const word = groups.word;

    const fieldLookup = {
      s: { storyTitle: { $regex: word, $options: 'i' } },
      e: { entryTitle: { $regex: word, $options: 'i' } },
      a: { authorName: { $regex: word, $options: 'i' } },
      b: { bodyText: { $regex: word, $options: 'i' } },
      k: { keywords: { $regex: word, $options: 'i' } },
      S: { storyTitle: word },
      E: { entryTitle: word },
      A: { authorName: word },
      K: { keywords: word },
    }

    const termQuery = [];
    for (const field of fields) {
      termQuery.push(fieldLookup[field]);
    }
    termArray.push({ $or: termQuery });
  }
  if (termArray.length) {
    searchQuery["$and"] = termArray;
  }

  const entryList = await Entry.findAndPopulate(
    searchQuery,
    sortQuery,
    zPage * constants.entriesPerPage,
    constants.entriesPerPage,
    req.session?.user?._id
  );
  const result = entryList.map(entry => entry.summary());
  res.status(200).json(result);
}

async function getEntryById(req, res) {
  res.status(200).json(await req.foundEntryById.fullInfoWithContinuations());
}

// Potential approach for speed improvement:
// grab all entries with the same storyId all in one query, and chain them together locally
// Since this is one big query, it may be considerably faster than repeated queries for one
// entry at a time, but at the cost of more memory usage. Don't implement until the version
// implemented here becomes problematic.
async function getChainById(req, res, next) {
  try {
    const results = [await req.foundEntryById.fullInfoWithContinuations()];
    while (results[0].previousEntry) {
      const nextPreviousEntry = await Entry.findByIdAndPopulate(results[0].previousEntry, req?.session?.user?.id);
      if (!nextPreviousEntry) {
        break;
      }
      results.unshift(await nextPreviousEntry.fullInfoWithContinuations());
    }
    return res.status(200).json(results);
  } catch (error) {
    return next(error);
  }
}

async function flagEntry(req, res, next) {
  try {
    const user = req?.session?.user;
    const entry = req.foundEntryById;
    const reason = req.body?.reason;

    if (!reason || reason == "") {
      return res.status(400).json({ error: "Flagging an entry needs a reason." });
    }
    const flag = new Flag({ user: user?._id, entry: entry._id, reason });
    await flag.save();
    return res.status(200).json({ message: "Entry successfully flagged." });
  } catch (error) {
    return next(error);
  }
}

async function deleteFlag(req, res, next) {
  try {
    const flag = req.foundFlagById;
    await Flag.findByIdAndDelete(flag._id);
    return res.status(200).json({ message: "Flag successfully deleted." });
  } catch (error) {
    return next(error);
  }
}

async function getFlagList(req, res, next) {
  try {
    const flagArray = await Flag
      .find()
      .populate('user')
      .populate({
        path: 'entry',
        transform: entry => {
          if (entry?._id) {
            return entry;
          } else {
            return null;
          }
        }
      });
    const filteredFlagArray = flagArray.filter(e => e.entry);
    return res.status(200).json(filteredFlagArray);
  } catch (error) {
    return next(error);
  }
}

async function createEntry(storyTitle, entryTitle, bodyText, authorName, keywords, previousEntry, res) {
  if (typeof bodyText != 'string') {
    return res.status(400).json({ error: "Missing story text." });
  }
  if (typeof storyTitle != 'string') {
    return res.status(400).json({ error: "Missing story title." });
  }
  if (previousEntry != null && typeof entryTitle != 'string') {
    return res.status(400).json({ error: "Missing entry title." });
  }
  if (keywords && !isValidKeywordArray(keywords)) {
    return res.status(400).json({ error: "Request body must be an array of strings." });
  }

  keywords = Array.from(new Set(keywords));

  try {
    const entry = new Entry({
      storyTitle,
      entryTitle,
      bodyText,
      previousEntry,
      authorName,
      keywords,
    });
    if (previousEntry === null) {
      await entry.saveNewStory();
    } else {
      await entry.saveContinuationEntry({ storyId: previousEntry, storyTitle });
    }

    return res.status(201).json(await entry.fullInfo());
  } catch (error) {
    return res.status(500).json(error);
  }

}

async function createStory(req, res) {
  const { storyTitle, bodyText, keywords, } = req.body;
  await createEntry(storyTitle, null, bodyText, req.authenticatedUser.userName, keywords, null, res);
}

async function continueStory(req, res) {
  const { bodyText, entryTitle, keywords, } = req.body;
  await createEntry(req.foundEntryById.storyTitle, entryTitle, bodyText, req.authenticatedUser.userName, keywords, req.foundEntryById._id, res);
}

async function likeEntry(req, res, next) {
  try {
    if (req.foundEntryById.authorId.equals(req.authenticatedUser._id)) {
      return res.status(409).json({ error: "You cannot like your own entries." });
    }
    const likeQuery = { user: req.authenticatedUser._id, entry: req.foundEntryById._id };
    const found = await Like.findOne(likeQuery);
    if (found) {
      return res.status(409).json({ error: "You have already liked that entry." });
    }
    const like = new Like(likeQuery);
    await like.save();
    res.status(200).json({ message: "Entry liked." });
  } catch (error) {
    return next(error);
  }
}

async function unLikeEntry(req, res, next) {
  try {
    const likeQuery = { user: req.authenticatedUser._id, entry: req.foundEntryById._id };
    const found = await Like.findOne(likeQuery);
    if (!found) {
      return res.status(404).json({ error: "You have not liked that entry." });
    }
    await Like.findByIdAndDelete(found._id);
    res.status(200).json({ message: "Like successfully removed." });
  } catch (error) {
    return next(error);
  }
}

async function recursiveDeleteEntryById(id) {
  const continuations = await Entry.find({ previousEntry: id });
  continuations.forEach(entry => recursiveDeleteEntryById(entry._id));
  await Bookmark.deleteMany({ entry: id });
  await Flag.deleteMany({ entry: id });
  await Like.deleteMany({ entry: id });
  await Entry.findByIdAndDelete(id);
}

async function deleteEntryById(req, res, next) {
  try {
    await recursiveDeleteEntryById(req.foundEntryById._id);
    return res.status(200).json({ message: "Entry successfully deleted." });
  } catch (error) {
    return next(error);
  }
}

async function bookmarkEntry(req, res, next) {
  try {
    const bookmarkQuery = { user: req.authenticatedUser._id, entry: req.foundEntryById._id };
    const duplicateBookmark = await Bookmark.findOne(bookmarkQuery);
    if (duplicateBookmark) {
      return res.status(409).json({ error: "You have already liked that bookmark." })
    }
    const bookmark = new Bookmark(bookmarkQuery);
    await bookmark.save();
    return res.status(200).json({ message: "Entry bookmarked." });
  } catch (error) {
    return next(error);
  }
}

async function unBookmarkEntry(req, res, next) {
  try {
    const result = await Bookmark.findOne({ user: req.authenticatedUser._id, entry: req.foundEntryById._id });
    if (result) {
      await Bookmark.findByIdAndDelete(result._id);
      return res.status(200).json({ message: "Bookmark successfully deleted." });
    }
    return res.status(404).json({ error: "You don't have that entry bookmarked." });
  } catch (error) {
    return next(error);
  }
}

async function getKeywordList(req, res, next) {
  try {
    const { regex } = req.query;
    const query = regex ? { $match: { keywords: { $regex: regex, $options: 'i' } } } : null;
    const result = await Entry.aggregate([
      {
        $match: {
          keywords: { $not: { $size: 0 } },
        }
      },
      { $unwind: "$keywords" },
      query,
      {
        $group: {
          _id: '$keywords',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 100 },
    ].filter(stage => stage != undefined && stage != null));
    if (result.length == 0) {
      return res.status(404).json({ error: "No matching keywords found." })
    }
    return res.status(200).json(result.map(x => { return { keyword: x._id, count: x.count } }));
  } catch (error) {
    return next(error);
  }
}

async function addKeywords(req, res, next) {
  try {
    if (!isValidKeywordArray(req.body)) {
      return res.status(400).json({ error: "Request body must be an array of strings." });
    }
    req.foundEntryById.keywords = Array.from(new Set([...req.body, ...req.foundEntryById.keywords]));
    await req.foundEntryById.save();
    return res.status(200).json({ message: "Keywords successfully added." });
  } catch (error) {
    return next(error);
  }
}

async function deleteKeywords(req, res, next) {
  try {
    if (!isValidKeywordArray(req.body)) {
      return res.status(400).json({ error: "Request body must be an array of strings." });
    }
    const entryKeywords = new Set(req.foundEntryById.keywords);
    const deleteKeywords = new Set(req.body);
    if (!entryKeywords.isSupersetOf(deleteKeywords)) {
      return res.status(404).json({ error: "Keyword not found in entry." });
    }
    req.foundEntryById.keywords = Array.from(entryKeywords.difference(deleteKeywords));
    req.foundEntryById.save();
    return res.status(200).json({ message: "Keywords successfully deleted." });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  paramEntryId,
  paramFlagId,
  getEntryList,
  getEntryById,
  getChainById,
  flagEntry,
  createStory,
  continueStory,
  likeEntry,
  unLikeEntry,
  bookmarkEntry,
  unBookmarkEntry,
  deleteEntryById,
  deleteFlag,
  getFlagList,
  getKeywordList,
  addKeywords,
  deleteKeywords,
}