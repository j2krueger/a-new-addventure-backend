"use strict";

const process = require('process');
require("dotenv").config();

const express = require('express');
const app = express();
const PORT = process.env.PORT || 5001;

const cors = require('cors');

const bcrypt = require('bcrypt');
const saltRounds = 10;

const session = require('express-session');
const sessionSecret = process.env.SESSIONSECRET;

const jwt = require('jsonwebtoken');
const jwtSecret = process.env.JWT_SECRET;

const { MongoClient, ObjectId } = require("mongodb");
const databaseURI = process.env.DATABASEURI;
const mongoClient = new MongoClient(databaseURI);
const addventureDatabase = mongoClient.db("Addventure");
const usersCollection = addventureDatabase.collection("users");
const MongoStore = require('connect-mongo');
// const oneYearInMilliseconds = 365 * 24 * 60 * 60 * 1000;
const oneWeekInMilliseconds = 7 * 24 * 60 * 60 * 1000;
const loginExpirationTime = oneWeekInMilliseconds;
const mongoStore = MongoStore.create({
    client: mongoClient,
    dbName: "Addventure",
    ttl: loginExpirationTime,
});

const morgan = require('morgan');

const defaultProfile = {
    public: {
        bio: "I haven't decided what to put in my bio yet.",
        entries: [],
        comments: [],
    },
    publishEmail: false,
    blockedKeywords: [],
    blockedAuthors: [],
    followedAuthors: [],
    followedStories: [],
    likes: [],
    dislikes: [],
    darkMode: false,
}


app.use(cors({
    origin: ["https://newadventures100.netlify.app", "http://localhost:5173"],
    credentials: true
})); 

async function registerUser(user) {
    const newUserEntry = {
        userName: user.userName,
        email: user.email,
        admin: false,
        moderator: false,
        profile: defaultProfile,
    };
    newUserEntry.passwordHash = await bcrypt.hash(user.password, saltRounds);
    const result = await usersCollection.insertOne(newUserEntry);
    return {
        userID: result.insertedId,
        userName: newUserEntry.userName,
        email: newUserEntry.email,
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

app.set('trust proxy', 1);
app.use(session({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: mongoStore,
    cookie: {
        httpOnly: true,
        maxAge: loginExpirationTime,
        sameSite: 'none',
        secure: true,
    }
}));

app.post('/register', async function (req, res) {

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
            req.session.regenerate(function (err) {
                if (err) next(err);
                const resultUser = {
                    userID: user._id,
                    userName: user.userName,
                    email: user.email
                };
                req.session.user = resultUser;
                req.session.save(function (err) {
                    if (err) next(err);
                    const token = jwt.sign(
                        {
                            email: user.email,
                            id: user._id,
                            userName: user.userName,
                        },
                        jwtSecret,
                        {}
                    );
                    res.cookie("token", token, {
                        maxAge: loginExpirationTime,
                        httpOnly: true,
                        secure: true,
                        sameSite: 'none',
                    });
                    res.status(200).json(resultUser);
                });
            })
        }
    }
});

app.post('/logout', function (req, res, next) {
    req.session.user = null;
    req.session.save(function (err) {
        if (err) return next(err);
        req.session.regenerate(function (err) {
            if (err) return next(err);
            res.status(200).json({ message: "Logout successful." });
        })
    })
});

app.get('/sessioncheck', function (req, res) {
    res.status(200).json(req.session);
});

app.get('/user', async function (req, res) {
    const cursor = await usersCollection.find({}, { sort: { userName: 1 }, projection: { userName: 1 } });
    const userList = (await cursor.toArray()).map(user => { return { userID: user._id, userName: user.userName }; });
    res.status(200).json(userList);
});

app.param('userID', async function (req, res, next, value) {
    const userID = value;
    try {
        const result = await usersCollection.findOne({ _id: new ObjectId(userID) });
        if (result) {
            req.verifiedUser = result;
        }
        next();
    } catch (err) {
        return next(err)
    }
});

app.get('/user/:userID', function (req, res) {
    if (req.verifiedUser) {
        const user = req.verifiedUser;
        const result = {
            userName: user.userName,
            email: user.profile.publishEmail ? user.email : "",
            ...user.profile.public,
        };
        res.status(200).json(result);
    } else {
        res.status(404).json({ error: "There is no user with that user ID." })
    };
});

app.get('/profile', async function (req, res) {
    const userID = req.session?.user?.userID;
    if (!userID) {
        res.status(401).json({ error: "No user logged in." });
    } else {
        const profile = (await usersCollection.findOne({ _id: new ObjectId(userID) })).profile;
        if (profile) {
            const returnedProfile = { userName: req.session.user.userName, email: req.session.user.email, ...profile }
            res.status(200).json(returnedProfile);
        } else {
            const newProfile = {
                userName: req.session.user.userName,
                email: req.session.user.email,
                userID: req.session.user.userID,
                ...(await usersCollection.findOneAndUpdate({ _id: new ObjectId(userID) }, {
                    $set: { profile: defaultProfile, }
                }, { returnDocument: 'after' }))
            };
            newProfile.userName = req.session.user.userName;
            newProfile.email = req.session.user.email;
            res.status(200).json(newProfile);
        }
    }
});

function isBoolean(value) {
    return typeof value == "boolean";
}

function isNonemptyString(value) {
    return typeof value == "string" && value.length > 0;
}

function isID(value) {
    return typeof value == "string" && /^[a-zA-Z_-]{32}$/.test(value);
}

app.put('/profile', async function (req, res) {
    const validationDispatcher = {
        "$put": {
            "public.bio": isNonemptyString,
            "publishEmail": isBoolean,
            "darkMode": isBoolean,
        },
        "$push": {
            "public.entries": isID,
            "public.comments": isID,
            "blockedKeywords": isNonemptyString,
            "blockedAuthors": isID,
            "followedAuthors": isID,
            "followedStories": isID,
        },
        "$pull": {
            "public.entries": isID,
            "public.comments": isID,
            "blockedKeywords": isNonemptyString,
            "blockedAuthors": isID,
            "followedAuthors": isID,
            "followedStories": isID,
        },
    };
    if (!req.session?.user?.userID) {
        res.status(401).json({ error: "No user logged in." });
        return;
    }

    const topLevel = req.body.entries();
    if (topLevel.length == 1) {
        const operator = topLevel[0][0];
        const bottomLevel = topLevel[0][1].entries();
        if (bottomLevel.length == 1) {
            const [setting, value] = bottomLevel[0];
            if (validationDispatcher?.[operator]?.[setting](value)) {
                const updateDocument = req.body;
                if (isID(value) && !["public.bio", "blockedKeywords"].includes(setting)) {
                    updateDocument[operator][setting] = new ObjectId(updateDocument[operator][setting]);
                }
                const result = usersCollection.updateOne({_id: req.session.user.userID}, updateDocument);
                if(result?.modifiedCount){
                    res.status(200);
                } else {
                    res.status()
                }
            }
        }
    }
    /* 
    {
        operator: "$put",
        setting: "darkMode",
        value: true,
    }
    */
    const result = validationDispatcher?.[req.body?.operator]?.[req.body?.setting](req.body?.value);
    if (result) {
        res.status(result.status).json(result.json);
    }
    res.status(400).json({ error: "Bad request format." })
});

app.head('/', function (req, res) {
    console.log(req.ip);
    res.status(200).send();
});

app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});
