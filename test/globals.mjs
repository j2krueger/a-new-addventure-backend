"use strict";

import { expect, use } from 'chai';
import chaiHttp from "chai-http";
const chai = use(chaiHttp);
const constants = (await import('../helpers/constants.js')).default;
const mongoose = (await import("mongoose")).default;
const agent = chai.request.agent(constants.mochaTestingUrl);

import User from '../models/user.js';
import Entry from '../models/entry.js';
import Follow from '../models/follow.js';
import Message from '../models/message.js';

const testString = "testkurmdlqazsvnepyhs";
const newUserName = testString + Math.random();
const newEmail = newUserName + "@example.com";
const newPassword = Math.random() + "-" + Math.random();
let _newUserPrivateProfile;
let _newUserPublicInfo;
let _newUserBasicInfo;

function populateUserInfo(newUser) {
    _newUserPrivateProfile = JSON.parse(JSON.stringify(newUser));
    const { userId, userName, email, publishEmail, bio, publishedEntries } = newUser;
    _newUserPublicInfo = { userId, userName, email: publishEmail ? email : "", bio, publishedEntries };
    _newUserBasicInfo = { userId, userName };
}

function newUserPrivateProfile() {
    return _newUserPrivateProfile;
}

function newUserPublicInfo() {
    return _newUserPublicInfo;
}

function expectMongoObjectId(object) {
    expect(object).to.be.a('string').that.matches(/^[0-9a-f]{24}$/);
}

function newUserBasicInfo() {
    return _newUserBasicInfo;
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
    newUserPrivateProfile,
    newUserPublicInfo,
    newUserBasicInfo,
    // models
    User,
    Entry,
    Follow,
    Message,
    // functions
    populateUserInfo,
    expectMongoObjectId,
};