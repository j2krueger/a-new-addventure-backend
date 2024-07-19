"use strict";

const { ObjectId } = require('mongodb');
const mongoose = require('mongoose')
const { Schema } = mongoose

const followSchema = new Schema({
    follower: {
        type: ObjectId,
        required: ["Needs a follower"],
    },
    following: {
        type: ObjectId,
        required: ["Needs someone to follow"],
    },
});

followSchema.statics.getFollowers = async function getFollowers(followingId) {
    return await Follow.find({ following: followingId }).sort({ follower: 1 });
}

followSchema.statics.getFollowedAuthors = async function getFollowedAuthors(followerId) {
    return await Follow.find({ follower: followerId }).sort({ followed: 1 });
}


const Follow = mongoose.model("Follow", followSchema)

module.exports = Follow