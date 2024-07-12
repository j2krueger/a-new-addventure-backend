"use strict";

const constants = require('../helpers/constants');
const Entry = require('../models/entry');

async function paramId(req, res, next, value) {
  const entryID = value;
  try {
    const result = await Entry.findById(entryID);
    if (result) {
      req.foundEntryByID = result;
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
  const { storyTitle, bodyText, entryTitle, } = req.body;

  if (typeof storyTitle != 'string') {
    return res.status(400).json({ error: "Missing story title." });
  } else if (typeof bodyText != 'string') {
    return res.status(400).json({ error: "Missing story text." });
  }

  try {
    const entry = new Entry({
      entryTitle,
      storyTitle,
      bodyText,
      previousEntry: null,
      authorName: req.authenticatedUser.userName,
    });
    await entry.saveNewStory();

    return res.status(201).json(entry);
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
      previousEntry: req.foundEntryByID._id,
    })
    await entry.saveContinuationEntry(req.foundEntryByID);

    return res.status(201).json(entry);
  } catch (error) {
    return res.status(500).json(error);
  }
}

async function getEntryList(req, res) {
  const { page } = req.query;
  const zPage = Number.isSafeInteger(page) && page > 0 ? page - 1 : 0;
  const entryList = await Entry.find()
    .sort({ createDate: -1 })
    .skip(zPage * constants.entriesPerPage)
    .limit(constants.entriesPerPage);
  const result = entryList.map(entry => entry.summary());
  console.log('\n   Debug: entry.js: ', result);
  res.status(200).json(result);
}

module.exports = {
  paramId,
  getEntry,
  createStory,
  continueStory,
  getEntryList,
}