"use strict";

const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const User = require('./user');
const Chapter = require('./chapter');

const flagSchema = new Schema({
    user: {
        type: ObjectId,
        ref: User,
        default: null,
    },
    chapter: {
        type: ObjectId,
        ref: Chapter,
        required: ["Needs a chapter"],
    },
    reason: {
        type: String,
        required: ["Needs a reason"],
    },
    createDate: {
        type: Date,
        default: Date.now,
    },
});

const Flag = mongoose.model("Flag", flagSchema);

module.exports = Flag;