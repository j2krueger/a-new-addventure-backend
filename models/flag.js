"use strict";

const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const User = require('./user');
const Entry = require('./entry');

const flagSchema = new Schema({
    user: {
        type: ObjectId,
        ref: User,
        default: null,
    },
    entry: {
        type: ObjectId,
        ref: Entry,
        required: ["Needs an entry"],
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