"use strict";

const constants = require('../helpers/constants');
const Entry = require('../models/entry');
const Like = require('../models/like');
const Flag = require('../models/flag');
const Bookmark = require('../models/bookmark');

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
  } catch (err) {
    return next(err);
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
  } catch (err) {
    return next(err);
  }
}

async function getEntryList(req, res) {
  const fieldLookup = {
    s: 'storyTitle',
    e: 'entryTitle',
    a: 'authorName',
    b: 'bodyText',
  }
  const orderLookup = {
    s: ['storyTitle', 1],
    e: ['entryTitle', 1],
    a: ['authorName', 1],
    l: ['likes', 1],
    c: ['createDate', 1],
    b: ['bodyText', 1],
    S: ['storyTitle', -1],
    E: ['entryTitle', -1],
    A: ['authorName', -1],
    L: ['likes', -1],
    C: ['createDate', -1],
    B: ['bodyText', -1],
  }
  const { page, regex, fields, order, storiesOnly } = req.query;
  const zPage = Number.isSafeInteger(page) && page > 0 ? page - 1 : 0;
  const entryQuery = storiesOnly ? { previousEntry: null } : {};
  if (regex) {
    entryQuery["$or"] = [];
    for (const fieldChar of (fields || "seab")) {
      if (fieldChar in fieldLookup) {
        const field = fieldLookup[fieldChar];
        const queryPart = {};
        queryPart[field] = { $regex: regex };
        if (!entryQuery["$or"].find(element => field in element)) {
          entryQuery["$or"].push(queryPart);
        } else {
          return res.status(400).json({ error: "Misformed query string." });
        }
      } else {
        return res.status(400).json({ error: "Misformed query string." });
      }
    }
  }
  const sortQuery = {}
  const sortArray = (order || "C").split('').map(order => orderLookup[order]);
  if (order) {
    for (const sortField of sortArray) {
      if (sortField && !(sortField[0] in sortQuery)) {
        sortQuery[sortField[0]] = sortField[1];
      } else {
        return res.status(400).json({ error: "Misformed query string." });
      }
    }
  }
  sortQuery["_id"] = 1; // make sure the sort order is completely unambiguous so it plays well with pagination
  const entryList = await Entry.findAndPopulate(
    entryQuery,
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

async function createStory(req, res) {
  const { storyTitle, bodyText, } = req.body;

  if (typeof storyTitle != 'string') {
    return res.status(400).json({ error: "Missing story title." });
  } else if (typeof bodyText != 'string') {
    return res.status(400).json({ error: "Missing story text." });
  }

  try {
    const entry = new Entry({
      storyTitle,
      bodyText,
      previousEntry: null,
      authorName: req.authenticatedUser.userName,
    });
    await entry.saveNewStory();

    return res.status(201).json(await entry.fullInfo());
  } catch (error) {
    return res.status(500).json(error);
  }
}

async function continueStory(req, res) {
  const { bodyText, entryTitle, } = req.body;
  if (typeof bodyText != 'string') {
    return res.status(400).json({ error: "Missing story text." });
  } else if (typeof entryTitle != 'string') {
    return res.status(400).json({ error: "Missing entry title." });
  }

  try {
    const entry = new Entry({
      bodyText,
      entryTitle,
      authorName: req.authenticatedUser.userName,
      previousEntry: req.foundEntryById._id,
    })
    await entry.saveContinuationEntry(req.foundEntryById);

    return res.status(201).json(await entry.fullInfo());
  } catch (error) {
    return res.status(500).json(error);
  }
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

async function deleteEntryById(req, res, next) {
  try {
    await Bookmark.deleteMany({ entry: req.foundEntryById._id });
    await Flag.deleteMany({ entry: req.foundEntryById._id });
    await Like.deleteMany({ entry: req.foundEntryById._id });
    await Entry.findByIdAndDelete(req.foundEntryById._id);
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
}