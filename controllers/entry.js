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

    // Send the user data back to the client
    res.json(entry);
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
  } else if (typeof entryTitle != 'string') {
    return res.status(400).json({ error: "Missing entry title." });
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
  const { bodyText, entryTitle, choiceText } = req.body;
  if (typeof choiceText != 'string') {
    return res.status(400).json({ error: "Missing choice text." });
  } else if (typeof bodyText != 'string') {
    return res.status(400).json({ error: "Missing story text." });
  } else if (typeof entryTitle != 'string') {
    return res.status(400).json({ error: "Missing entry title." });
  }

  try {
    const entry = new Entry({
      bodyText,
      entryTitle,
      choiceText,
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
  const pageNumber = Number.isSafeInteger(req.query?.page) && req.query.page > 0 ? req.query.page : 1;
  const result = await Entry.find({}, null, {
    sort: { createDate: -1 },
    skip: (pageNumber - 1) * constants.entriesPerPage,
    limit: constants.entriesPerPage,
  })
  res.status(200).json(result);
}

module.exports = {
  paramId,
  getEntry,
  createStory,
  continueStory,
  getEntryList,
}