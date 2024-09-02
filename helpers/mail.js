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


module.exports = transporter;