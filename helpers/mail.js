"use strict";

const nodemailer = require('nodemailer');
const constants = require('./constants');
const { unescapeHTML } = require('../helpers/validation');

const transporter = nodemailer.createTransport({
    service: 'zoho',
    auth: {
        user: constants.siteEmailAddress,
        pass: constants.siteEmailPassword,
    }
});


async function sendVerificationEmailHelper(user) {
    const userId = user._id;
    const email = user.email.includes(constants.testString) ? constants.testEmailAddress : unescapeHTML(user.email);
    transporter.sendMail({
        from: constants.siteEmailAddress,
        to: email,
        subject: "Email Verification from QuiltedChronicles.org",
        html: `Just a basic link: <a href="https://quiltedchronicles.org/verify/${userId}/${user.emailVerificationKey}">Click here to verify</a>
        UserName: ${user.userName}, email: ${user.email}`,
    }).catch((error) => {
        console.log(Date.now(), ': transporter.sendMail failed in sendVerificationEmailHelper: ', error);
    });
}

async function sendResetPasswordEmailHelper(user) {
    const userId = user._id;
    const email = user.email.includes(constants.testString) ? constants.testEmailAddress : unescapeHTML(user.email);
    transporter.sendMail({
        from: constants.siteEmailAddress,
        to: email,
        subject: "Password Reset from QuiltedChronicles.org",
        html: `Just a basic link: <a href="https://quiltedchronicles.org/resetpassword/${userId}/${user.resetPasswordKey}">Click here to reset your password</a>
        UserName: ${user.userName}, email: ${user.email}`,
    }).catch((error) => {
        console.log(Date.now(), ': transporter.sendMail failed in sendResetPasswordEmailHelper: ', error);
    });
}

module.exports = {
    transporter,
    sendVerificationEmailHelper,
    sendResetPasswordEmailHelper,
};
