"use strict";

const User = require('../models/user.js');

async function userAuth(req, res, next) {
    if (req.authenticatedUser) { // We've already done this on this request, no need to hit the database again
        return next()
    }
    if (req?.session?.user?._id) {
        const user = await User.findByIdAndPopulate(req.session.user._id);
        if (user) {
            req.authenticatedUser = user;
            return next();
        }
    }
    res.redirect('/login');
}

async function unlockedUserAuth(req, res, next) {
    if (req.authenticatedUser) { // We've already done this on this request, no need to hit the database again
        return next()
    }
    if (req?.session?.user?._id) {
        const user = await User.findByIdAndPopulate(req.session.user._id);
        if (user && !user.locked) {
            req.authenticatedUser = user;
            return next();
        }
    }
    res.redirect('/login');
}

async function entryAuthorAuth(req, res, next) {
    if (req.authenticatedUser) { // We've already done this on this request, no need to hit the database again
        return next()
    }
    if (req?.session?.user?._id) {
        const user = await User.findByIdAndPopulate(req.session.user._id);
        if (user && !user.locked && user.userName == req.paramEntry.authorName) {
            req.authenticatedUser = user;
            return next();
        }
    }
    res.redirect('/login');
}

async function modAuth(req, res, next) {
    if (req.authenticatedUser) { // We've already done this on this request, no need to hit the database again
        return next()
    }
    if (req?.session?.user?._id) {
        const user = await User.findByIdAndPopulate(req.session.user._id);
        if (user && !user.locked && user.moderator) {
            req.authenticatedUser = user;
            return next();
        }
    }
    res.redirect('/login');
}

async function adminAuth(req, res, next) {
    if (req.authenticatedUser) { // We've already done this on this request, no need to hit the database again
        return next()
    }
    if (req?.session?.user?._id) {
        const user = await User.findByIdAndPopulate(req.session.user._id);
        if (user && user.admin) { // Admins can be locked, but it does nothing
            req.authenticatedUser = user;
            return next();
        }
    }
    res.redirect('/login');
}

module.exports = {
    userAuth,
    unlockedUserAuth,
    entryAuthorAuth,
    modAuth,
    adminAuth,
};