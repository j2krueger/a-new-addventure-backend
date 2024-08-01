"use strict";

const constants = require('../helpers/constants');
const Entry = require('../models/entry');
const Like = require('../models/like');
const Flag = require('../models/flag');

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
    return res.status(200).json({ message: "Flag successfully defeated." });
  } catch (error) {
    return next(error);
  }
}

async function getFlagList(req, res, next) {
  try {
    const flagArray = await Flag.find().populate('user entry');
    return res.status(200).json(flagArray);
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

module.exports = {
  paramEntryId,
  paramFlagId,
  getEntryList,
  getEntryById,
  flagEntry,
  deleteFlag,
  getFlagList,
  createStory,
  continueStory,
  likeEntry,
  unLikeEntry,
}