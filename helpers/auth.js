"use strict";

const User = require('../models/user.js');

async function userAuth(req, res, next) {
    if (req.authenticatedUser) { // We've already done this on this request, no need to hit the database again
        return next()
    }
    if (req?.session?.user?._id) {
        const user = await User.findById(req.session.user._id);
        if (user) {
            req.authenticatedUser = user;
            return next();
        }
    }
    res.redirect('/login');
}

module.exports = userAuth;