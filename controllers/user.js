"use strict";

const constants = require('../helpers/constants');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const User = require('../models/user');
const jwt = require('jsonwebtoken');


async function registerUser(req, res) {
    if (!req.body?.password) {
        return res.status(400).json({ error: "Missing password." });
    }
    const userName = req.body?.userName;
    const email = req.body?.email;
    const passwordHash = await bcrypt.hash(req.body?.password, saltRounds);
    if (!userName) {
        res.status(400).json({ error: "Missing userName." });
    } else if (!email) {
        res.status(400).json({ error: "Missing email." });
    } else if ((await User.find({ userName: userName })).length) {
        res.status(409).json({ error: "Username already in use." });
    } else if ((await User.find({ email: email })).length) {
        res.status(409).json({ error: "Email already in use." });
    } else {
        const newUser = new User({
            userName: userName,
            email: email,
            passwordHash: passwordHash,
        });
        try {
            await newUser.save();
        } catch (err) {
            return res.status(500).json(err);
        }
        res.status(201).json(newUser.privateProfile());
    }
}

async function loginUser(req, res, next) {
    const name = req.body?.name;
    const password = req.body?.password;
    if (!name) {
        res.status(400).json({ error: "Missing name." });
    } else if (!password) {
        res.status(400).json({ error: "Missing password." });
    } else {
        const user = await User.findOne({ userName: name }) || await User.findOne({ email: name });
        if (!user || !await bcrypt.compare(password, user.passwordHash)) {
            res.status(401).json({ error: "Incorrect name or password." });
        } else {
            req.session.regenerate(function (err) {
                if (err) next(err);
                req.session.user = user;
                req.session.save(function (err) {
                    if (err) next(err);
                    const token = jwt.sign(
                        {
                            email: user.email,
                            userID: user._id,
                            userName: user.userName,
                        },
                        constants.jwtSecret,
                        {}
                    );
                    res.cookie("token", token, {
                        maxAge: constants.loginExpirationTime,
                        httpOnly: true,
                        secure: true,
                        sameSite: 'none',
                    });
                    res.status(200).json(user.privateProfile());
                });
            })
        }
    }
}

function logoutUser(req, res, next) {
    req.session.destroy(function (err) {
        if (err) return next(err);
        res.status(200).json({ message: "Logout successful." });
    })
}

async function getUser(req, res) {
    const userList = await User.find();
    const result = userList.map(user => user.basicInfo())
    res.status(200).json(result);
}

async function paramUserID(req, res, next, value) {
    const userID = value;
    try {
        const result = await User.findById(userID);
        if (result) {
            req.foundUserByID = result;
        }
        next();
    } catch (err) {
        return next(err)
    }
}

function getUserInfoByID(req, res) {
    if (req.foundUserByID) {
        res.status(200).json(req.foundUserByID.publicInfo());
    } else {
        res.status(404).json({ error: "There is no user with that user ID." })
    };
}

async function getProfile(req, res) {
    console.log('\n   Debug: ', 'Authenticated');
    res.status(200).json(req.authenticatedUser.privateProfile());
}

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getUser,
    paramUserID,
    getUserInfoByID,
    getProfile,
};