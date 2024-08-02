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
    entry: {
        type: ObjectId,
        ref: mongoose.model('Entry'),
        required: ["Needs an entry"],
    },
    createDate: {
        type: Date,
        default: Date.now,
    },
});

const Bookmark = mongoose.model("Bookmark", bookmarkSchema);

module.exports = Bookmark;