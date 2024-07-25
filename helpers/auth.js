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

async function modAuth(req, res, next) {
    if (req.authenticatedUser) { // We've already done this on this request, no need to hit the database again
        return next()
    }
    if (req?.session?.user?._id) {
        const user = await User.findByIdAndPopulate(req.session.user._id);
        if (user && user.moderator) {
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
        if (user && user.admin) {
            req.authenticatedUser = user;
            return next();
        }
    }
    res.redirect('/login');
}

module.exports = {
    userAuth,
    modAuth,
    adminAuth,
};