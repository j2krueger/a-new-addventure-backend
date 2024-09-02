"use strict";

const constants = require('../helpers/constants');
const { userAuth, unlockedUserAuth, entryAuthorAuth, adminAuth } = require('../helpers/auth');
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

// All param middleware goes here
router.param('userId', userControllers.paramUserId);
router.param('entryId', entryControllers.paramEntryId);
router.param('flagId', entryControllers.paramFlagId);
router.param('keywordValue', entryControllers.paramKeyword);
router.param('messageId', miscControllers.paramMessageId);
router.param('emailVerificationKey', userControllers.paramEmailVerificationKey);

// All routes starting with /admin are restricted to logged in admins
router.use('/admin', adminAuth);

// All admin routes go here
router.delete('/admin/entry/:entryId', entryControllers.deleteEntryById);
router.delete('/admin/flag/:flagId', entryControllers.deleteFlag);
router.get('/admin/flag', entryControllers.getFlagList);
router.get('/admin/message', miscControllers.getMessage);
router.put('/admin/message/:messageId', miscControllers.putMessage);
router.delete('/admin/message/:messageId', miscControllers.deleteMessage);
router.post('/admin/user/:userId/lock', userControllers.lockUser);
router.delete('/admin/user/:userId/lock', userControllers.unlockUser);
router.get('/admin/user/:userId', userControllers.adminGetUser);
router.put('/admin/user/:userId', userControllers.alterUser);
router.put('/admin/entry/:entryId/keyword', entryControllers.addKeywords);
router.delete('/admin/entry/:entryId/keyword/:keywordValue', entryControllers.deleteKeyword);

// user related routes
router.post('/register', userControllers.registerUser);
router.post('/login', userControllers.loginUser);
router.post('/logout', userControllers.logoutUser);
router.get('/user', userControllers.getUser);
router.get('/user/:userId', userControllers.getUserInfoById);
router.post('/verify/:userId/:emailVerificationKey', userControllers.verifyEmail);
// authorized user related routes
router.post('/user/:userId/follow', userAuth, userControllers.followUser);
router.delete('/user/:userId/follow', userAuth, userControllers.unFollowUser);
router.get('/profile', userAuth, userControllers.getProfile);
router.put('/profile', userAuth, userControllers.putProfile);
router.post('/verify', userAuth, userControllers.sendVerificationEmail);

// unauthorized entry routes
router.get('/entry', entryControllers.getEntryList);
router.get('/entry/:entryId', entryControllers.getEntryById);
router.post('/entry/:entryId/flag', entryControllers.flagEntry);
router.get('/chain/:entryId', entryControllers.getChainById);
router.get('/keyword', entryControllers.getKeywordList);
// authorized entry related routes
router.post('/entry', unlockedUserAuth, entryControllers.createStory);
router.post('/entry/:entryId', unlockedUserAuth, entryControllers.continueStory);
router.post('/entry/:entryId/like', userAuth, entryControllers.likeEntry);
router.delete('/entry/:entryId/like', userAuth, entryControllers.unLikeEntry);
router.post('/entry/:entryId/bookmark', userAuth, entryControllers.bookmarkEntry);
router.delete('/entry/:entryId/bookmark', userAuth, entryControllers.unBookmarkEntry);
router.put('/entry/:entryId/keyword', entryAuthorAuth, entryControllers.addKeywords);
router.delete('/entry/:entryId/keyword/:keywordValue', entryAuthorAuth, entryControllers.deleteKeyword);

// miscellaneous routes
router.post('/message', miscControllers.postMessage);
router.get('/stats', miscControllers.getStats);

module.exports = router;