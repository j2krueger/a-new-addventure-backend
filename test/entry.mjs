"use strict";

import * as globals from './globals.mjs';
const { expect,
    constants,
    agent,
    expectMongoObjectID,
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
                expectMongoObjectID(entry.storyId);
                expectMongoObjectID(entry.entryId);
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
                expectMongoObjectID(entry.storyId);
                expectMongoObjectID(entry.entryId);
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
                expectMongoObjectID(entry.storyId);
                expectMongoObjectID(entry.entryId);
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
                expectMongoObjectID(entry.storyId);
                expectMongoObjectID(entry.entryId);
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
                expectMongoObjectID(entry.storyId);
                expectMongoObjectID(entry.entryId);
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

});