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
    const followersList = await Follow.find({ following: followingId }).sort({ follower: 1 });
    return followersList.map(entry => entry.follower);
}

followSchema.statics.getFollowedAuthors = async function getFollowedAuthors(followerId) {
    const followedAuthorsList = await Follow.find({ follower: followerId }).sort({ followed: 1 });
    return followedAuthorsList.map(entry => entry.following);
}


const Follow = mongoose.model("Follow", followSchema)

module.exports = Follow