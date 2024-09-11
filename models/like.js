"use strict";

const constants = require('../helpers/constants');
const { ObjectId } = require('mongodb');
const { mongoose } = constants;
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