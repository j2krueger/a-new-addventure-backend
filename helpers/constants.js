"use strict";

const process = require('process');
require("dotenv").config();

// Usefuf lengths of time
const oneSecondInMilliseconds = 1000;
const oneMinuteInMilliseconds = 60 * oneSecondInMilliseconds;
const oneHourInMilliseconds = 60 * oneMinuteInMilliseconds;
const oneDayInMilliseconds = 24 * oneHourInMilliseconds;
const oneWeekInMilliseconds = 7 * oneDayInMilliseconds;
const oneMonthInMilliseconds = 30 * oneDayInMilliseconds;
const oneYearInMilliseconds = 365 * oneDayInMilliseconds;
const entriesPerPage = 20;

module.exports = {
    // Useful lengths of time
    oneSecondInMilliseconds,
    oneMinuteInMilliseconds,
    oneHourInMilliseconds,
    oneDayInMilliseconds,
    oneWeekInMilliseconds,
    oneMonthInMilliseconds,
    oneYearInMilliseconds,

    // Standardise these across the application
    loginExpirationTime: oneWeekInMilliseconds,
    entriesPerPage,

    // configuration values loaded from .env
    databaseURI: process.env.DATABASEURI,
    port: process.env.PORT,
    sessionSecret: process.env.SESSIONSECRET,
    jwtSecret: process.env.JWT_SECRET,
    corsAllowURLs: process.env.SERVER_URL.split(' '),
    dbName: process.env.DBNAME,
    localDeploy: process.env.LOCALDEPLOY,
    testing: process.env.TESTING,
    mochaTestingUrl: process.env.MOCHA_TESTING_URL,
}
