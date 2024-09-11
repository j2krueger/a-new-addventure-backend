"use strict";

const constants = require('../helpers/constants');
const { ObjectId } = require('mongodb');
const { mongoose } = constants;
const { Schema } = mongoose;
const User = require('./user');

const followSchema = new Schema({
    follower: {
        type: ObjectId,
        ref: User,
        required: ["Needs a follower"],
    },
    following: {
        type: ObjectId,
        ref: User,
        required: ["Needs someone to follow"],
    },
});

followSchema.statics.getFollowers = async function getFollowers(followingId) {
    const followersList = await Follow.find({ following: followingId }).populate('follower');
    return followersList
        .map(chapter => { return { userId: chapter.follower._id, userName: chapter.follower.userName } })
        .sort((a, b) => { return (a.userName.toLowerCase() < b.userName.toLowerCase()) ? -1 : (a.userName.toLowerCase() > b.userName.toLowerCase()) ? 1 : 0 });
}

followSchema.statics.getFollowedAuthors = async function getFollowedAuthors(followerId) {
    const followedAuthorsList = await Follow.find({ follower: followerId }).populate({ path: 'following' });
    return followedAuthorsList
        .map(chapter => { return { userId: chapter.following._id, userName: chapter.following.userName } })
        .sort((a, b) => { return (a.userName.toLowerCase() < b.userName.toLowerCase()) ? -1 : (a.userName.toLowerCase() > b.userName.toLowerCase()) ? 1 : 0 });
}


const Follow = mongoose.model("Follow", followSchema)

module.exports = Follow