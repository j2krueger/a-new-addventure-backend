"use strict";

import { expect, use } from 'chai';
import chaiHttp from "chai-http";
const chai = use(chaiHttp);
const constants = (await import('../helpers/constants.js')).default;
const mongoose = (await import("mongoose")).default;
const agent = chai.request.agent(constants.mochaTestingUrl);

import User from '../models/user.js';
import Entry from '../models/entry.js';

function expectMongoObjectID(object) {
    expect(object).to.be.a('string').that.matches(/^[0-9a-f]{24}$/);
}

export {
    expect,
    constants,
    mongoose,
    agent,
    // models
    User,
    Entry,
    // functions
    expectMongoObjectID,
};