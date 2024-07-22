"use strict";

// const { ObjectId } = require('mongodb');
const mongoose = require('mongoose')
const { Schema } = mongoose

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
    verified: {
        type: Boolean,
        default: false,
    }
});



const Message = mongoose.model("Message", messageSchema)

module.exports = Message