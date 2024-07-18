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
        res.status(201).json(await newUser.privateProfile());
    }
}

async function loginUser(req, res, next) {
    const name = req.body?.name;
    const password = req.body?.password;
    if (!name) {
        return res.status(400).json({ error: "Missing name." });
    } else if (!password) {
        return res.status(400).json({ error: "Missing password." });
    } else {
        const user = await User.findOne({ userName: name }) || await User.findOne({ email: name });
        if (!user || !await bcrypt.compare(password, user.passwordHash)) {
            return res.status(401).json({ error: "Incorrect name or password." });
        } else {
            req.session.regenerate(function (err) {
                if (err) next(err);
                req.session.user = user;
                req.session.save(async function (err) {
                    if (err) next(err);
                    const token = jwt.sign(
                        {
                            email: user.email,
                            userId: user._id,
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
                    return res.status(200).json(await user.privateProfile());
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
    const { regex, i, page } = req.query;
    const zPage = (Number.isSafeInteger(Number(page)) && page > 0) ? page - 1 : 0;
    const mongoQuery = {};
    if (regex) {
        mongoQuery.userName = { $regex: regex };
        if (i) {
            mongoQuery.userName["$options"] = 'i';
        }
    }
    const userList = await User.find(mongoQuery)
        .collation({ locale: "en" })
        .sort({ userName: 1 })
        .skip(zPage * constants.entriesPerPage)
        .limit(constants.entriesPerPage);
    const result = await Promise.all(userList.map(async user => user.publicInfo()));
    if (result.length) {
        return res.status(200).json(result);
    } else {
        return res.status(404).json({ error: "No matching users found." })
    }

}

// async function paramUserId(req, res, next, value) {
//     const userId = value;
// }

async function getUserInfoById(req, res, next) {
    try {
        if (typeof req.params.userId != 'string' || !/^[0-9a-f]{24}$/.test(req.params.userId)) {
            return res.status(400).json({ error: "That is not a properly formatted userId." })
        }
        const result = await User.findById(req.params.userId);
        if (!result) {
            return res.status(404).json({ error: "There is no user with that userId." });
        }
        res.status(200).json(await result.publicInfo());
    } catch (err) {
        return next(err)
    }
}

async function getProfile(req, res) {
    res.status(200).json(await req.authenticatedUser.privateProfile());
}

async function putProfile(req, res, next) {
    try {
        const result = await req.authenticatedUser.applySettings(req.body);
        req.session.user = result;
        res.status(200).json(await result.privateProfile());
    } catch (err) {
        if (err.message == "Invalid request.") {
            return res.status(400).json({ error: err.message });
        } else {
            next(err);
        }
    }
}

module.exports = {
    registerUser,
    loginUser,
    logoutUser,
    getUser,
    // paramUserId,
    getUserInfoById,
    getProfile,
    putProfile,
};