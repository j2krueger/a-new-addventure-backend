"use strict";

const process = require('process');
require("dotenv").config();

const express = require('express');
const app = express();
const PORT = process.env.PORT || 5001;

const cors = require('cors');

const bcrypt = require('bcrypt');
const saltRounds = 10;

const passport = require('passport');

const session = require('express-session');
const sessionSecret = process.env.SESSIONSECRET;

const { MongoClient } = require("mongodb");
const databaseURI = process.env.DATABASEURI;
const dbClient = new MongoClient(databaseURI);
const dbAddventure = dbClient.db("Addventure");
const usersCollection = dbAddventure.collection("users");


app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
}));

async function registerUser(user) {
    const newUserEntry = { userName: user.userName, email: user.email };
    newUserEntry.passwordHash = await bcrypt.hash(user.password, saltRounds);
    // userDatabase.users.push(newUserEntry);
    const result = await usersCollection.insertOne(newUserEntry);
    return {
        userID: result.insertedId,
        userName: newUserEntry.userName,
        email: newUserEntry.email
    };
}

async function findUserByName(name) {
    const result = await usersCollection.findOne({ userName: name });
    return result;
}

async function findUserByEmail(email) {
    return await usersCollection.findOne({ email: email });
}


app.use(express.json());
app.use(cors({
    origin: "https://newadventures100.netlify.app",
    credentials: true
})); // FIXME work out cors

app.post('/register', async function (req, res, next) {
    const user = {
        userName: req.body?.userName,
        email: req.body?.email,
        password: req.body?.password
    };
    if (!user.userName) {
        res.status(400).json({ error: "Missing userName." });
    } else if (!user.email) {
        res.status(400).json({ error: "Missing email." });
    } else if (!user.password) {
        res.status(400).json({ error: "Missing password." });
    } else if (await findUserByName(user.userName)) {
        res.status(409).json({ error: "Username already in use." });
    } else if (await findUserByEmail(user.email)) {
        res.status(409).json({ error: "Email already in use." });
    } else {
        const newUser = await registerUser(user);
        res.status(201).json(newUser);
    }
});

app.post('/login', async function (req, res, next) {
    const name = req.body?.name;
    const password = req.body?.password;
    if (!name) {
        res.status(400).json({ error: "Missing name." });
    } else if (!password) {
        res.status(400).json({ error: "Missing password." });
    } else {
        const user = await findUserByName(name) || await findUserByEmail(name);
        if (!user || !await bcrypt.compare(password, user.passwordHash)) {
            res.status(401).json({ error: "Incorrect name or password." });
        } else {
            // FIXME need real login code
            const resultUser = {
                userID: user.userID,
                userName: user.userName,
                email: user.email
            };
            res.status(200).json(resultUser);
        }
    }
});

app.get('/user', async function (req, res, next) {
    // const userList = userDatabase.users.map(user => { return { userID: user.userID, userName: user.userName } });
    const cursor = await usersCollection.find({}, { sort: { userName: 1 }, projection: { userName: 1 } });
    const userList = (await cursor.toArray()).map(user => { return { userID: user._id, userName: user.userName }; });
    res.status(200).json(userList);
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
