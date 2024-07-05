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
    choiceText: {
        type: String,
        // required: ['The choice text is needed'],
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

entrySchema.methods.saveNewStory = async function saveNewStory(){
    this.storyId = this._id;
    await this.save();
}

entrySchema.methods.saveContinuationEntry = async function saveContinuationEntry(prevEntry){
    this.storyId = prevEntry.storyId;
    this.storyTitle = prevEntry.storyTitle;
    await this.save();
}
const Entry = mongoose.model("Entry", entrySchema)

module.exports = Entry