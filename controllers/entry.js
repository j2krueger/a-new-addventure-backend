"use strict";

// const constants = require('../helpers/constants');
const Entry = require('../models/entry');
const { randomBytes, } = require('node:crypto');

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

const createStory = async (req, res) => {
  try {
    const { storyTitle, body, authorName } =
      req.body;

    const createdStoryId = randomBytes(12).toString("hex");

    const entry = await Entry.create({
      storyId: createdStoryId,
      entryTitle: null,
      storyTitle,
      bodyText: body,
      previousEntry: null,
      authorName
    });
    return res.json(entry);
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  paramId,
  getEntry,
  createStory,
}