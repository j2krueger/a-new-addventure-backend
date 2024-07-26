"use strict";

const { ObjectId } = require('mongodb');
const mongoose = require('mongoose')
const { Schema } = mongoose

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
    likes: {
        type: Number,
        default: 0,
    }
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

//continuationEntries
entrySchema.virtual('continuationEntries', {
    ref: 'Entry',
    localField: '_id',
    foreignField: 'previousEntry',
})

entrySchema.statics.findByIdAndPopulate = async function findByIdAndPopulate(id) {
    const result = await Entry.findById(id)
        .populate({
            path: 'authorId',
            transform: auth => auth._id,
        })
        .populate({
            path: 'continuationEntries',
            transform: entry => entry.summary(),
        });
    return result;
}

entrySchema.statics.findAndPopulate = async function findAndPopulate(entryQuery, sortQuery, skip, limit) {
    const result = await Entry.find(entryQuery, null, {
        collation: { locale: 'en' },
        sort: sortQuery,
        skip: skip,
        limit: limit,
    })
        .populate({
            path: 'authorId',
            transform: auth => auth._id,
        });
    return result;
}

entrySchema.methods.saveNewStory = async function saveNewStory() {
    this.storyId = this._id;
    await this.save();
    await this.populate({
        path: 'authorId',
        transform: auth => auth._id,
    });
}

entrySchema.methods.saveContinuationEntry = async function saveContinuationEntry(prevEntry) {
    this.storyId = prevEntry.storyId;
    this.storyTitle = prevEntry.storyTitle;
    await this.save();
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
        createDate: this.createDate,
        storyId: this.storyId,
        continuationEntries: this.continuationEntries,
    };
}

const Entry = mongoose.model("Entry", entrySchema);

module.exports = Entry;