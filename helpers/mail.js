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

const commonPreHtml = `<!doctype html>
<html>
    <head>
        <title>
        </title>
        <style>
            .myStyle {
                font-size: 24px !important;
            }
        </style>
    </head>
<body><span class="myStyle">`;
const commonPostHtml = `<p>If you don&apos;t know why you have recieved this email, you can safely mark it as spam, delete it, or ignore it.
    If you recieve several of these emails and are unhappy about it, you can contact us at ${constants.siteEmailAddress},
    and we&apos;ll fix the issue as quickly as we can.</p>
    </span></body></html>`;


async function sendVerificationEmailHelper(user) {
    const userId = user._id;
    const email = user.email.includes(constants.testString) ? constants.testEmailAddress : unescapeHTML(user.email);
    const html = commonPreHtml + `<p>Hello, ${user.userName}, and welcome to QuiltedChronicles.org!</p>
    <p>To verify your email address at QuiltedChronicles.org, just
    <a href="https://quiltedchronicles.org/verify/${userId}/${user.emailVerificationKey}">Click here</a>.</p>` + commonPostHtml;
    console.log(`${Date.now()}: Sending verification email to ${user.userName} with userId ${userId} at ${email}...`);
    transporter.sendMail({
        from: constants.siteEmailAddress,
        to: email,
        subject: "Email Verification from QuiltedChronicles.org",
        html,
    }).next((info) => {
        console.log(`${Date.now()}: Success! ${info}`);
    }).catch((error) => {
        console.log(`${Date.now()}: Oops! transporter.sendMail failed in sendVerificationEmailHelper: ${error}.`);
    });
}

async function sendResetPasswordEmailHelper(user) {
    const userId = user._id;
    const resetKey = user.resetPasswordKey;
    const email = user.email.includes(constants.testString) ? constants.testEmailAddress : unescapeHTML(user.email);
    const html = commonPreHtml + `<p>Hello, ${user.userName}, we&apos;ve recieved your request to reset your password. Just
        <a href="https://quiltedchronicles.org/resetpassword/${userId}/${resetKey}">click here</a> and follow the
        instructions on the page it takes you to.</p>`+ commonPostHtml;
    console.log(`${Date.now()}: Sending password reset email to ${user.userName} with userId ${userId} and ${resetKey} at ${email}...`);
    transporter.sendMail({
        from: constants.siteEmailAddress,
        to: email,
        subject: "Password Reset from QuiltedChronicles.org",
        html,
    }).next((info) => {
        console.log(`${Date.now()}: Success! ${info}`);
    }).catch((error) => {
        console.log(`${Date.now()}: Oops! transporter.sendMail failed in sendVerificationEmailHelper: ${error}.`);
    });
}

module.exports = {
    transporter,
    sendVerificationEmailHelper,
    sendResetPasswordEmailHelper,
};
