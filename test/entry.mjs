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
                expect(entry).to.have.all.keys('entryID', 'storyTitle', 'entryTitle');
                expectMongoObjectID(entry.entryID);
                expect(entry.storyTitle).to.be.a('string');
                try {
                    expect(entry.entryTitle).to.be.a('string');
                } catch {
                    expect(entry.entryTitle).to.be.null;
                }
            }
        });
    });
});