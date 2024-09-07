"use strict";

const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const User = require('./user');
const Chapter = require('./chapter');

const likeSchema = new Schema({
    user: {
        type: ObjectId,
        ref: User,
        required: ["Needs a user"],
    },
    chapter: {
        type: ObjectId,
        ref: Chapter,
        required: ["Needs a chapter"],
    },
});

const Like = mongoose.model("Like", likeSchema);

module.exports = Like;