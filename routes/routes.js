"use strict";

const constants = require('../helpers/constants');
const { userAuth, adminAuth } = require('../helpers/auth');
const express = require('express');
const router = express.Router();
const cors = require('cors');
const userControllers = require('../controllers/user');
const entryControllers = require('../controllers/entry');
const miscControllers = require('../controllers/misc');


router.use(cors({
    origin: constants.corsAllowURLs,
    credentials: true
}));

// user related routes
router.param('userId', userControllers.paramUserId)
router.post('/register', userControllers.registerUser);
router.post('/login', userControllers.loginUser);
router.post('/logout', userControllers.logoutUser);
router.get('/user', userControllers.getUser);
router.get('/user/:userId', userControllers.getUserInfoById);
// authorized user related routes
router.post('/user/:userId/follow', userAuth, userControllers.followUser);
router.delete('/user/:userId/follow', userAuth, userControllers.unFollowUser);
router.get('/profile', userAuth, userControllers.getProfile);
router.put('/profile', userAuth, userControllers.putProfile)

// entry related routes
router.param('entryId', entryControllers.paramEntryId);
router.get('/entry/:entryId', entryControllers.getEntryById);
router.get('/entry', entryControllers.getEntryList);
// authorized entry related routes
router.post('/entry', userAuth, entryControllers.createStory);
router.post('/entry/:entryId', userAuth, entryControllers.continueStory);
router.post('/entry/:entryId/like', userAuth, entryControllers.likeEntry);
router.delete('/entry/:entryId/like', userAuth, entryControllers.unLikeEntry);

// miscelaneous routes
router.post('/message', miscControllers.postMessage);
router.param('messageId', miscControllers.paramMessageId);
// admin routes
router.use('/admin', adminAuth);
router.get('/admin/message', miscControllers.getMessage);
router.put('/admin/message/:messageId', miscControllers.putMessage);
router.delete('/admin/message/:messageId', miscControllers.deleteMessage);

if (constants.localDeploy && constants.testing) { // use on loca
    router.get('/sessioncheck', function (req, res) {
        res.status(200).json(req.session);
    });
}


module.exports = router;