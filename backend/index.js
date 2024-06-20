"use strict";

const express = require('express');
const app = express();
const PORT = process.env.PORT || 5001;

const cors = require('cors');

const bcrypt = require('bcrypt');
const saltRounds = 10;

const passport = require('passport');

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

// FIXME remove when real password database is implemented
async function initUserDatabase() {
    for (const user of userDatabase.users) {
        user.passwordHash = await bcrypt.hash(user.password, saltRounds);
        delete user.password;
    }
}
initUserDatabase();

async function registerUser(user) {
    const newUserEntry = { userID: user.userID, userName: user.userName, email: user.email };
    newUserEntry.passwordHash = await bcrypt.hash(user.password, saltRounds);
    newUserEntry.userID = userDatabase.nextUserID++;
    userDatabase.users.push(newUserEntry);
    console.log('\n   Debug: ', newUserEntry);
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
        const newUser = await registerUser(user);
        console.log('\n   Debug: ', newUser);
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
        const user = findUserByName(name) || findUserByEmail(name);
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

app.get('/user', function (req, res, next) {
    const userList = userDatabase.users.map(user => {return {userID: user.userID, userName: user.userName}});
    res.status(200).json(userList);
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
