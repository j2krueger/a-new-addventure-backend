"use strict";

// const process = require('process');
// require("dotenv").config();
const constants = require('./helpers/constants')
const express = require("express");
const session = require('express-session');

const { MongoClient } = require("mongodb");
const mongoClient = new MongoClient(constants.databaseURI);
const MongoStore = require('connect-mongo');
const mongoStore = MongoStore.create({
    client: mongoClient,
    dbName: constants.dbName,
    ttl: constants.loginExpirationTime,
});

if (constants.testing) {
    console.log('\n   constants: ', constants);
}

const mongoose = require("mongoose");
// const cookieParser = require("cookie-parser");
// const path = require('path');
const morgan = require('morgan');

const app = express();

//Database Connection
mongoose.connect(constants.databaseURI, { dbName: constants.dbName })
    .then(() => console.log('Database Connected'))
    .catch(() => console.log("Database not conected"))


//middleware
app.use(express.json());
// app.use(cookieParser());
app.use(express.urlencoded({ extended: false }));
app.disable('x-powered-by');
app.use(morgan(function (tokens, req, res) {
    return [
        tokens.method(req, res),
        tokens.url(req, res),
        tokens.status(req, res),
        tokens.res(req, res, 'content-length'), '-',
        tokens['response-time'](req, res), 'ms',
        "req.body:", JSON.stringify(req.body)
    ].join(' ')
}));

if (constants.localDeploy) {
    app.use(session({
        secret: constants.sessionSecret,
        resave: false,
        saveUninitialized: false,
        store: mongoStore,
        cookie: {
            httpOnly: true,
            maxAge: constants.loginExpirationTime,
            sameSite: 'strict',
        }
    }));
} else {
    app.set('trust proxy', 1);
    app.use(session({
        secret: constants.sessionSecret,
        resave: false,
        saveUninitialized: false,
        store: mongoStore,
        cookie: {
            httpOnly: true,
            maxAge: constants.loginExpirationTime,
            sameSite: 'strict',
            secure: true,
            // domain: '.quiltedchronicles.org',
        }
    }));
}

// API Routes
app.use('/', require('./routes/routes'))


app.listen(constants.port, () => {
    console.log(`Listening on port ${constants.port}`);
});
