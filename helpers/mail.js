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
const commonPostHtml = `</span></body></html>`;


async function sendVerificationEmailHelper(user) {
    const userId = user._id;
    const email = user.email.includes(constants.testString) ? constants.testEmailAddress : unescapeHTML(user.email);
    const html = commonPreHtml + `<p>Hello, ${user.userName}, and welcome to QuiltedChronicles.org!</p>
        <p>To verify your email address at QuiltedChronicles.org, just
        <a href="https://quiltedchronicles.org/verify/${userId}/${user.emailVerificationKey}">Click here</a>.</p>
        <p>If you don&apos;t know why you have recieved this email, you can safely mark it as spam, delete it, or ignore it.
        If you recieve several of these emails and are unhappy about it, you can contact us at ${constants.siteEmailAddress},
        and we&apos;ll fix the issue as quickly as we can.</p>`+ commonPostHtml;
    transporter.sendMail({
        from: constants.siteEmailAddress,
        to: email,
        subject: "Email Verification from QuiltedChronicles.org",
        html,
    }).catch((error) => {
        console.log(Date.now(), ': transporter.sendMail failed in sendVerificationEmailHelper: ', error);
    });
}

async function sendResetPasswordEmailHelper(user) {
    const userId = user._id;
    const email = user.email.includes(constants.testString) ? constants.testEmailAddress : unescapeHTML(user.email);
    const html = commonPreHtml + `<p>Hello, ${user.userName}, we&apos;ve recieved your request to reset your password. Just
        <a href="https://quiltedchronicles.org/resetpassword/${userId}/${user.resetPasswordKey}">click here</a> and follow the
        instructions on the page it takes you to.</p>
        <p>If you don&apos;t know why you have recieved this email, you can safely mark it as spam, delete it, or ignore it.
        If you recieve several of these emails and are unhappy about it, you can contact us at ${constants.siteEmailAddress},
        and we&apos;ll fix the issue as quickly as we can.</p>`+ commonPostHtml;
    transporter.sendMail({
        from: constants.siteEmailAddress,
        to: email,
        subject: "Password Reset from QuiltedChronicles.org",
        html,
    }).catch((error) => {
        console.log(Date.now(), ': transporter.sendMail failed in sendResetPasswordEmailHelper: ', error);
    });
}

module.exports = {
    transporter,
    sendVerificationEmailHelper,
    sendResetPasswordEmailHelper,
};
