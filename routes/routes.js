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

//Auth post routers
router.param('userId', userControllers.paramUserId)
router.post('/register', userControllers.registerUser);
router.post('/login', userControllers.loginUser);
router.post('/logout', userControllers.logoutUser);
router.get('/user', userControllers.getUser);
router.get('/user/:userId', userControllers.getUserInfoById);
router.post('/user/:userId/follow', userAuth, userControllers.followUser);
router.get('/profile', userAuth, userControllers.getProfile);
router.put('/profile', userAuth, userControllers.putProfile)

router.param('entryId', entryControllers.paramEntryId);
router.get('/entry/:entryId', entryControllers.getEntryById);
router.post('/entry', userAuth, entryControllers.createStory);
router.post('/entry/:entryId', userAuth, entryControllers.continueStory);
router.get('/entry', entryControllers.getEntryList);

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