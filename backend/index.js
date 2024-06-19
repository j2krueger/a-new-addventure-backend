"use strict";

const express = require('express');
const app = express();
const PORT = 5001; // 443:https 80:http FIXME: read from .env

// FIXME memory only database only until we get a real database set up
const userDatabase = {
    nextUserID: 1974,
    users: [
        {
            userID: 0,
            userName: "admin",
            email: "admin@example.com",
            password: "admin"
        },
        {
            userID: 1973,
            userName: "Freddy",
            email: "Freddy@example.com",
            password: "s33krit!"
        },
        {
            userID: 1972,
            userName: "Abba",
            email: "Bjorn@example.com",
            password: "Waterloo"
        }
    ]
};

function registerUser(user) {
    const newUserEntry = user;
    newUserEntry.userID = userDatabase.nextUserID++;
    userDatabase.users.push(newUserEntry);
    return {
        userID: newUserEntry.userID,
        userName: newUserEntry.userName,
        email: newUserEntry.email
    };
}

function findUserByName(name) {
    return userDatabase.users.find(e => e.userName == name);
}

function findUserByEmail(email) {
    return userDatabase.users.find(e => e.email == email);
}


app.use(express.json());

app.post('/register', function (req, res, next) {
    const user = {
        userName: req.body?.userName,
        email: req.body?.email,
        password: req.body?.password
    };
    console.log(user);
    console.log(userDatabase);
    if (!user.userName) {
        res.status(400).json({ error: "Missing username." });
    } else if (!user.email) {
        res.status(400).json({ error: "Missing email." });
    } else if (!user.password) {
        res.status(400).json({ error: "Missing password." });
    } else if (findUserByName(user.userName)) {
        res.status(409).json({ error: "Username already in use." });
    } else if (findUserByEmail(user.email)) {
        res.status(409).json({ error: "Email already in use." });
    } else {
        const newUser = registerUser(user);
        res.status(201).json(newUser);
    }
});

app.post('/login', function (req, res, next) {
    const name = req.body?.name;
    const password = req.body?.password;
    if (!name) {
        res.status(400).json({ error: "Missing name." });
    } else if (!password) {
        res.status(400).json({ error: "Missing password." });
    } else {
        const user = findUserByName(name) || findUserByEmail(name);
        // FIXME need real password checking
        if (!user || password != user.password) {
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

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
