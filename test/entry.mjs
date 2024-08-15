"use strict";

import * as globals from './globals.mjs';
const {
    // resources
    expect,
    // mongoose,
    agent,
    // constants
    constants,
    testString,
    // newUserName,
    // newEmail,
    // newPassword,
    testUserLogin,
    adminLogin,
    testStory,
    testEntry,
    newUserPrivateProfile,
    // newUserPublicInfo,
    // newUserBasicInfo,
    summaryKeys,
    // models
    // User,
    Entry,
    // Follow,
    // Message,
    Like,
    Flag,
    Bookmark,
    // functions
    // populateUserInfo,
    expectMongoObjectId,
} = globals;

describe('Test the entry handling routes', function () {
    this.slow(1000);

    describe('Test the GET /entry route', function () {
        describe('Happy paths', function () {
            describe('Logout and GET /entry', function () {
                it('should return a 200 OK and a list of entries', async function () {
                    await agent.post('/logout');

                    const res = await agent.get('/entry');

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.entriesPerPage);
                    for (const entry of res.body) {
                        expect(entry).to.have.all.keys(...summaryKeys);
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

            describe('Login and GET /entry', function () {
                it('should return a 200 OK and a list of entries', async function () {
                    await agent.post('/login').send(testUserLogin);

                    const res = await agent.get('/entry');

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.entriesPerPage);
                    for (const entry of res.body) {
                        expect(entry).to.have.all.keys('likedByUser', 'bookmarkedByUser', ...summaryKeys);
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

            describe('GET /entry with search query string {storiesOnly: true}', function () {
                it('should return a 200 status and a list of stories', async function () {
                    await agent.post('/logout');

                    const res = await agent.get('/entry').query({ storiesOnly: true });

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.entriesPerPage);
                    for (const entry of res.body) {
                        expect(entry).to.have.all.keys(...summaryKeys);
                        expectMongoObjectId(entry.storyId);
                        expectMongoObjectId(entry.entryId);
                        expect(entry.storyId).to.deep.equal(entry.entryId);
                        expect(entry.storyTitle).to.be.a('string');
                        expect(entry.entryTitle).to.be.null;
                        expect(entry.previousEntry).to.be.null;
                        expect(entry.authorName).to.be.a('string');
                    }
                });
            });

            describe('GET /entry with search query string {regex: "Freddy", fields: "a"} ', function () {
                it('should return a 200 OK list of entries with authorName matching "Freddy"', async function () {
                    const res = await agent.get('/entry').query({ regex: 'Freddy', fields: 'a' });

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.entriesPerPage);
                    for (const entry of res.body) {
                        expect(entry).to.have.all.keys(...summaryKeys);
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
                    const res = await agent.get('/entry').query({ regex: 'dd', fields: 'e' });

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.entriesPerPage);
                    for (const entry of res.body) {
                        expect(entry).to.have.all.keys(...summaryKeys);
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
                    const res = await agent.get('/entry').query({ regex: 'beginning', fields: 's' });

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.entriesPerPage);
                    for (const entry of res.body) {
                        expect(entry).to.have.all.keys(...summaryKeys);
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
                    const res = await agent.get('/entry').query({ regex: 'dd', fields: 'ae' });

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.entriesPerPage);
                    for (const entry of res.body) {
                        expect(entry).to.have.all.keys(...summaryKeys);
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

            describe('GET /entry with search query string {regexp: "Freddy", fields: "w"}', function () {
                it('should return a 400 status and an error message.', async function () {
                    const res = await agent.get('/entry').query({ regex: "Freddy", fields: "w" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Misformed query string." })
                });;
            });

            describe('GET /entry with search query string {regexp: "Freddy", fields: "aea"}', function () {
                it('should return a 400 status and an error message.', async function () {
                    const res = await agent.get('/entry').query({ regex: "Freddy", fields: "aea" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Misformed query string." })
                });;
            });

            describe('GET /entry with search query string {order: "a"}', function () {
                it('should return a 200 OK list of entries sorted in increasing order by author', async function () {
                    const res = await agent.get('/entry').query({ order: "a" });

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.entriesPerPage);
                    let previous = res.body[0].authorName;
                    for (const entry of res.body) {
                        expect(entry).to.have.all.keys(...summaryKeys);
                        expectMongoObjectId(entry.storyId);
                        expectMongoObjectId(entry.entryId);
                        expect(entry.storyTitle).to.be.a('string');
                        if (entry.storyId == entry.entryId) {
                            expect(entry.entryTitle).to.be.null;
                        } else {
                            expect(entry.entryTitle).to.be.a('string');
                        }
                        expect(entry.authorName).to.be.a('string');
                        expect(previous.toLowerCase() <= entry.authorName.toLowerCase()).to.be.true;
                        previous = entry.authorName;
                    }
                });
            });

            describe('GET /entry with search query string {order: "A"}', function () {
                it('should return a 200 OK list of entries sorted in decreasing order by author', async function () {
                    const res = await agent.get('/entry').query({ order: "A" });

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.entriesPerPage);
                    let previous = res.body[0].authorName;
                    for (const entry of res.body) {
                        expect(entry).to.have.all.keys(...summaryKeys);
                        expectMongoObjectId(entry.storyId);
                        expectMongoObjectId(entry.entryId);
                        expect(entry.storyTitle).to.be.a('string');
                        if (entry.storyId == entry.entryId) {
                            expect(entry.entryTitle).to.be.null;
                        } else {
                            expect(entry.entryTitle).to.be.a('string');
                        }
                        expect(entry.authorName).to.be.a('string');
                        expect(previous.toLowerCase() >= entry.authorName.toLowerCase()).to.be.true;
                        previous = entry.authorName;
                    }
                });
            });

            describe('GET /entry with search query string {order: "e"}', function () {
                it('should return a 200 OK list of entries sorted in increasing order by entryTitle', async function () {
                    const res = await agent.get('/entry').query({ order: "e" });

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.entriesPerPage);
                    let previous = res.body[0].entryTitle;
                    for (const entry of res.body) {
                        expect(entry).to.have.all.keys(...summaryKeys);
                        expectMongoObjectId(entry.storyId);
                        expectMongoObjectId(entry.entryId);
                        expect(entry.storyTitle).to.be.a('string');
                        if (entry.storyId == entry.entryId) {
                            expect(entry.entryTitle).to.be.null;
                        } else {
                            expect(entry.entryTitle).to.be.a('string');
                            expect(previous == null || previous.toLowerCase() <= entry.entryTitle.toLowerCase()).to.be.true;
                            previous = entry.entryTitle;
                        }
                    }
                });
            });

            describe('GET /entry with search query string {order: "E"}', function () {
                it('should return a 200 OK list of entries sorted in increasing order by entryTitle', async function () {
                    const res = await agent.get('/entry').query({ order: "E" });

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.entriesPerPage);
                    let previous = res.body[0].entryTitle;
                    for (const entry of res.body) {
                        expect(entry).to.have.all.keys(...summaryKeys);
                        expectMongoObjectId(entry.storyId);
                        expectMongoObjectId(entry.entryId);
                        expect(entry.storyTitle).to.be.a('string');
                        if (entry.storyId == entry.entryId) {
                            expect(entry.entryTitle).to.be.null;
                        } else {
                            expect(entry.entryTitle).to.be.a('string');
                            expect(entry.entryTitle == null || previous.toLowerCase() >= entry.entryTitle.toLowerCase()).to.be.true;
                            previous = entry.entryTitle;
                        }
                    }
                });
            });

            describe('GET /entry with search query string {order: "sE"}', function () {
                it('should return a 200 OK list of entries sorted in increasing order by entryTitle', async function () {
                    const res = await agent.get('/entry').query({ order: "sE" });

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.entriesPerPage);
                    let previous = res.body[0];
                    for (const entry of res.body) {
                        expect(entry).to.have.all.keys(...summaryKeys);
                        expectMongoObjectId(entry.storyId);
                        expectMongoObjectId(entry.entryId);
                        expect(entry.storyTitle).to.be.a('string');
                        if (entry.storyId == entry.entryId) {
                            expect(entry.entryTitle).to.be.null;
                        } else {
                            expect(entry.entryTitle).to.be.a('string');
                        }
                        if (previous.storyTitle.toLowerCase() == entry.storyTitle.toLowerCase()) {
                            expect(entry.entryTitle == null || previous.entryTitle.toLowerCase() >= entry.entryTitle.toLowerCase()).to.be.true;
                        } else {
                            expect(previous.storyTitle.toLowerCase() < entry.storyTitle.toLowerCase())
                        }
                        previous = entry;
                    }
                });
            });
        });

        describe('Sad paths', function () {
            describe('GET /entry with search query string {order: "x"}', function () {
                it('should return a 400 status and an error message.', async function () {
                    const res = await agent.get('/entry').query({ order: "x" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Misformed query string." })
                });;
            });

            describe('GET /entry with search query string {order: "aea"}', function () {
                it('should return a 400 status and an error message.', async function () {
                    const res = await agent.get('/entry').query({ order: "aea" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Misformed query string." })
                });;
            });

            describe('GET /entry with search query string {order: "aeA"}', function () {
                it('should return a 400 status and an error message.', async function () {
                    const res = await agent.get('/entry').query({ order: "aeA" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Misformed query string." })
                });;
            });

        });
    });

    describe('Test the GET /entry/:entryId route', function () {
        describe('Happy paths', function () {
            describe('GET /entry/:entryId on a new story', function () {
                it('should return a 200 OK and the entry.fullInfoWithContinuations()', async function () {
                    const userRes = await agent.post('/login').send(testUserLogin);
                    const storyRes = await agent.post('/entry').send(testStory);

                    const res = await agent.get('/entry/' + storyRes.body.entryId);

                    expect(res).to.have.status(200);
                    expectMongoObjectId(res.body.entryId);
                    expect(res.body.entryId).to.deep.equal(storyRes.body.entryId);
                    expect(res.body.authorName).to.deep.equal(testUserLogin.name);
                    expectMongoObjectId(res.body.authorId);
                    expect(res.body.authorId).to.deep.equal(userRes.body.userId)
                    expect(res.body.entryTitle).to.be.null;
                    expect(res.body.storyTitle).to.deep.equal(testStory.storyTitle);
                    expect(res.body.bodyText).to.deep.equal(testStory.bodyText);
                    expect(res.body.previousEntry).to.be.null;
                    expect(res.body.likes).to.deep.equal(0);
                    expect(res.body.createDate).to.be.a('string');
                    expect(res.body.storyId).to.deep.equal(storyRes.body.entryId);
                    expect(res.body.continuationEntries).to.be.an('array').with.lengthOf(0);

                    await Entry.findByIdAndDelete(storyRes.body.entryId);
                });
            });

            describe('GET /entry/:entryId on a new entry', function () {
                it('should return a 200 OK and the entry.fullInfoWithContinuations()', async function () {
                    const userRes = await agent.post('/login').send(testUserLogin);
                    const storyRes = await agent.post('/entry').send(testStory);
                    const entryRes = await agent.post('/entry/' + storyRes.body.entryId).send(testEntry);

                    const res = await agent.get('/entry/' + entryRes.body.entryId);

                    expect(res).to.have.status(200);
                    expectMongoObjectId(res.body.entryId);
                    expect(res.body.entryId).to.deep.equal(entryRes.body.entryId);
                    expect(res.body.authorName).to.deep.equal(testUserLogin.name);
                    expectMongoObjectId(res.body.authorId);
                    expect(res.body.authorId).to.deep.equal(userRes.body.userId)
                    expect(res.body.entryTitle).to.deep.equal(testEntry.entryTitle);
                    expect(res.body.storyTitle).to.deep.equal(testStory.storyTitle);
                    expect(res.body.bodyText).to.deep.equal(testEntry.bodyText);
                    expect(res.body.previousEntry).to.deep.equal(storyRes.body.entryId);
                    expect(res.body.likes).to.deep.equal(0);
                    expect(res.body.createDate).to.be.a('string');
                    expect(res.body.storyId).to.deep.equal(storyRes.body.entryId);
                    expect(res.body.continuationEntries).to.be.an('array').with.lengthOf(0);

                    await Entry.findByIdAndDelete(entryRes.body.entryId);
                    await Entry.findByIdAndDelete(storyRes.body.entryId);
                });
            });
        });

        describe('Sad paths', function () {
            describe('GET /entry/notAnEntryId', function () {
                it('should return a 400 status and an error message', async function () {
                    const res = await agent.get('/entry/notAnEntryId');

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "That is not a properly formatted entryId." });
                });
            });

            describe('GET /entry/000000000000000000000000', function () {
                it('should return a 404 status and an error message', async function () {
                    const res = await agent.get('/entry/000000000000000000000000');

                    expect(res).to.have.status(404);
                    expect(res.body).to.deep.equal({ error: "There is no entry with that entryId." });
                });
            });
        });
    });

    describe('Test the POST /entry route', function () {
        describe('Happy paths', function () {
            describe('POST /entry with testStory', function () {
                it('should return a 201 CREATED and the entry.fullInfo()', async function () {
                    await agent.post('/login').send(testUserLogin);

                    const entryRes = await agent.post('/entry').send(testStory);

                    expect(entryRes).to.have.status(201);
                    expectMongoObjectId(entryRes.body.storyId);
                    expect(entryRes.body.entryId).to.deep.equal(entryRes.body.storyId);
                    expect(entryRes.body.storyTitle).to.deep.equal(testStory.storyTitle);
                    expect(entryRes.body.entryTitle).to.be.null;
                    expect(entryRes.body.authorName).to.deep.equal(testUserLogin.name);
                    expectMongoObjectId(entryRes.body.authorId);
                    expect(entryRes.body.bodyText).to.deep.equal(testStory.bodyText);
                    expect(entryRes.body.previousEntry).to.be.null;
                    expect(entryRes.body.likes).to.deep.equal(0);
                    expect(entryRes.body.createDate).to.be.a('string');

                    await Entry.findByIdAndDelete(entryRes.body.entryId);
                });
            });

            describe('POST /entry with testStory and GET /profile', function () {
                it('should return testStory from GET /profile in the publishedEntries field', async function () {
                    await agent.post('/login').send(testUserLogin);
                    const entryRes = await agent.post('/entry').send(testStory);

                    const res = await agent.get('/profile');

                    expect(res.body.publishedEntries[0].storyId).to.deep.equal(entryRes.body.storyId);
                    expect(res.body.publishedEntries[0].entryId).to.deep.equal(entryRes.body.entryId);
                    expect(res.body.publishedEntries[0].storyTitle).to.deep.equal(entryRes.body.storyTitle);
                    expect(res.body.publishedEntries[0].entryTitle).to.deep.equal(entryRes.body.entryTitle);
                    expect(res.body.publishedEntries[0].authorName).to.deep.equal(entryRes.body.authorName);
                    expect(res.body.publishedEntries[0].previousEntry).to.deep.equal(entryRes.body.previousEntry);

                    await Entry.findByIdAndDelete(entryRes.body.entryId);
                });
            });

            describe('POST /entry with testStory and GET /user/:userId', function () {
                it('should return testStory from GET /user/:userId in the publishedEntries field', async function () {
                    const loginRes = await agent.post('/login').send(testUserLogin);
                    const entryRes = await agent.post('/entry').send(testStory);

                    const res = await agent.get("/user/" + loginRes.body.userId);

                    expect(res.body.publishedEntries[0].entryId).to.deep.equal(entryRes.body.entryId);
                    expect(res.body.publishedEntries[0].storyTitle).to.deep.equal(entryRes.body.storyTitle);
                    expect(res.body.publishedEntries[0].entryTitle).to.deep.equal(entryRes.body.entryTitle);

                    await Entry.findByIdAndDelete(entryRes.body.entryId);
                });
            });
        });

        describe('Sad paths', function () {
            describe('Logout and POST /entry with testStory', function () {
                it('should redirect to /login', async function () {
                    await agent.post('/logout');

                    const res = await agent.post('/entry').send(testStory);

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                });
            });

            describe('POST /entry with missing story text', function () {
                it('should return a 400 bad request and an error message', async function () {
                    await agent.post('/login').send(testUserLogin);

                    const res = await agent.post('/entry').send({ storyTitle: "Deterministic story title" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Missing story text." })
                });
            });

            describe('Post /entry with missing story title', function () {
                it('should return a 400 bad request and an error message', async function () {
                    await agent.post('/login').send(testUserLogin);

                    const res = await agent.post('/entry').send({ bodyText: "Deterministic text" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Missing story title." });
                });
            });
        });
    });

    describe('Test the POST /entry/:entryId route', function () {
        describe('Happy paths', function () {
            describe('POST /entry/:entryId with testEntry', function () {
                it('should return a 201 status and the entry.fullInfo()', async function () {
                    const loginRes = await agent.post('/login').send(testUserLogin);
                    const storyRes = await agent.post('/entry').send(testStory);

                    const res = await agent.post('/entry/' + storyRes.body.entryId).send(testEntry);

                    expect(res).to.have.status(201);
                    expectMongoObjectId(res.body.entryId);
                    expect(res.body.storyId).to.deep.equal(storyRes.body.storyId);
                    expect(res.body.storyTitle).to.deep.equal(testStory.storyTitle);
                    expect(res.body.entryTitle).to.deep.equal(testEntry.entryTitle);
                    expect(res.body.authorName).to.deep.equal(testUserLogin.name);
                    expect(res.body.authorId).to.deep.equal(loginRes.body.userId);
                    expect(res.body.bodyText).to.deep.equal(testEntry.bodyText);
                    expect(res.body.previousEntry).to.deep.equal(storyRes.body.entryId);
                    expect(res.body.likes).to.deep.equal(0);
                    expect(res.body.createDate).to.be.a('string');

                    await Entry.findByIdAndDelete(res.body.entryId);
                    await Entry.findByIdAndDelete(storyRes.body.entryId);
                });
            });

            describe('POST /entry/:entryId with testEntry and check GET /profile', function () {
                it('should return the entry in the publishedEntries field', async function () {
                    await agent.post('/login').send(testUserLogin);
                    const storyRes = await agent.post('/entry').send(testStory);
                    const entryRes = await agent.post('/entry/' + storyRes.body.entryId).send(testEntry);

                    const res = await agent.get('/profile');

                    expect(res.body.publishedEntries[0].storyId).to.deep.equal(entryRes.body.storyId);
                    expect(res.body.publishedEntries[0].entryId).to.deep.equal(entryRes.body.entryId);
                    expect(res.body.publishedEntries[0].storyTitle).to.deep.equal(entryRes.body.storyTitle);
                    expect(res.body.publishedEntries[0].entryTitle).to.deep.equal(entryRes.body.entryTitle);
                    expect(res.body.publishedEntries[0].authorName).to.deep.equal(entryRes.body.authorName);
                    expect(res.body.publishedEntries[0].previouEntry).to.deep.equal(entryRes.body.previouEntry);

                    await Entry.findByIdAndDelete(entryRes.body.entryId);
                    await Entry.findByIdAndDelete(storyRes.body.entryId);
                });
            });

            describe('POST /entry/:entryId with testEntry and check GET /user/:userId', function () {
                it('should return the entry in the publishedEntries field', async function () {
                    const userRes = await agent.post('/login').send(testUserLogin);
                    const storyRes = await agent.post('/entry').send(testStory);
                    const entryRes = await agent.post('/entry/' + storyRes.body.entryId).send(testEntry);

                    const res = await agent.get('/user/' + userRes.body.userId);

                    expect(res.body.publishedEntries[0].entryId).to.deep.equal(entryRes.body.entryId);
                    expect(res.body.publishedEntries[0].storyTitle).to.deep.equal(entryRes.body.storyTitle);
                    expect(res.body.publishedEntries[0].entryTitle).to.deep.equal(entryRes.body.entryTitle);

                    await Entry.findByIdAndDelete(entryRes.body.entryId);
                    await Entry.findByIdAndDelete(storyRes.body.entryId);
                });
            });
        });

        describe('Sad paths', function () {
            describe('Logout and POST /entry/:entryId with testEntry', function () {
                it('should redirect to /login', async function () {
                    await agent.post('/login').send(testUserLogin);
                    const storyRes = await agent.post('/entry').send(testStory);
                    await agent.post('/logout');

                    const res = await agent.post('/entry/' + storyRes.body.entryId).send(testEntry);

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');

                    await Entry.findByIdAndDelete(storyRes.body.entryId);
                });
            });

            describe('POST /entry/:entryId with missing story text', function () {
                it('should return a 400 status and an error message', async function () {
                    await agent.post('/login').send(testUserLogin);
                    const storyRes = await agent.post('/entry').send(testStory);

                    const res = await agent.post('/entry/' + storyRes.body.entryId).send({ entryTitle: "Deterministic entry title" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Missing story text." });

                    await Entry.findByIdAndDelete(storyRes.body.entryId);
                });
            });

            describe('POST /entry/:entryId with missing entryTitle', function () {
                it('should return a 400 misformed and an error message', async function () {
                    await agent.post('/login').send(testUserLogin);
                    const storyRes = await agent.post('/entry').send(testStory);

                    const res = await agent.post('/entry/' + storyRes.body.entryId).send({ bodyText: "Deterministic text" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Missing entry title." });

                    await Entry.findByIdAndDelete(storyRes.body.entryId);
                });
            });
        });
    });

    describe('Test the POST /entry/:entryId/like route', function () {
        describe('Happy paths', function () {
            describe('Login and POST /entry/:entryId/like', function () {
                it('should return a 200 status and a success message, and add a like to the database', async function () {
                    await agent.post('/login').send(adminLogin);
                    const storyRes = await agent.post('/entry').send(testStory);
                    const loginRes = await agent.post('/login').send(testUserLogin);

                    const res = await agent.post('/entry/' + storyRes.body.entryId + '/like');
                    const likeRes = await Like.findOne({ user: loginRes.body.userId, entry: storyRes.body.entryId });

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal({ message: "Entry liked." });
                    expect(likeRes).to.not.be.null;

                    await Entry.findByIdAndDelete(storyRes.body.entryId);
                    await Like.findByIdAndDelete(likeRes._id);
                });
            });

            describe('Login and like an entry and check GET /entry/:entryId', function () {
                it('should count the like in the likes field and the likedByUser field', async function () {
                    await agent.post('/login').send(adminLogin);
                    const storyRes = await agent.post('/entry').send(testStory);
                    const loginRes = await agent.post('/login').send(testUserLogin);

                    await agent.post('/entry/' + storyRes.body.entryId + '/like');
                    const entryIdRes = await agent.get('/entry/' + storyRes.body.entryId);

                    expect(entryIdRes.body.likes).to.deep.equal(1);
                    expect(entryIdRes.body.likedByUser).to.be.true;

                    const likeIdRes = await Like.findOne({ user: loginRes.body.userId, entry: storyRes.body.entryId })
                    await Like.findByIdAndDelete(likeIdRes._id);
                    await Entry.findByIdAndDelete(storyRes.body.entryId);
                });
            });

            describe('Login and like an entry and check GET /entry?regex=<testString>', function () {
                it('should return bookmarkedByUser is true in the entry', async function () {
                    await agent.post('/login').send(adminLogin);
                    const storyRes = await agent.post('/entry').send(testStory);
                    const loginRes = await agent.post('/login').send(testUserLogin);
                    await agent.post('/entry/' + storyRes.body.entryId + '/like');

                    const entryIdRes = await agent.get('/entry').query({ regex: testString });

                    expect(entryIdRes.body).to.be.an('array').with.lengthOf(1);
                    expect(entryIdRes.body[0].likedByUser).to.be.true;

                    const likeIdRes = await Like.findOne({ user: loginRes.body.userId, entry: storyRes.body.entryId })
                    await Like.findByIdAndDelete(likeIdRes._id);
                    await Entry.findByIdAndDelete(storyRes.body.entryId);
                });
            });

            describe('Login and like an entry and check GET /profile', function () {
                it('should have the liked entry in the likedEntries field', async function () {
                    await agent.post('/login').send(adminLogin);
                    const storyRes = await agent.post('/entry').send(testStory);
                    await agent.post('/login').send(testUserLogin);
                    await agent.post('/entry/' + storyRes.body.entryId + '/like');
                    const like = await Like.findOne({ entry: storyRes.body.entryId });

                    const res = await agent.get('/profile');

                    expect(res).to.have.status(200);
                    expect(res.body.likedEntries).to.be.an('array').with.lengthOf(1);
                    expect(res.body.likedEntries[0].entryId).to.deep.equal(storyRes.body.entryId);

                    await Like.findByIdAndDelete(like._id);
                    await Entry.findByIdAndDelete(storyRes.body.entryId);
                });
            });
        });

        describe('Sad paths', function () {
            describe('Logout and POST a like to a story', function () {
                it('should redirect to /login', async function () {
                    await agent.post('/login').send(testUserLogin);
                    const storyRes = await agent.post('/entry').send(testStory);
                    await agent.post('/logout');

                    const res = await agent.post('/entry/' + storyRes.body.entryId + '/like');

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');

                    await Entry.findByIdAndDelete(storyRes.body.entryId);
                });
            });

            describe('Login, post an entry, and like the entry', function () {
                it('should return a 409 status and an error message', async function () {
                    await agent.post('/login').send(testUserLogin);
                    const entryRes = await agent.post('/entry').send(testStory);

                    const res = await agent.post('/entry/' + entryRes.body.entryId + '/like');

                    expect(res).to.have.status(409);
                    expect(res.body).to.deep.equal({ error: "You cannot like your own entries." });

                    await Entry.findByIdAndDelete(entryRes.body.entryId);
                });
            });

            describe('Login and POST a like to an already liked story', function () {
                it('should return a 409 status and an error message', async function () {
                    await agent.post('/login').send(adminLogin);
                    const storyRes = await agent.post('/entry').send(testStory);
                    await agent.post('/login').send(testUserLogin);

                    await agent.post('/entry/' + storyRes.body.entryId + '/like');
                    const res = await agent.post('/entry/' + storyRes.body.entryId + '/like');

                    expect(res).to.have.status(409);
                    expect(res.body).to.deep.equal({ error: "You have already liked that entry." });

                    await agent.delete('/entry/' + storyRes.body.entryId + '/like');
                    await Entry.findByIdAndDelete(storyRes.body.entryId);
                });
            });

            describe('Login and POST a like to a nonexistant story', function () {
                it('should return a 404 status and an error message', async function () {
                    await agent.post('/login').send(testUserLogin);

                    const res = await agent.post('/entry/000000000000000000000000/like');

                    expect(res).to.have.status(404);
                    expect(res.body).to.deep.equal({ error: "There is no entry with that entryId." });
                });
            });

            describe('Login and POST a like to a misformed storyId', function () {
                it('should return a 400 status and an error message', async function () {
                    await agent.post('/login').send(testUserLogin);

                    const res = await agent.post('/entry/blarg/like');

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "That is not a properly formatted entryId." });
                });
            });

            describe('Login and like an entry, delete the entry directly from the database, and check GET /profile', function () {
                it('should remove that like from the user\'s likedEntries list and not crash the backend', async function () {
                    await agent.post('/login').send(adminLogin);
                    const storyRes = await agent.post('/entry').send(testStory);
                    await agent.post('/login').send(testUserLogin);
                    await agent.post('/entry/' + storyRes.body.entryId + '/like');
                    const like = await Like.findOne({ entry: storyRes.body.entryId });
                    await Entry.findByIdAndDelete(storyRes.body.entryId);

                    const res = await agent.get('/profile');

                    expect(res).to.have.status(200);
                    expect(res.body.likedEntries).to.be.an('array').with.lengthOf(0);

                    await Like.findByIdAndDelete(like._id);
                });
            });
        });
    });

    describe('Test the DELETE /entry/:entryId/like route', function () {
        describe('Happy paths', function () {
            describe('Login and unlike a liked entry', function () {
                it('should return a 200 status and return a success message and remove the like from the database', async function () {
                    await agent.post('/login').send(adminLogin);
                    const storyRes = await agent.post('/entry').send(testStory);
                    await agent.post('/login').send(testUserLogin);
                    await agent.post('/entry/' + storyRes.body.entryId + '/like');

                    const res = await agent.delete('/entry/' + storyRes.body.entryId + '/like');
                    const foundLike = await Like.findOne({ entry: storyRes.body.entryId });

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal({ message: "Like successfully removed." });
                    expect(foundLike).to.be.null;

                    await Entry.findByIdAndDelete(storyRes.body.entryId);
                });
            });
        });

        describe('Sad paths', function () {
            describe('Logout and unlike a liked entry', function () {
                it('should redirect to /login', async function () {
                    await agent.post('/login').send(testUserLogin);
                    const storyRes = await agent.post('/entry').send(testStory);
                    await agent.post('/entry/' + storyRes.body.entryId + '/like');
                    await agent.post('/logout');

                    const res = await agent.delete('/entry/' + storyRes.body.entryId + '/like');

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');

                    await Entry.findByIdAndDelete(storyRes.body.entryId);
                });
            });

            describe('Login and unlike an entry that isn\'t liked', function () {
                it('should return a 404 status and an error message', async function () {
                    await agent.post('/login').send(adminLogin);
                    const storyRes = await agent.post('/entry').send(testStory);
                    await agent.post('/login').send(testUserLogin);

                    const res = await agent.delete('/entry/' + storyRes.body.entryId + '/like');

                    expect(res).to.have.status(404);
                    expect(res.body).to.deep.equal({ error: "You have not liked that entry." });

                    await Entry.findByIdAndDelete(storyRes.body.entryId);
                });
            });

            describe('Login and unlike a nonexistant entry', function () {
                it('should return a 404 status and an error message', async function () {
                    await agent.post('/login').send(testUserLogin);

                    const res = await agent.delete('/entry/000000000000000000000000/like');

                    expect(res).to.have.status(404);
                    expect(res.body).to.deep.equal({ error: "There is no entry with that entryId." });
                });
            });

            describe('Login and unlike with a bad entryId', function () {
                it('should return a 400 status and an error message', async function () {
                    await agent.post('/login').send(testUserLogin);

                    const res = await agent.delete('/entry/blarg/like');

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "That is not a properly formatted entryId." });
                });
            });
        });
    });

    describe('Test the flag handling routes', function () {
        describe('Test POST /entry/:entryId/flag', function () {
            describe('Happy paths', function () {
                describe('Logout and flag an entry', function () {
                    it('should return a 200 status and a success message, and put a flag in the database', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/entry').send(testStory);
                        await agent.post('/logout');

                        const res = await agent.post('/entry/' + storyRes.body.entryId + '/flag').send({ reason: testString });
                        const flag = await Flag.findOne({ reason: testString });

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal({ message: "Entry successfully flagged." });
                        expect(flag.entry.toString()).to.deep.equal(storyRes.body.entryId);
                        expect(flag.user).to.be.null;
                        expect(flag.reason).to.deep.equal(testString);

                        await Flag.findByIdAndDelete(flag._id);
                        await Entry.findByIdAndDelete(storyRes.body.entryId);
                    });
                });

                describe('Login and flag an entry', function () {
                    it('should return a 200 status and a success message, and put a flag in the database', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/entry').send(testStory);


                        const res = await agent.post('/entry/' + storyRes.body.entryId + '/flag').send({ reason: testString + "1" });
                        const flag = await Flag.findOne({ reason: testString + "1" });

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal({ message: "Entry successfully flagged." });
                        expect(flag.entry.toString()).to.deep.equal(storyRes.body.entryId);
                        expect(flag.user.equals(newUserPrivateProfile().userId)).to.be.true;
                        expect(flag.reason).to.deep.equal(testString + "1");

                        await Flag.findByIdAndDelete(flag._id);
                        await Entry.findByIdAndDelete(storyRes.body.entryId);
                    });
                });
            });

            describe('Sad paths', function () {
                describe('Flag with a bad entry id', function () {
                    it('should return a 400 status and an error message', async function () {
                        const res = await agent.post('/entry/blech/flag').send({ reason: testString });

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "That is not a properly formatted entryId." });
                    });
                });

                describe('Flag a nonexistant entry', function () {
                    it('should return a 404 status and an error message', async function () {
                        const res = await agent.post('/entry/000000000000000000000000/flag').send({ reason: testString });

                        expect(res).to.have.status(404);
                        expect(res.body).to.deep.equal({ error: "There is no entry with that entryId." });

                    });
                });

                describe('Flag without a reason', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/entry').send(testStory);

                        const res = await agent.post('/entry/' + storyRes.body.entryId + '/flag');

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Flagging an entry needs a reason." });

                        await Entry.findByIdAndDelete(storyRes.body.entryId);
                    });
                });

                describe('Flag with an empty reason', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/entry').send(testStory);

                        const res = await agent.post('/entry/' + storyRes.body.entryId + '/flag').send({ reason: "" });

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Flagging an entry needs a reason." });

                        await Entry.findByIdAndDelete(storyRes.body.entryId);
                    });
                });

                describe('Flag an entry, then delete the entry from the database and GET /admin/flag', function () {
                    it('should remove the flag from the list of returned flags and not crash the back end', async function () {
                        await agent.post('/login').send(adminLogin);
                        const storyRes = await agent.post('/entry').send(testStory);
                        await agent.post('/entry/' + storyRes.body.entryId + '/flag').send({ reason: testString });
                        const flag = await Flag.findOne({ entry: storyRes.body.entryId });
                        await Entry.findByIdAndDelete(storyRes.body.entryId);

                        const res = await agent.get('/admin/flag');

                        expect(res).to.have.status(200);
                        expect(res.body.some(f => f.entry == storyRes.body.entryId)).to.be.false;

                        await Flag.findByIdAndDelete(flag._id);
                    });
                });
            });
        });

    });

    describe('Test the bookmark handling routes', function () {
        describe('Test the POST /entry/:entryId/bookmark route', function () {
            describe('Happy paths', function () {
                describe('Login and POST a bookmark', function () {
                    it('should return a 200 status and a success message, and add a bookmark to the database', async function () {
                        const loginRes = await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/entry').send(testStory);

                        const res = await agent.post('/entry/' + storyRes.body.entryId + '/bookmark');
                        const bookmark = await Bookmark.findOne({ user: loginRes.body.userId });

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal({ message: "Entry bookmarked." });
                        expect(bookmark).to.not.be.null;

                        await Bookmark.findByIdAndDelete(bookmark._id);
                        await Entry.findByIdAndDelete(storyRes.body.entryId)
                    });

                });

                describe('Login, post a bookmark, and GET /profile', function () {
                    it('should return the bookmarked entry in bookmarkedEntries', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/entry').send(testStory);
                        await agent.post('/entry/' + storyRes.body.entryId + '/bookmark');
                        const bookmark = await Bookmark.findOne({ entry: storyRes.body.entryId });

                        const res = await agent.get('/profile');

                        expect(res.body.bookmarkedEntries).to.be.an('array').with.lengthOf(1);
                        expect(res.body.bookmarkedEntries[0].storyId).to.deep.equal(storyRes.body.entryId);

                        await Bookmark.findByIdAndDelete(bookmark._id);
                        await Entry.findByIdAndDelete(storyRes.body.entryId);
                    });
                });

                describe('Login, post a bookmark, and GET /entry/:entryId', function () {
                    it('should return bookmarkedByUser is true in the entry', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/entry').send(testStory);
                        await agent.post('/entry/' + storyRes.body.entryId + '/bookmark');
                        const bookmark = await Bookmark.findOne({ entry: storyRes.body.entryId });

                        const res = await agent.get('/entry/' + storyRes.body.entryId);

                        expect(res).to.have.status(200);
                        expect(res.body.bookmarkedByUser).to.be.true;

                        await Bookmark.findByIdAndDelete(bookmark._id);
                        await Entry.findByIdAndDelete(storyRes.body.entryId);
                    });
                });

                describe('Login, post a bookmark, and GET /entry?regex=<testString>', function () {
                    it('should return bookmarkedByUser is true in the entry', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/entry').send(testStory);
                        await agent.post('/entry/' + storyRes.body.entryId + '/bookmark');
                        const bookmark = await Bookmark.findOne({ entry: storyRes.body.entryId });

                        const res = await agent.get('/entry').query({ regex: testString, });

                        expect(res).to.have.status(200);
                        expect(res.body).to.be.an('array').with.lengthOf(1);
                        expect(res.body[0].bookmarkedByUser).to.be.true;

                        await Bookmark.findByIdAndDelete(bookmark._id);
                        await Entry.findByIdAndDelete(storyRes.body.entryId);

                    });
                });
            });

            describe('Sad paths', function () {
                describe('Logout and POST a bookmark', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const entry = await agent.post('/entry').send(testStory);
                        await agent.post('/logout');

                        const res = await agent.post('/entry/' + entry.body.entryId + '/bookmark');

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');

                        await Entry.findByIdAndDelete(entry.body.entryId);
                    });
                });

                describe('Login and POST a duplicate bookmark', function () {
                    it('should return 409 status and an error message', async function () {
                        const loginRes = await agent.post('/login').send(testUserLogin);
                        const entry = await agent.post('/entry').send(testStory);

                        await agent.post('/entry/' + entry.body.entryId + '/bookmark');
                        const res = await agent.post('/entry/' + entry.body.entryId + '/bookmark');

                        expect(res).to.have.status(409);

                        await Bookmark.findOneAndDelete({ user: loginRes.body.userId });
                        await Entry.findByIdAndDelete(entry.body.entryId);
                    });
                });

                describe('Login and POST a bookmark on a bad entryId', function () {
                    it('should return 400 status and an error message', async function () {
                        await agent.post('/login').send(testUserLogin);

                        const res = await agent.post('/entry/d00d/bookmark');

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "That is not a properly formatted entryId." });
                    });
                });

                describe('Login and POST a bookmark on a nonexistantId', function () {
                    it('should return a 404 status and an error message', async function () {
                        await agent.post('/login').send(testUserLogin);

                        const res = await agent.post('/entry/000000000000000000000000/bookmark');

                        expect(res).to.have.status(404);
                        expect(res.body).to.deep.equal({ error: "There is no entry with that entryId." });
                    });
                });

                describe('Login, bookmark an entry, then delete the entry from the database, and GET /profile and check bookmarkedEntries', function () {
                    it('should not include the bookmark for the deleted entry, and should not crash the backend', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/entry').send(testStory);
                        await agent.post('/entry/' + storyRes.body.entryId + '/bookmark');
                        const bookmark = await Bookmark.findOne({ entry: storyRes.body.entryId });
                        await Entry.findByIdAndDelete(storyRes.body.entryId);

                        const res = await agent.get('/profile');

                        expect(res).to.have.status(200);
                        expect(res.body.bookmarkedEntries).to.deep.equal([]);

                        await Bookmark.findByIdAndDelete(bookmark._id);
                        await Entry.findByIdAndDelete(storyRes.body.entryId);
                    });
                });
            });
        });

        describe('Test the DELETE /entry/:entryId/bookmark route', function () {
            describe('Happy paths', function () {
                describe('Login and delete a bookmark', function () {
                    it('should return a 200 status and a success message, and remove the bookmark from the database', async function () {
                        await agent.post('/login').send(adminLogin);
                        const storyRes = await agent.post('/entry').send(testStory);
                        await agent.post('/login').send(testUserLogin);
                        await agent.post('/entry/' + storyRes.body.entryId + '/bookmark');

                        const res = await agent.delete('/entry/' + storyRes.body.entryId + '/bookmark');
                        const bookmark = await Bookmark.findOne({ entry: storyRes.body.entryId });

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal({ message: "Bookmark successfully deleted." });
                        expect(bookmark).to.be.null;

                        await Entry.findByIdAndDelete(storyRes.body.entryId);
                    });
                });
            });

            describe('Sad paths', function () {
                describe('Login and delete a nonexistant bookmark', function () {
                    it('should return a 404 status and an error message', async function () {
                        await agent.post('/login').send(adminLogin);
                        const storyRes = await agent.post('/entry').send(testStory);
                        await agent.post('/login').send(testUserLogin);

                        const res = await agent.delete('/entry/' + storyRes.body.entryId + '/bookmark');

                        expect(res).to.have.status(404);
                        expect(res.body).to.deep.equal({ error: "You don't have that entry bookmarked." });

                        await Entry.findByIdAndDelete(storyRes.body.entryId);
                    });
                });

                describe('Logout and delete a bookmark', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/login').send(adminLogin);
                        const storyRes = await agent.post('/entry').send(testStory);
                        await agent.post('/login').send(testUserLogin);
                        await agent.post('/entry/' + storyRes.body.entryId + '/bookmark');
                        const bookmark = await Bookmark.findOne({ entry: storyRes.body.entryId });
                        await agent.post('/logout');

                        const res = await agent.delete('/entry/' + storyRes.body.entryId + '/bookmark');

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');

                        await Bookmark.findByIdAndDelete(bookmark._id);
                        await Entry.findByIdAndDelete(storyRes.body.entryId);
                    });
                });

                describe('Login and delete a bookmark from a nonexistant entry', function () {
                    it('should return a 404 status and an error message', async function () {
                        await agent.post('/login').send(testUserLogin);

                        const res = await agent.delete('/entry/000000000000000000000000/bookmark');

                        expect(res).to.have.status(404);
                        expect(res.body).to.deep.equal({ error: "There is no entry with that entryId." });
                    });
                });

                describe('Login and delete a bookmark from a bad entryId', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/login').send(testUserLogin);

                        const res = await agent.delete('/entry/buh/bookmark');

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "That is not a properly formatted entryId." });
                    });
                });
            });
        });
    });

    describe('Test the GET /chain/:entryId route', function () {
        let entryId1, entryId2, entryId3;

        before('Set up chain', async function () {
            await agent.post('/login').send(testUserLogin);
            const storyRes1 = await agent.post('/entry').send(testStory);
            entryId1 = storyRes1.body.entryId;
            const storyRes2 = await agent.post('/entry/' + entryId1).send(testEntry);
            entryId2 = storyRes2.body.entryId;
            const storyRes3 = await agent.post('/entry/' + entryId2).send(testEntry);
            entryId3 = storyRes3.body.entryId;
        })

        after('Tear down chain', async function () {
            await Entry.findByIdAndDelete(entryId3);
            await Entry.findByIdAndDelete(entryId2);
            await Entry.findByIdAndDelete(entryId1);
        })

        describe('Happy paths', function () {
            describe('Logout and get a chain of length 1', function () {
                it('should return a 200 status and an array containing 1 entry', async function () {
                    await agent.post('/logout');

                    const res = await agent.get('/chain/' + entryId1);

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf(1);
                    expect(res.body[0].entryId).to.deep.equal(entryId1);
                });
            });

            describe('Logout and get a chain of length 2', function () {
                it('should return a 200 status and an array containing 2 entries', async function () {
                    await agent.post('/logout');

                    const res = await agent.get('/chain/' + entryId2);

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf(2);
                    expect(res.body[0].entryId).to.deep.equal(entryId1);
                    expect(res.body[1].entryId).to.deep.equal(entryId2);
                });
            });

            describe('Logout and get a chain of length 3', function () {
                it('should return a 200 status and an array containing 3 entries', async function () {
                    await agent.post('/logout');

                    const res = await agent.get('/chain/' + entryId3);

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf(3);
                    expect(res.body[0].entryId).to.deep.equal(entryId1);
                    expect(res.body[1].entryId).to.deep.equal(entryId2);
                    expect(res.body[2].entryId).to.deep.equal(entryId3);
                });
            });
        });

        describe('Sad paths', function () {
            describe('Logout and get a chain ending in a nonexistant entryId', function () {
                it('should return a 404 status and an error message', async function () {
                    await agent.post('/logout');

                    const res = await agent.get('/chain/000000000000000000000000');

                    expect(res).to.have.status(404);
                    expect(res.body).to.deep.equal({ error: "There is no entry with that entryId." });
                });
            });

            describe('Logout and get a chain with a malformed entryId', function () {
                it('should return a 400 status and an error message', async function () {
                    await agent.post('/logout');

                    const res = await agent.get('/chain/foo');

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "That is not a properly formatted entryId." });
                });
            });

            describe('Logout and get a broken chain', function () {
                it('should return as much of the chain as it can', async function () {
                    await agent.post('/login').send(testUserLogin);
                    const storyRes1 = await agent.post('/entry').send(testStory);
                    const storyRes2 = await agent.post('/entry/' + storyRes1.body.entryId).send(testEntry);
                    const storyRes3 = await agent.post('/entry/' + storyRes2.body.entryId).send(testEntry);
                    await Entry.findByIdAndDelete(storyRes1.body.entryId);
                    await agent.post('/logout');

                    const res = await agent.get('/chain/' + storyRes3.body.entryId);

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf(2);
                    expect(res.body[0].entryId).to.deep.equal(storyRes2.body.entryId);
                    expect(res.body[1].entryId).to.deep.equal(storyRes3.body.entryId);

                    await Entry.findByIdAndDelete(storyRes3.body.entryId);
                    await Entry.findByIdAndDelete(storyRes2.body.entryId);
                });
            });
        });
    });
});