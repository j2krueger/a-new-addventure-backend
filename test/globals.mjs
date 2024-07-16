"use strict";

import { expect, use } from 'chai';
import chaiHttp from "chai-http";
const chai = use(chaiHttp);
const constants = (await import('../helpers/constants.js')).default;
const mongoose = (await import("mongoose")).default;
const agent = chai.request.agent(constants.mochaTestingUrl);

import User from '../models/user.js';
import Entry from '../models/entry.js';

const newUserName = "test-" + Math.random();
const newEmail = newUserName + "@example.com";
const newPassword = Math.random() + "-" + Math.random();
let _newUserPrivateProfile;
let _newUserPublicInfo;
let _newUserBasicInfo;

function populateUserInfo(newUser) {
    _newUserPrivateProfile = newUser;
    const { userID, userName, email, publishEmail, bio, publishedEntries } = newUser;
    _newUserPublicInfo = { userID, userName, email: publishEmail ? email : "", bio, publishedEntries };
    _newUserBasicInfo = { userID, userName };
}

function newUserPrivateProfile() {
    return _newUserPrivateProfile;
}

function newUserPublicInfo() {
    return _newUserPublicInfo;
}

function expectMongoObjectID(object) {
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
    newUserName,
    newEmail,
    newPassword,
    newUserPrivateProfile,
    newUserPublicInfo,
    newUserBasicInfo,
    // models
    User,
    Entry,
    // functions
    populateUserInfo,
    expectMongoObjectID,
};