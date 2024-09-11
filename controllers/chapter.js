"use strict";

const constants = require('../helpers/constants');
const Chapter = require('../models/chapter');
const Like = require('../models/like');
const Flag = require('../models/flag');
const Bookmark = require('../models/bookmark');
const {
  isValidKeyword,
  isValidKeywordArray
} = require('../helpers/validation');

async function paramChapterId(req, res, next, value) {
  if (typeof value != 'string' || !/^[0-9a-f]{24}$/.test(value)) {
    return res.status(400).json({ error: "That is not a properly formatted chapterId." })
  }
  const chapterId = value;
  try {
    const result = await Chapter.findByIdAndPopulate(chapterId, req.session?.user?._id);
    if (result) {
      req.paramChapter = result;
    } else {
      return res.status(404).json({ error: "There is no chapter with that chapterId." });
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
      req.paramFlag = result;
    } else {
      return res.status(404).json({ error: "There is no flag with that flagId." });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

async function paramKeyword(req, res, next, value) {
  if (!isValidKeyword(value)) {
    return res.status(400).json({ error: "That is not a valid keyword." })
  }
  req.paramKeyword = value;
  return next();
}

async function getChapterList(req, res) {
  const orderLookup = {
    s: ['storyTitle', 1],
    c: ['chapterTitle', 1],
    a: ['authorName', 1],
    l: ['likes', 1],
    d: ['createDate', 1],
    S: ['storyTitle', -1],
    C: ['chapterTitle', -1],
    A: ['authorName', -1],
    L: ['likes', -1],
    D: ['createDate', -1],
  }
  const { page, storiesOnly, search, } = req.query;
  const storiesOnlyBoolean = storiesOnly && !/^false$/i.test(storiesOnly) ? true : false;
  const zPage = Number.isSafeInteger(page) && page > 0 ? page - 1 : 0;

  // Validate and separate tokens
  const tokenList = search ? search.split(/\s+/).filter(x => x) : "o:D".split(/\s+/).filter(x => x);
  const searchREString = '^((?<fields>[scabkSCAK]+):)?(?<word>[\\w.-]+)$'
  const sortREString = '^o:(?<sort>[scaldSCALD]+)$'
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
  const sortTerm = sortList.length ? sortRE.exec(sortList[0]).groups.sort : 'D'; // default to latest first
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
  const searchQuery = storiesOnlyBoolean ? { previousChapter: null } : {};
  for (const searchTerm of searchList) {
    const groups = searchRE.exec(searchTerm).groups;
    const fields = groups.fields ?? "scabK";
    const word = groups.word;

    const fieldLookup = {
      s: { storyTitle: { $regex: word, $options: 'i' } },
      c: { chapterTitle: { $regex: word, $options: 'i' } },
      a: { authorName: { $regex: word, $options: 'i' } },
      b: { bodyText: { $regex: word, $options: 'i' } },
      k: { keywords: { $regex: word, $options: 'i' } },
      S: { storyTitle: word },
      C: { chapterTitle: word },
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

  const chapterList = await Chapter.findAndPopulate(
    searchQuery,
    sortQuery,
    zPage * constants.resultsPerPage,
    constants.resultsPerPage,
    req.session?.user?._id
  );
  const result = chapterList.map(chapter => chapter.summary());
  res.status(200).json(result);
}

async function getChapterById(req, res) {
  res.status(200).json(await req.paramChapter.fullInfoWithContinuations());
}

// Potential approach for speed improvement:
// grab all chapters with the same storyId all in one query, and chain them together locally
// Since this is one big query, it may be considerably faster than repeated queries for one
// chapter at a time, but at the cost of more memory usage. Don't implement until the version
// implemented here becomes problematic.
async function getChainById(req, res, next) {
  try {
    const results = [await req.paramChapter.fullInfoWithContinuations()];
    while (results[0].previousChapter) {
      const nextPreviousChapter = await Chapter.findByIdAndPopulate(results[0].previousChapter, req?.session?.user?._id);
      if (!nextPreviousChapter) {
        break;
      }
      results.unshift(await nextPreviousChapter.fullInfoWithContinuations());
    }
    return res.status(200).json(results);
  } catch (error) {
    return next(error);
  }
}

async function flagChapter(req, res, next) {
  try {
    const user = req?.session?.user;
    const chapter = req.paramChapter;
    const reason = req.body?.reason;

    if (!reason || reason == "") {
      return res.status(400).json({ error: "Flagging a chapter needs a reason." });
    }
    const flag = new Flag({ user: user?._id, chapter: chapter._id, reason });
    await flag.save();
    return res.status(200).json({ message: "Chapter successfully flagged." });
  } catch (error) {
    return next(error);
  }
}

async function deleteFlag(req, res, next) {
  try {
    const flag = req.paramFlag;
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
      .populate('user', '-passwordHash')
      .populate({
        path: 'chapter',
        transform: chapter => {
          if (chapter?._id) {
            return chapter;
          } else {
            return null;
          }
        }
      });
    const filteredFlagArray = flagArray.filter(e => e.chapter);
    return res.status(200).json(filteredFlagArray);
  } catch (error) {
    return next(error);
  }
}

async function createChapter(storyTitle, chapterTitle, bodyText, authorName, keywords, previousChapter, res) {
  if (typeof bodyText != 'string') {
    return res.status(400).json({ error: "Missing story text." });
  }
  if (typeof storyTitle != 'string') {
    return res.status(400).json({ error: "Missing story title." });
  }
  if (previousChapter != null && typeof chapterTitle != 'string') {
    return res.status(400).json({ error: "Missing chapter title." });
  }
  if (keywords && !isValidKeywordArray(keywords)) {
    return res.status(400).json({ error: "Request body must be an array of strings." });
  }

  keywords = Array.from(new Set(keywords));

  try {
    const chapter = new Chapter({
      storyTitle,
      chapterTitle,
      bodyText,
      previousChapter,
      authorName,
      keywords,
    });
    if (previousChapter === null) {
      await chapter.saveNewStory();
    } else {
      await chapter.saveContinuationChapter({ storyId: previousChapter, storyTitle });
    }

    return res.status(201).json(await chapter.fullInfo());
  } catch (error) {
    return res.status(500).json(error);
  }

}

async function createStory(req, res) {
  const { storyTitle, bodyText, keywords, } = req.body;
  await createChapter(storyTitle, null, bodyText, req.authenticatedUser.userName, keywords, null, res);
}

async function continueStory(req, res) {
  const { bodyText, chapterTitle, keywords, } = req.body;
  await createChapter(req.paramChapter.storyTitle, chapterTitle, bodyText, req.authenticatedUser.userName, keywords, req.paramChapter._id, res);
}

async function likeChapter(req, res, next) {
  try {
    if (req.paramChapter.authorId.equals(req.authenticatedUser._id)) {
      return res.status(409).json({ error: "You cannot like your own chapters." });
    }
    const likeQuery = { user: req.authenticatedUser._id, chapter: req.paramChapter._id };
    const found = await Like.findOne(likeQuery);
    if (found) {
      return res.status(409).json({ error: "You have already liked that chapter." });
    }
    const like = new Like(likeQuery);
    await like.save();
    res.status(200).json({ message: "Chapter liked." });
  } catch (error) {
    return next(error);
  }
}

async function unLikeChapter(req, res, next) {
  try {
    const likeQuery = { user: req.authenticatedUser._id, chapter: req.paramChapter._id };
    const found = await Like.findOne(likeQuery);
    if (!found) {
      return res.status(404).json({ error: "You have not liked that chapter." });
    }
    await Like.findByIdAndDelete(found._id);
    res.status(200).json({ message: "Like successfully removed." });
  } catch (error) {
    return next(error);
  }
}

async function recursiveDeleteChapterById(id) {
  const continuations = await Chapter.find({ previousChapter: id });
  continuations.forEach(chapter => recursiveDeleteChapterById(chapter._id));
  await Bookmark.deleteMany({ chapter: id });
  await Flag.deleteMany({ chapter: id });
  await Like.deleteMany({ chapter: id });
  await Chapter.findByIdAndDelete(id);
}

async function deleteChapterById(req, res, next) {
  try {
    await recursiveDeleteChapterById(req.paramChapter._id);
    return res.status(200).json({ message: "Chapter successfully deleted." });
  } catch (error) {
    return next(error);
  }
}

async function bookmarkChapter(req, res, next) {
  try {
    const bookmarkQuery = { user: req.authenticatedUser._id, chapter: req.paramChapter._id };
    const duplicateBookmark = await Bookmark.findOne(bookmarkQuery);
    if (duplicateBookmark) {
      return res.status(409).json({ error: "You have already liked that bookmark." })
    }
    const bookmark = new Bookmark(bookmarkQuery);
    await bookmark.save();
    return res.status(200).json({ message: "Chapter bookmarked." });
  } catch (error) {
    return next(error);
  }
}

async function unBookmarkChapter(req, res, next) {
  try {
    const result = await Bookmark.findOne({ user: req.authenticatedUser._id, chapter: req.paramChapter._id });
    if (result) {
      await Bookmark.findByIdAndDelete(result._id);
      return res.status(200).json({ message: "Bookmark successfully deleted." });
    }
    return res.status(404).json({ error: "You don't have that chapter bookmarked." });
  } catch (error) {
    return next(error);
  }
}

async function getKeywordList(req, res, next) {
  try {
    const { regex } = req.query;
    const query = regex ? { $match: { keywords: { $regex: regex, $options: 'i' } } } : null;
    const result = await Chapter.aggregate([
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
    req.paramChapter.keywords = Array.from(new Set([...req.body, ...req.paramChapter.keywords]));
    await req.paramChapter.save();
    return res.status(200).json({ message: "Keywords successfully added." });
  } catch (error) {
    return next(error);
  }
}

async function deleteKeyword(req, res, next) {
  try {
    const chapterKeywordSet = new Set(req.paramChapter.keywords);
    const deleteKeywordSet = new Set([req.paramKeyword]);
    if (!chapterKeywordSet.isSupersetOf(deleteKeywordSet)) {
      return res.status(404).json({ error: "Keyword not found in chapter." });
    }
    req.paramChapter.keywords = Array.from(chapterKeywordSet.difference(deleteKeywordSet));
    req.paramChapter.save();
    return res.status(200).json({ message: "Keyword successfully deleted." });
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  paramChapterId,
  paramFlagId,
  paramKeyword,
  getChapterList,
  getChapterById,
  getChainById,
  flagChapter,
  createStory,
  continueStory,
  likeChapter,
  unLikeChapter,
  bookmarkChapter,
  unBookmarkChapter,
  deleteChapterById,
  deleteFlag,
  getFlagList,
  getKeywordList,
  addKeywords,
  deleteKeyword,
}