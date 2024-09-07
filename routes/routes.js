"use strict";

const constants = require('../helpers/constants');
const { userAuth, unlockedUserAuth, chapterAuthorAuth, adminAuth } = require('../helpers/auth');
const express = require('express');
const router = express.Router();
const cors = require('cors');
const userControllers = require('../controllers/user');
const chapterControllers = require('../controllers/chapter');
const miscControllers = require('../controllers/misc');

router.use(cors({
    origin: constants.corsAllowURLs,
    credentials: true
}));

// All param middleware goes here
router.param('userId', userControllers.paramUserId);
router.param('chapterId', chapterControllers.paramChapterId);
router.param('flagId', chapterControllers.paramFlagId);
router.param('keywordValue', chapterControllers.paramKeyword);
router.param('messageId', miscControllers.paramMessageId);
router.param('emailVerificationKey', userControllers.paramEmailVerificationKey);
router.param('resetPasswordKey', userControllers.paramResetPasswordKey);

// All routes starting with /admin are restricted to logged in admins
router.use('/admin', adminAuth);

// All admin routes go here
router.delete('/admin/chapter/:chapterId', chapterControllers.deleteChapterById);
router.delete('/admin/flag/:flagId', chapterControllers.deleteFlag);
router.get('/admin/flag', chapterControllers.getFlagList);
router.get('/admin/message', miscControllers.getMessage);
router.put('/admin/message/:messageId', miscControllers.putMessage);
router.delete('/admin/message/:messageId', miscControllers.deleteMessage);
router.post('/admin/user/:userId/lock', userControllers.lockUser);
router.delete('/admin/user/:userId/lock', userControllers.unlockUser);
router.get('/admin/user/:userId', userControllers.adminGetUser);
router.put('/admin/user/:userId', userControllers.alterUser);
router.put('/admin/chapter/:chapterId/keyword', chapterControllers.addKeywords);
router.delete('/admin/chapter/:chapterId/keyword/:keywordValue', chapterControllers.deleteKeyword);

// user related routes
router.post('/register', userControllers.registerUser);
router.post('/login', userControllers.loginUser);
router.post('/logout', userControllers.logoutUser);
router.get('/user', userControllers.getUser);
router.get('/user/:userId', userControllers.getUserInfoById);
router.post('/verify/:userId/:emailVerificationKey', userControllers.verifyEmail);
router.post('/resetpassword', userControllers.sendResetPasswordEmail);
router.post('/resetpassword/:userId/:resetPasswordKey', userControllers.resetPassword);
// authorized user related routes
router.post('/user/:userId/follow', userAuth, userControllers.followUser);
router.delete('/user/:userId/follow', userAuth, userControllers.unFollowUser);
router.get('/profile', userAuth, userControllers.getProfile);
router.put('/profile', userAuth, userControllers.putProfile);
router.post('/verify', userAuth, userControllers.sendVerificationEmail);
router.post('/changepassword', userAuth, userControllers.changePassword);

// unauthorized chapter routes
router.get('/chapter', chapterControllers.getChapterList);
router.get('/chapter/:chapterId', chapterControllers.getChapterById);
router.post('/chapter/:chapterId/flag', chapterControllers.flagChapter);
router.get('/chain/:chapterId', chapterControllers.getChainById);
router.get('/keyword', chapterControllers.getKeywordList);
// authorized chapter related routes
router.post('/chapter', unlockedUserAuth, chapterControllers.createStory);
router.post('/chapter/:chapterId', unlockedUserAuth, chapterControllers.continueStory);
router.post('/chapter/:chapterId/like', userAuth, chapterControllers.likeChapter);
router.delete('/chapter/:chapterId/like', userAuth, chapterControllers.unLikeChapter);
router.post('/chapter/:chapterId/bookmark', userAuth, chapterControllers.bookmarkChapter);
router.delete('/chapter/:chapterId/bookmark', userAuth, chapterControllers.unBookmarkChapter);
router.put('/chapter/:chapterId/keyword', chapterAuthorAuth, chapterControllers.addKeywords);
router.delete('/chapter/:chapterId/keyword/:keywordValue', chapterAuthorAuth, chapterControllers.deleteKeyword);

// miscellaneous routes
router.post('/message', miscControllers.postMessage);
router.get('/stats', miscControllers.getStats);

module.exports = router;