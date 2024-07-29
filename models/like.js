"use strict";

const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const User = require('./user');
const Entry = require('./entry');

const likeSchema = new Schema({
    user: {
        type: ObjectId,
        ref: User,
        required: ["Needs a user"],
    },
    entry: {
        type: ObjectId,
        ref: Entry,
        required: ["Needs an entry"],
    },
});

const Like = mongoose.model("Like", likeSchema);

module.exports = Like;