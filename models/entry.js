"use strict";

const { ObjectId } = require('mongodb');
const mongoose = require('mongoose')
const { Schema } = mongoose

const entrySchema = new Schema({
    storyId: {
        type: ObjectId,
        required: ["Needs the 1st entry in this story"],
    },
    authorName: {
        type: String,
        required: ["Author is needed"],
    },
    entryTitle: {
        type: String,
        //   required: ['Entry Title is needed'],
    },
    storyTitle: {
        type: String,
        required: ['Story Title is needed'],
    },
    bodyText: {
        type: String,
        required: ['The body is needed'],
    },
    previousEntry: {
        type: ObjectId,
        // required: ['Previous Entry is needed'],
    },
    createDate: {
        type: Date,
        default: Date.now,
    },
    flagId: {
        type: ObjectId,
        default: null,
    },
    likes: {
        type: Number,
        default: 0,
    }
});

const Entry = mongoose.model("Entry", entrySchema)

module.exports = Entry