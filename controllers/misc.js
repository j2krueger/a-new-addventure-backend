"use strict";

// const constants = require('../helpers/constants');
const Message = require('../models/message');
const User = require('../models/user');
const Chapter = require('../models/chapter');

async function paramMessageId(req, res, next, value) {
    if (typeof value != 'string' || !/^[0-9a-f]{24}$/.test(value)) {
        return res.status(400).json({ error: "That is not a properly formatted messageId." })
    }
    try {
        const result = await Message.findById(value);
        if (!result) {
            return res.status(404).json({ error: "There is no message with that messageId." });
        }
        req.paramMessage = result;
        return next()
    } catch (error) {
        return next(error);
    }

}

async function postMessage(req, res) {
    const { name, email, messageText, useLoginInfo } = req.body;
    let loggedInUser = null;
    if (typeof messageText == 'string') {
        try {
            if (req?.session?.user?._id) {
                loggedInUser = await User.findById(req.session.user._id);
            }
            if (loggedInUser && (useLoginInfo || (name == loggedInUser.userName && email == loggedInUser.email))) {
                const message = new Message({ name: loggedInUser.userName, email: loggedInUser.email, messageText, verified: true });
                await message.save();
            } else {
                if (useLoginInfo) {
                    return res.redirect('/login');
                }
                const message = new Message({ name, email, messageText });
                await message.save();
            }
        } catch (error) {
            return res.status(500).json(error);
        }
        return res.status(200).json({ message: "Message sent." });
    } else {
        return res.status(400).json({ error: "Message text is missing." });
    }
}

async function getMessage(req, res) {
    const { unread } = req.query;
    const query = unread ? { read: false } : {};
    const messages = await Message.find(query);
    res.status(200).json(messages);
}

async function putMessage(req, res, next) {
    try {
        const result = await req.paramMessage.applySettings(req.body);
        res.status(200).json(result);
    } catch (error) {
        if (error.message == "Invalid request.") {
            return res.status(400).json({ error: "Invalid request." });
        } else {
            next(error);
        }
    }
}

async function deleteMessage(req, res, next) {
    try {
        await Message.findByIdAndDelete(req.paramMessage._id);
        return res.status(204).end();
    } catch (error) {
        next(error);
    }
}

async function getStats(req, res, next) {
    try {
        const result = {};
        result.users = await User.countDocuments();
        result.stories = await Chapter.countDocuments({ previousChapter: null })
        result.chapters = await Chapter.countDocuments();
        return res.status(200).json(result);
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    paramMessageId,
    postMessage,
    getMessage,
    putMessage,
    deleteMessage,
    getStats,
}