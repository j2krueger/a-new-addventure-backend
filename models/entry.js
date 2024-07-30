"use strict";

const { ObjectId } = require('mongodb');
const mongoose = require('mongoose');
const { Schema } = mongoose;

const entrySchema = new Schema({
    storyId: {
        type: ObjectId,
        required: ["Needs the 1st entry in this story"],
    },
    authorName: {
        type: String,
        required: ["Author is needed"],
    },
    entryTitle: {
        type: String,
        default: null,
    },
    storyTitle: {
        type: String,
        required: ['Story Title is needed'],
    },
    bodyText: {
        type: String,
        required: ['The body is needed'],
    },
    previousEntry: {
        type: ObjectId,
        default: null,
    },
    createDate: {
        type: Date,
        default: Date.now,
    },
    flagId: {
        type: ObjectId,
        default: null,
    },
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

entrySchema.virtual('authorId', {
    ref: 'User',
    localField: 'authorName',
    foreignField: 'userName',
    justOne: true,
})

entrySchema.virtual('continuationEntries', {
    ref: 'Entry',
    localField: '_id',
    foreignField: 'previousEntry',
})

entrySchema.virtual('likes', {
    ref: 'Like',
    localField: '_id',
    foreignField: 'entry',
    count: true,
})

entrySchema.methods.setLikedByUser = async function setLikedByUser(userId) {
    if (userId) {
        const result = await mongoose.model('Like').findOne({ user: userId, entry: this._id });
        this.likedByUser = !!result;
    }
}

entrySchema.statics.findByIdAndPopulate = async function findByIdAndPopulate(id, userId) {
    const result = await Entry.findById(id)
        .populate('likes')
        .populate({
            path: 'authorId',
            transform: auth => auth._id,
        })
        .populate({
            path: 'continuationEntries',
            transform: entry => entry.summary(),
        });
    if (result) {
        await result.setLikedByUser(userId);
    }
    return result;
}

entrySchema.statics.findAndPopulate = async function findAndPopulate(entryQuery, sortQuery, skip, limit, userId) {
    const result = await Entry.find(entryQuery, null, {
        collation: { locale: 'en' },
        sort: sortQuery,
        skip: skip,
        limit: limit,
    })
        .populate('likes')
        .populate({
            path: 'authorId',
            transform: auth => auth._id,
        });
    await Promise.all(result.map(entry => entry.setLikedByUser(userId)));
    return result;
}

entrySchema.methods.saveNewStory = async function saveNewStory() {
    this.storyId = this._id;
    await this.save();
    await this.populate('likes');
    await this.populate({
        path: 'authorId',
        transform: auth => auth._id,
    });
}

entrySchema.methods.saveContinuationEntry = async function saveContinuationEntry(prevEntry) {
    this.storyId = prevEntry.storyId;
    this.storyTitle = prevEntry.storyTitle;
    await this.save();
    await this.populate('likes');
    await this.populate({
        path: 'authorId',
        transform: auth => auth._id,
    });
}

entrySchema.methods.summary = function summary() {
    return {
        storyId: this.storyId,
        entryId: this._id,
        storyTitle: this.storyTitle,
        entryTitle: this.entryTitle,
        authorName: this.authorName,
        authorId: this.authorId,
        previousEntry: this.previousEntry,
        likes: this.likes,
        likedByUser: this.likedByUser,
    };
}

entrySchema.methods.fullInfo = async function fullInfo() {
    return {
        storyId: this.storyId,
        entryId: this._id,
        storyTitle: this.storyTitle,
        entryTitle: this.entryTitle,
        authorName: this.authorName,
        authorId: this.authorId,
        bodyText: this.bodyText,
        previousEntry: this.previousEntry,
        flagId: this.flagId,
        likes: this.likes,
        likedByUser: this.likedByUser,
        createDate: this.createDate,
    };
}

entrySchema.methods.fullInfoWithContinuations = async function fullInfoWithContinuations() {
    return {
        entryId: this._id,
        authorName: this.authorName,
        authorId: this.authorId,
        entryTitle: this.entryTitle,
        storyTitle: this.storyTitle,
        bodyText: this.bodyText,
        previousEntry: this.previousEntry,
        flagId: this.flagId,
        likes: this.likes,
        likedByUser: this.likedByUser,
        createDate: this.createDate,
        storyId: this.storyId,
        continuationEntries: this.continuationEntries,
    };
}

const Entry = mongoose.model("Entry", entrySchema);

module.exports = Entry;