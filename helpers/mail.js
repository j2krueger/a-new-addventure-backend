"use strict";

const nodemailer = require('nodemailer');
const constants = require('./constants');

const transporter = nodemailer.createTransport({
    service: 'zoho',
    auth: {
        user: constants.siteEmailAddress,
        pass: constants.siteEmailPassword,
    }
});


async function sendVerificationEmailHelper(user) {
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

module.exports = {
    transporter,
    sendVerificationEmailHelper,
};
