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
        required: ['Entry Title is needed'],
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
});

entrySchema.methods.saveNewStory = async function saveNewStory() {
    this.storyId = this._id;
    await this.save();
}

entrySchema.methods.saveContinuationEntry = async function saveContinuationEntry(prevEntry) {
    this.storyId = prevEntry.storyId;
    this.storyTitle = prevEntry.storyTitle;
    await this.save();
}

entrySchema.methods.summary = function summary() {
    return { entryID: this._id, storyTitle: this.storyTitle, entryTitle: this.entryTitle };
}

entrySchema.methods.fullInfo = function fullInfo(){
    return {
        entryID: this._id,
        authorName: this.authorName,
        entryTitle: this.entryTitle,
        storyTitle: this.storyTitle,
        bodyText: this.bodyText,
        previousEntry: this.previousEntry,
        flagId: this.flagId,
        likes: this.likes,
        createDate: this.createDate,
        storyId: this.storyId,
    };
}

entrySchema.methods.getContinuations = async function getContinuations() {
    return (await Entry.find({ previousEntry: this._id })).map(entry => entry.summary());
}

entrySchema.methods.fullInfoWithContinuations = async function fullInfoWithContinuations(){
    return {
        entryID: this._id,
        authorName: this.authorName,
        entryTitle: this.entryTitle,
        storyTitle: this.storyTitle,
        bodyText: this.bodyText,
        previousEntry: this.previousEntry,
        flagId: this.flagId,
        likes: this.likes,
        createDate: this.createDate,
        storyId: this.storyId,
        continuationEntries: await this.getContinuations(),
    };
}

const Entry = mongoose.model("Entry", entrySchema)

module.exports = Entry