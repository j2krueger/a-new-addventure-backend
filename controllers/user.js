"use strict";

const constants = require('../helpers/constants');
const bcrypt = require('bcrypt');
const { minimumPasswordLength, maximumUserNameLength, saltRounds } = constants;
const { randomBytes } = require('crypto');
const { sendResetPasswordEmailHelper } = require('../helpers/mail');
const User = require('../models/user');
const Follow = require('../models/follow');
const jwt = require('jsonwebtoken');

async function paramUserId(req, res, next, value) {
    if (typeof value != 'string' || !/^[0-9a-f]{24}$/.test(value)) {
        return res.status(400).json({ error: "That is not a properly formatted userId." });
    }
    try {
        const result = await User.findByIdAndPopulate(value);
        if (!result) {
            return res.status(404).json({ error: "There is no user with that userId." });
        }
        req.paramUser = result;
        return next();
    } catch (error) {
        return next(error);
    }
}

async function paramEmailVerificationKey(req, res, next, value) {
    if (typeof value != 'string' || !/^[0-9a-f]{20}$/.test(value)) {
        return res.status(400).json({ error: "That is not a properly formatted email verification key." });
    }
    req.paramEmailVerificationKey = value;
    return next();
}

async function paramResetPasswordKey(req, res, next, value) {
    if (typeof value != 'string' || !/^[0-9a-f]{20}$/.test(value)) {
        return res.status(400).json({ error: "That is not a properly formatted reset password key." });
    }
    req.paramResetPasswordKey = value;
    return next();
}

async function registerUser(req, res) {
    if (!req.body?.password) {
        return res.status(400).json({ error: "Missing password." });
    }
    if (req.body.password.length < minimumPasswordLength) {
        return res.status(400).json({ error: 'Password must be at least ' + minimumPasswordLength + ' characters long.' });
    }
    const userName = req.body?.userName;
    const email = req.body?.email;
    const passwordHash = await bcrypt.hash(req.body?.password, saltRounds);
    if (!userName) {
        res.status(400).json({ error: "Missing userName." });
    } else if (userName.length > maximumUserNameLength) {
        res.status(400).json({ error: "Username may not be longer than " + maximumUserNameLength + " characters." });
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
            await newUser.unverifyEmail();
            await newUser.save();
        } catch (error) {
            return res.status(500).json(error);
        }
        res.status(201).json(newUser.privateProfile());
    }
}

async function sendVerificationEmail(req, res, next) {
    try {
        await req.authenticatedUser.unverifyEmail();
        await req.authenticatedUser.save();
        res.status(200).json({ message: "Verification email sent." });
    } catch (error) {
        return next(error);
    }
}

async function verifyEmail(req, res, next) {
    try {
        if (req.paramUser.emailVerified) {
            return res.status(409).json({ error: "Email already verified." });
        }
        if (req.paramUser.emailVerificationKey != req.paramEmailVerificationKey) {
            return res.status(403).json({ error: "Bad email verification key." });
        }
        req.paramUser.emailVerified = true;
        req.paramUser.emailVerificationKey = undefined;
        await req.paramUser.save();
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
        if (newPassword.length < minimumPasswordLength) {
            return res.status(400).json({ error: 'Password must be at least ' + minimumPasswordLength + ' characters long.' });
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

async function sendResetPasswordEmail(req, res, next) {
    try {
        const { name } = req.body;
        if (typeof name != "string") {
            return res.status(400).json({ error: "Bad request." });
        }
        const user = await User.findOne({ userName: name }) || await User.findOne({ email: name });
        if (!user) {
            return res.status(404).json({ error: "No account has that email or userName." });
        }
        if (!user.emailVerified) {
            return res.status(403).json({ error: "That account does not have a verified email address." });
        }
        user.resetPasswordKey = randomBytes(10).toString('hex');
        user.resetPasswordTime = new Date();
        await user.save();
        sendResetPasswordEmailHelper(user);
        return res.status(200).json({ message: "Password reset email has been sent." });
    } catch (error) {
        return next(error);
    }
}

async function resetPassword(req, res, next) {
    try {
        const { password } = req.body;
        if (typeof password != "string") {
            return res.status(400).json({ error: "Password must be a string." });
        }
        if (password.length < minimumPasswordLength) {
            return res.status(400).json({ error: 'Password must be at least ' + minimumPasswordLength + ' characters long.' });
        }
        if (!req.paramUser.resetPasswordKey) {
            return res.status(403).json({ error: "No resetPasswordKey set for that user." });
        }
        if (req.paramUser.resetPasswordKey != req.paramResetPasswordKey) {
            return res.status(403).json({ error: "Incorrect reset password key." });
        }
        if ((Date.now() - new Date(req.paramUser.resetPasswordTime)) >= constants.passwordResetTime) {
            return res.status(403).json({ error: "Reset password key has expired." });
        }
        req.paramUser.passwordHash = await bcrypt.hash(password, saltRounds);
        req.paramUser.resetPasswordKey = undefined;
        req.paramUser.resetPasswordTime = undefined;
        await req.paramUser.save();
        return res.status(200).json({ message: "Password successfully reset." });
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
            });
        }
    }
}

function logoutUser(req, res, next) {
    req.session.destroy(function (error) {
        if (error) return next(error);
        res.status(200).json({ message: "Logout successful." });
    });
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
    const userList = await User.findAndPopulate(mongoQuery, zPage * constants.resultsPerPage, constants.resultsPerPage);
    const result = await Promise.all(userList.map(async user => user.publicInfo()));
    if (result.length) {
        return res.status(200).json(result);
    } else {
        return res.status(404).json({ error: "No matching users found." });
    }

}

async function getUserInfoById(req, res) {
    return res.status(200).json(await req.paramUser.publicInfo());
}

async function getProfile(req, res) {
    res.status(200).json(req.authenticatedUser.privateProfile());
}

async function putProfile(req, res, next) {
    try {
        const result = await req.authenticatedUser.applySettings(req.body);
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
    const query = { follower: req.authenticatedUser._id, following: req.paramUser._id };
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
        return next(error);
    }
}

async function unFollowUser(req, res, next) {
    try {
        const query = { follower: req.authenticatedUser._id, following: req.paramUser._id };
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
        const user = req.paramUser;
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
        const user = req.paramUser;
        if (!user.locked) {
            return res.status(409).json({ error: "That user is not locked." });
        }
        user.locked = false;
        await user.save();
        return res.status(200).json({ message: "User successfully unlocked." });
    } catch (error) {
        return next(error);
    }
}

async function adminGetUser(req, res) {
    const {
        // eslint-disable-next-line no-unused-vars
        passwordHash,
        ...result
    } = JSON.parse(JSON.stringify(req.paramUser));
    res.status(200).json(result);
}

async function alterUser(req, res, next) {
    try {
        req.paramUser = await req.paramUser.adminApplySettings(req.body);
        const {
            // eslint-disable-next-line no-unused-vars
            passwordHash,
            ...result
        } = JSON.parse(JSON.stringify(req.paramUser));
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
    paramResetPasswordKey,
    registerUser,
    verifyEmail,
    sendVerificationEmail,
    changePassword,
    sendResetPasswordEmail,
    resetPassword,
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