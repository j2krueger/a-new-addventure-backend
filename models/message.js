"use strict";

const constants = require('../helpers/constants');
const { mongoose } = constants;
const { Schema } = mongoose;

const messageSchema = new Schema({
    name: {
        type: String,
        default: "Anonymous",
    },
    email: {
        type: String,
        default: "No email",
    },
    messageText: {
        type: String,
        required: ['Message text is needed'],
    },
    createDate: {
        type: Date,
        default: Date.now,
    },
    verified: {
        type: Boolean,
        default: false,
    },
    read: {
        type: Boolean,
        default: false,
    },
});

const messageSetable = {
    read: "boolean",
}

messageSchema.methods.applySettings = async function applySettings(settings) {
    for (const key in settings) {
        if (!(key in messageSetable && typeof settings[key] == messageSetable[key])) {
            throw new Error("Invalid request.");
        }
    }
    for (const key in settings) {
        this[key] = settings[key];
    }
    return (await this.save());
}

const Message = mongoose.model("Message", messageSchema)

module.exports = Message