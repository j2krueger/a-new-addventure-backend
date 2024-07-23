"use strict";

// const constants = require('../helpers/constants');
const Message = require('../models/message');
const User = require('../models/user');

async function postMessage(req, res) {
    const { name, email, messageText, useLoginInfo } = req.body;
    if (messageText && typeof messageText == 'string') {
        try {
            if (useLoginInfo) {
                if (req?.session?.user?._id && await User.findById(req.session.user._id)) {
                    const message = new Message({ name: req.session.user.userName, email: req.session.user.email, messageText, verified: true });
                    await message.save();
                } else {
                    return res.redirect('/login');
                }
            } else {
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

module.exports = {
    postMessage,
    getMessage,
}