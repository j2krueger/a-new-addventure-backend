"use strict";

const constants = require('../helpers/constants');
const Entry = require('../models/entry');

async function paramId(req, res, next, value) {
  const entryId = value;
  try {
    const result = await Entry.findById(entryId);
    if (result) {
      req.foundEntryById = result;
    }
    next();
  } catch (err) {
    return next(err)
  }
}

const getEntry = async (req, res) => {
  try {
    const entryId = req.params.id;
    const entry = await Entry.findById(entryId);
    const result = await entry.fullInfoWithContinuations();

    // Send the user data back to the client
    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching entry:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

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

    return res.status(201).json(entry.fullInfo());
  } catch (error) {
    return res.status(500).json(error);
  }
};

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

    return res.status(201).json(entry);
  } catch (error) {
    return res.status(500).json(error);
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
  const { page, regex, fields, order } = req.query;
  const zPage = Number.isSafeInteger(page) && page > 0 ? page - 1 : 0;
  const entryQuery = {};
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
  const entryList = await Entry.find(entryQuery)
    .collation({ locale: "en" })
    .sort(sortQuery)
    .skip(zPage * constants.entriesPerPage)
    .limit(constants.entriesPerPage);
  const result = entryList.map(entry => entry.summary());
  res.status(200).json(result);
}

module.exports = {
  paramId,
  getEntry,
  createStory,
  continueStory,
  getEntryList,
}