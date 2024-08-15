"use strict";

const constants = require('../helpers/constants');
const bcrypt = require('bcrypt');
const saltRounds = 10;
const User = require('../models/user');
const Follow = require('../models/follow');
const jwt = require('jsonwebtoken');


async function paramUserId(req, res, next, value) {
    if (typeof value != 'string' || !/^[0-9a-f]{24}$/.test(value)) {
        return res.status(400).json({ error: "That is not a properly formatted userId." })
    }
    try {
        const result = await User.findByIdAndPopulate(value);
        if (!result) {
            return res.status(404).json({ error: "There is no user with that userId." });
        }
        req.foundUserById = result;
        return next()
    } catch (error) {
        return next(error);
    }
}

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
                    const fullUser = await User.findByIdAndPopulate(user._id);
                    return res.status(200).json(fullUser.privateProfile());
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
    const userList = await User.findAndPopulate(mongoQuery, zPage * constants.entriesPerPage, constants.entriesPerPage);
    const result = await Promise.all(userList.map(async user => user.publicInfo()));
    if (result.length) {
        return res.status(200).json(result);
    } else {
        return res.status(404).json({ error: "No matching users found." })
    }

}

async function getUserInfoById(req, res) {
    return res.status(200).json(await req.foundUserById.publicInfo())
}

async function getProfile(req, res) {
    res.status(200).json(req.authenticatedUser.privateProfile());
}

async function putProfile(req, res, next) {
    try {
        const result = await req.authenticatedUser.applySettings(req.body);
        req.session.user = result;
        res.status(200).json(result.privateProfile());
    } catch (err) {
        if (err.message == "Invalid request.") {
            return res.status(400).json({ error: err.message });
        } else {
            next(err);
        }
    }
}

async function followUser(req, res, next) {
    const query = { follower: req.authenticatedUser._id, following: req.foundUserById._id };
    if (query.follower.equals(query.following)) {
        return res.status(409).json({ error: "Following yourself means you're going around in circles." });
    }
    const alreadyFollowed = await Follow.findOne(query);
    if (alreadyFollowed) {
        return res.status(409).json({ error: "You are already following that user." });
    }
    const newFollow = new Follow(query);
    try {
        await newFollow.save();
        return res.status(200).json({ message: "Follow successful." });
    } catch (error) {
        return next(error)
    }
}

async function unFollowUser(req, res, next) {
    try {
        const query = { follower: req.authenticatedUser._id, following: req.foundUserById._id };
        const result = await Follow.findOneAndDelete(query);
        if (result) {
            return res.status(200).json({ message: 'Author successfully unfollowed.' });
        } else {
            return res.status(404).json({ error: 'No follow to remove.' });
        }
    } catch (error) {
        return next(error);
    }
}

async function lockUser(req, res, next) {
    try {
        const user = req.foundUserById;
        if (user.locked) {
            return res.status(409).json({ error: "That user is already locked." });
        }
        user.locked = true;
        user.save();
        return res.status(200).json({ message: "User successfully locked." });
    } catch (error) {
        return next(error);
    }
}

async function unlockUser(req, res, next) {
    try {
        const user = req.foundUserById;
        if (!user.locked) {
            return res.status(409).json({ error: "That user is not locked." });
        }
        user.locked = false;
        await user.save();
        return res.status(200).json({ message: "User successfully unlocked." })
    } catch (error) {
        return next(error);
    }
}

module.exports = {
    paramUserId,
    registerUser,
    loginUser,
    logoutUser,
    getUser,
    getUserInfoById,
    getProfile,
    putProfile,
    followUser,
    unFollowUser,
    lockUser,
    unlockUser,
};