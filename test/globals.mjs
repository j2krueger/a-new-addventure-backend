"use strict";

import { expect, use } from 'chai';
import chaiHttp from "chai-http";
const chai = use(chaiHttp);
const constants = (await import('../helpers/constants.js')).default;
const mongoose = (await import("mongoose")).default;
const agent = chai.request.agent(constants.mochaTestingUrl);

import User from '../models/user.js';
import Chapter from '../models/chapter.js';
import Follow from '../models/follow.js';
import Message from '../models/message.js';
import Like from '../models/like.js';
import Flag from '../models/flag.js';
import Bookmark from '../models/bookmark.js';

const { testString } = constants;
const newUserName = testString + Math.random();
const newEmail = newUserName + "@example.com";
const newPassword = Math.random() + "-" + Math.random();
const testUserLogin = { name: newUserName, password: newPassword };
const adminLogin = { name: "Freddy", password: constants.adminPassword };
const testStory = { storyTitle: testString, bodyText: testString, keywords: ["testStory", testString, newUserName] };
const testStory1 = { storyTitle: "Test story 1", bodyText: testString, keywords: ["testStory", testString, newUserName] };
const testStory2 = { storyTitle: "Test story 2", bodyText: testString, keywords: ["testStory", testString, newUserName] };
const testChapter = { chapterTitle: testString + "1", bodyText: testString, keywords: ["testChapter", testString, newUserName] };
const testChapter1a = { chapterTitle: "Test chapter 1A", bodyText: testString, keywords: ["testChapter", testString, newUserName] };
const testChapter1b = { chapterTitle: "Test chapter 1B", bodyText: testString, keywords: ["testChapter", testString, newUserName] };
const testChapter1aa = { chapterTitle: "Test chapter 1AA", bodyText: testString, keywords: ["testChapter", testString, newUserName] };
let _newUserPrivateProfile;
let _newUserPublicInfo;
let _newUserBasicInfo;
let _verificationEmailCount = 0;

const summaryKeys = ['storyId', 'chapterId', 'storyTitle', 'chapterTitle', 'authorName', 'authorId', 'previousChapter', 'likes', 'keywords'];

function populateUserInfo(newUser) {
    _newUserPrivateProfile = JSON.parse(JSON.stringify(newUser));
    const { userId, userName, email, publishEmail, bio, publishedChapters } = newUser;
    _newUserPublicInfo = { userId, userName, email: publishEmail ? email : "", bio, publishedChapters };
    _newUserBasicInfo = { userId, userName };
}

function newUserPrivateProfile() {
    return _newUserPrivateProfile;
}

function newUserPublicInfo() {
    return _newUserPublicInfo;
}

function newUserBasicInfo() {
    return _newUserBasicInfo;
}

function shouldSendEmail() {
    _verificationEmailCount++;
}

function expectedNumberOfEmails() {
    return _verificationEmailCount;
}

function expectMongoObjectId(object) {
    expect(object).to.be.a('string').that.matches(/^[0-9a-f]{24}$/);
}

function deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
}

export {
    // resources
    expect,
    mongoose,
    agent,
    // constants
    constants,
    testString,
    newUserName,
    newEmail,
    newPassword,
    testUserLogin,
    adminLogin,
    testStory,
    testStory1,
    testStory2,
    testChapter,
    testChapter1a,
    testChapter1b,
    testChapter1aa,
    newUserPrivateProfile,
    newUserPublicInfo,
    newUserBasicInfo,
    shouldSendEmail,
    expectedNumberOfEmails,
    summaryKeys,
    // models
    User,
    Chapter,
    Follow,
    Message,
    Like,
    Flag,
    Bookmark,
    // functions
    populateUserInfo,
    expectMongoObjectId,
    deepCopy,
};