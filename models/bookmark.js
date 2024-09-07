"use strict";

const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const { Schema } = mongoose;

const bookmarkSchema = new Schema({
    user: {
        type: ObjectId,
        ref: mongoose.model('User'),
        requred: ['Needs a user'],
    },
    chapter: {
        type: ObjectId,
        ref: mongoose.model('Chapter'),
        required: ["Needs a chapter"],
    },
    createDate: {
        type: Date,
        default: Date.now,
    },
});

const Bookmark = mongoose.model("Bookmark", bookmarkSchema);

module.exports = Bookmark;