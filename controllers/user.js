"use strict";

const constants = require('../helpers/constants');
const bcrypt = require('bcrypt');
const { saltRounds } = constants;
const User = require('../models/user');
const Follow = require('../models/follow');
const jwt = require('jsonwebtoken');
const transporter = require('../helpers/mail');
const { randomBytes } = require('node:crypto');


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

async function paramEmailVerificationKey(req, res, next, value) {
    if (typeof value != 'string' || !/^[0-9a-f]{20}$/.test(value)) {
        return res.status(400).json({ error: "That is not a properly formatted email verification key." });
    }
    req.emailVerificationKey = value;
    return next();
}

async function sendVerificationEmailHelper(user) {
    user.emailVerificationKey = randomBytes(10).toString('hex');
    const userId = user._id;
    const email = user.email.includes(constants.testString) ? constants.testEmailAddress : user.email;
    await transporter.sendMail({
        from: constants.siteEmailAddress,
        to: email,
        subject: "Email Verification from QuiltedChronicles.org",
        html: `Just a basic link: <a href="https://quiltedchronicles.org/verify/${userId}/${user.emailVerificationKey}">Click here to verify</a>
        UserName: ${user.userName}, email: ${user.email}`,
    });
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
            await sendVerificationEmailHelper(newUser);
            await newUser.save();
        } catch (error) {
            return res.status(500).json(error);
        }
        res.status(201).json(newUser.privateProfile());
    }
}

async function sendVerificationEmail(req, res, next) {
    try {
        await sendVerificationEmailHelper(req.authenticatedUser);
        await req.authenticatedUser.save();
        res.status(200).json({ message: "Verification email sent." });
    } catch (error) {
        return next(error);
    }
}

async function verifyEmail(req, res, next) {
    try {
        if (req.foundUserById.emailVerified) {
            return res.status(409).json({ error: "Email already verified." });
        }
        if (req.foundUserById.emailVerificationKey != req.emailVerificationKey) {
            return res.status(403).json({ error: "Bad email verification key." });
        }
        req.foundUserById.emailVerified = true;
        await req.foundUserById.save();
        await User.updateOne({ _id: req.foundUserById._id }, { $unset: { emailVerificationKey: 1 } });
        return res.status(200).json({ message: "Email successfully verified." });
    } catch (error) {
        return next(error);
    }
}

async function changePassword(req, res, next) {
    try {
        const { password, newPassword } = req.body;
        if (!password) {
            return res.status(400).json({ error: "Missing password." });
        }
        if (!newPassword) {
            return res.status(400).json({ error: "Missing newPassword." });
        }
        if (!await bcrypt.compare(password, req.authenticatedUser.passwordHash)) {
            return res.status(403).json({ error: "Incorrect password." });
        }
        req.authenticatedUser.passwordHash = await bcrypt.hash(newPassword, saltRounds);
        req.authenticatedUser.save();
        return res.status(200).json({ message: "Password has been successfully changed." });
    } catch (error) {
        return next(error);
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
            req.session.regenerate(function (error) {
                if (error) next(error);
                req.session.user = user;
                req.session.save(async function (error) {
                    if (error) next(error);
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
    req.session.destroy(function (error) {
        if (error) return next(error);
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
        if (req.body.email) {
            sendVerificationEmailHelper(req.authenticatedUser);
        }
        req.session.user = result;
        res.status(200).json(result.privateProfile());
    } catch (error) {
        if (error.code) {
            return res.status(error.code).json({ error: error.message });
        } else {
            next(error);
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

async function adminGetUser(req, res) {
    const {
        // eslint-disable-next-line no-unused-vars
        passwordHash,
        ...result
    } = JSON.parse(JSON.stringify(req.foundUserById));
    res.status(200).json(result);
}

async function alterUser(req, res, next) {
    try {
        req.foundUserById = await req.foundUserById.adminApplySettings(req.body);
        const {
            // eslint-disable-next-line no-unused-vars
            passwordHash,
            ...result
        } = JSON.parse(JSON.stringify(req.foundUserById));
        return res.status(200).json(result);
    } catch (error) {
        if (error.message == "Invalid request.") {
            return res.status(400).json({ error: error.message });
        } else {
            next(error);
        }
    }
}

module.exports = {
    paramUserId,
    paramEmailVerificationKey,
    registerUser,
    verifyEmail,
    sendVerificationEmail,
    changePassword,
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
    adminGetUser,
    alterUser,
};