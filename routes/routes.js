"use strict";

const constants = require('../helpers/constants');
const userAuth = require('../helpers/auth');
const express = require('express');
const router = express.Router();
const cors = require('cors');
const userControllers = require('../controllers/user');
const entryControllers = require('../controllers/entry');


router.use(cors({
    origin: constants.corsAllowURLs,
    credentials: true
}));

//Auth post routers
router.post('/register', userControllers.registerUser);
router.post('/login', userControllers.loginUser);
router.post('/logout', userControllers.logoutUser);
router.get('/user', userControllers.getUser);
router.get('/user/:userID', userControllers.getUserInfoByID);
router.get('/profile', userAuth, userControllers.getProfile);
router.put('/profile', userAuth, userControllers.putProfile)

router.param('id', entryControllers.paramId);
router.get('/entry/:id', entryControllers.getEntry);
router.post('/entry', userAuth, entryControllers.createStory);
router.post('/entry/:id', userAuth, entryControllers.continueStory);
router.get('/entry', entryControllers.getEntryList);

if (constants.localDeploy && constants.testing) { // use on loca
    router.get('/sessioncheck', function (req, res) {
        res.status(200).json(req.session);
    });
}


module.exports = router;