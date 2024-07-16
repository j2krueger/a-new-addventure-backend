"use strict";

import * as globals from './globals.mjs';
const { expect,
    agent,
    constants,
    newUserName,
    // newEmail,
    newPassword,
    expectMongoObjectId,
    populateUserInfo,
} = globals;

describe('Test the entry handling routes', function () {
    this.slow(1000);

    describe('GET /entry', function () {
        it('should return a 200 OK and a list of entries', async function () {
            const res = await agent
                .get('/entry');

            expect(res).to.have.status(200);
            expect(res.body).to.be.an('array').which.has.lengthOf.at.most(constants.entriesPerPage);
            for (const entry of res.body) {
                expect(entry).to.have.all.keys('storyId', 'entryId', 'storyTitle', 'entryTitle', 'authorName');
                expectMongoObjectId(entry.storyId);
                expectMongoObjectId(entry.entryId);
                expect(entry.storyTitle).to.be.a('string');
                if (entry.storyId == entry.entryId) {
                    expect(entry.entryTitle).to.be.null;
                } else {
                    expect(entry.entryTitle).to.be.a('string');
                }
                expect(entry.authorName).to.be.a('string');
            }
        });
    });

    describe('GET /entry with search query string {regex: "Freddy", fields: "a"} ', function () {
        it('should return a 200 OK list of entries with authorName matching "Freddy"', async function () {
            const res = await agent
                .get('/entry')
                .query({ regex: 'Freddy', fields: 'a' });

            expect(res).to.have.status(200);
            expect(res.body).to.be.an('array').which.has.lengthOf.at.most(constants.entriesPerPage);
            for (const entry of res.body) {
                expect(entry).to.have.all.keys('storyId', 'entryId', 'storyTitle', 'entryTitle', 'authorName');
                expectMongoObjectId(entry.storyId);
                expectMongoObjectId(entry.entryId);
                expect(entry.storyTitle).to.be.a('string');
                if (entry.storyId == entry.entryId) {
                    expect(entry.entryTitle).to.be.null;
                } else {
                    expect(entry.entryTitle).to.be.a('string');
                }
                expect(entry.authorName).to.be.a('string').which.matches(/Freddy/);
            }
        });
    });

    describe('GET /entry with search query string {regex: "dd", fields: "e"} ', function () {
        it('should return a 200 OK list of entries with entryTitle matching "dd"', async function () {
            const res = await agent
                .get('/entry')
                .query({ regex: 'dd', fields: 'e' });

            expect(res).to.have.status(200);
            expect(res.body).to.be.an('array').which.has.lengthOf.at.most(constants.entriesPerPage);
            for (const entry of res.body) {
                expect(entry).to.have.all.keys('storyId', 'entryId', 'storyTitle', 'entryTitle', 'authorName');
                expectMongoObjectId(entry.storyId);
                expectMongoObjectId(entry.entryId);
                expect(entry.storyTitle).to.be.a('string');
                expect(entry.entryTitle).to.be.a('string').which.matches(/dd/);
                expect(entry.authorName).to.be.a('string');
            }
        });
    });

    describe('GET /entry with search query string {regex: "beginning", fields: "s"} ', function () {
        it('should return a 200 OK list of entries with storyTitle matching "beginning"', async function () {
            const res = await agent
                .get('/entry')
                .query({ regex: 'beginning', fields: 's' });

            expect(res).to.have.status(200);
            expect(res.body).to.be.an('array').which.has.lengthOf.at.most(constants.entriesPerPage);
            for (const entry of res.body) {
                expect(entry).to.have.all.keys('storyId', 'entryId', 'storyTitle', 'entryTitle', 'authorName');
                expectMongoObjectId(entry.storyId);
                expectMongoObjectId(entry.entryId);
                expect(entry.storyTitle).to.be.a('string').which.matches(/beginning/);
                if (entry.storyId == entry.entryId) {
                    expect(entry.entryTitle).to.be.null;
                } else {
                    expect(entry.entryTitle).to.be.a('string');
                }
                expect(entry.authorName).to.be.a('string');
            }
        });
    });

    describe('GET /entry with search query string {regex: "dd", fields: "ae"} ', function () {
        it('should return a 200 OK list of entries with authorName OR entry title matching "dd"', async function () {
            const res = await agent
                .get('/entry')
                .query({ regex: 'dd', fields: 'ae' });

            expect(res).to.have.status(200);
            expect(res.body).to.be.an('array').which.has.lengthOf.at.most(constants.entriesPerPage);
            for (const entry of res.body) {
                expect(entry).to.have.all.keys('storyId', 'entryId', 'storyTitle', 'entryTitle', 'authorName');
                expectMongoObjectId(entry.storyId);
                expectMongoObjectId(entry.entryId);
                expect(entry.storyTitle).to.be.a('string');
                if (entry.storyId == entry.entryId) {
                    expect(entry.entryTitle).to.be.null;
                } else {
                    expect(entry.entryTitle).to.be.a('string');
                }
                expect(entry.authorName).to.be.a('string');
                expect(entry.authorName + ' ' + entry.entryTitle).to.be.a('string').which.matches(/dd/);
            }
        });
    });

    describe('POST /entry with {storyTitle: "Deterministic title", bodyText: "Deterministic text"}', function () {
        it('should return a 201 CREATED and the entry.fullInfo()', async function () {
            const loginRes = await agent
                .post('/login')
                .send({ name: newUserName, password: newPassword });

            expect(loginRes).to.have.status(200);

            const res = await agent
                .post('/entry')
                .send({ storyTitle: "Deterministic title", bodyText: "Deterministic text" });

            expect(res).to.have.status(201);
            expectMongoObjectId(res.body.storyId);
            expect(res.body.entryId).to.deep.equal(res.body.storyId);
            expect(res.body.storyTitle).to.deep.equal("Deterministic title");
            expect(res.body.entryTitle).to.be.null;
            expect(res.body.authorName).to.deep.equal(newUserName);
            expect(res.body.bodyText).to.deep.equal("Deterministic text");
            expect(res.body.previousEntry).to.be.null;
            expect(res.body.flagId).to.be.null;
            expect(res.body.likes).to.deep.equal(0);
            expect(res.body.createDate).to.be.a('string');

            const updateRes = await agent
                .get('/profile');

            expect(updateRes).to.have.status(200);
            populateUserInfo(updateRes.body);

        });
    });

});