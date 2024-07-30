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
    newUserName,
    // newEmail,
    newPassword,
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
    // functions
    populateUserInfo,
    expectMongoObjectId,
} = globals;

describe('Test the entry handling routes', function () {
    this.slow(1000);

    describe('Test the GET /entry route', function () {
        describe('Happy paths', function () {
            describe('Logout and GET /entry', function () {
                it('should return a 200 OK and a list of entries', async function () {
                    await agent
                        .post('/logout');

                    const res = await agent
                        .get('/entry');

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
                    await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    const res = await agent
                        .get('/entry');

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.entriesPerPage);
                    for (const entry of res.body) {
                        expect(entry).to.have.all.keys('likedByUser', ...summaryKeys);
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
                    await agent
                        .post('/logout');

                    const res = await agent
                        .get('/entry')
                        .query({ storiesOnly: true });

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
                    const res = await agent
                        .get('/entry')
                        .query({ regex: 'Freddy', fields: 'a' });

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
                    const res = await agent
                        .get('/entry')
                        .query({ regex: 'dd', fields: 'e' });

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
                    const res = await agent
                        .get('/entry')
                        .query({ regex: 'beginning', fields: 's' });

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
                    const res = await agent
                        .get('/entry')
                        .query({ regex: 'dd', fields: 'ae' });

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
                    const res = await agent
                        .get('/entry')
                        .query({ regex: "Freddy", fields: "w" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Misformed query string." })
                });;
            });

            describe('GET /entry with search query string {regexp: "Freddy", fields: "aea"}', function () {
                it('should return a 400 status and an error message.', async function () {
                    const res = await agent
                        .get('/entry')
                        .query({ regex: "Freddy", fields: "aea" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Misformed query string." })
                });;
            });

            describe('GET /entry with search query string {order: "a"}', function () {
                it('should return a 200 OK list of entries sorted in increasing order by author', async function () {
                    const res = await agent
                        .get('/entry')
                        .query({ order: "a" });

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
                    const res = await agent
                        .get('/entry')
                        .query({ order: "A" });

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
                    const res = await agent
                        .get('/entry')
                        .query({ order: "e" });

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
                    const res = await agent
                        .get('/entry')
                        .query({ order: "E" });

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
                    const res = await agent
                        .get('/entry')
                        .query({ order: "sE" });

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
                    const res = await agent
                        .get('/entry')
                        .query({ order: "x" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Misformed query string." })
                });;
            });

            describe('GET /entry with search query string {order: "aea"}', function () {
                it('should return a 400 status and an error message.', async function () {
                    const res = await agent
                        .get('/entry')
                        .query({ order: "aea" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Misformed query string." })
                });;
            });

            describe('GET /entry with search query string {order: "aeA"}', function () {
                it('should return a 400 status and an error message.', async function () {
                    const res = await agent
                        .get('/entry')
                        .query({ order: "aeA" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Misformed query string." })
                });;
            });

        });
    });

    describe('Test the GET /entry/:entryId route', function () {
        describe('Happy paths', function () {
            describe('GET /entry/6695b2573550c66db1ab9106', function () {
                it('should return a 200 OK and the entry.fullInfoWithContinuations', async function () {
                    const res = await agent
                        .get('/entry/6695b2573550c66db1ab9106');

                    expect(res).to.have.status(200);
                    expect(res.body.entryId).to.deep.equal('6695b2573550c66db1ab9106');
                    expect(res.body.authorName).to.deep.equal('Freddy');
                    expectMongoObjectId(res.body.authorId);
                    expect(res.body.entryTitle).to.be.null;
                    expect(res.body.storyTitle).to.deep.equal('In the beginning...');
                    expect(res.body.bodyText).to.match(/Wakamolensis/);
                    expect(res.body.previousEntry).to.be.null;
                    expect(res.body.flagId).to.be.null;
                    expect(res.body.likes).to.be.a('number');
                    expect(res.body.createDate).to.be.a('string');
                    expect(res.body.storyId).to.deep.equal('6695b2573550c66db1ab9106');
                    expect(res.body.continuationEntries).to.be.an('array');
                });
            });
        });

        describe('Sad paths', function () {
            describe('GET /entry/notAnEntryId', function () {
                it('should return a 400 status and an error message', async function () {
                    const res = await agent
                        .get('/entry/notAnEntryId');

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "That is not a properly formatted entryId." });
                });
            });

            describe('GET /entry/000000000000000000000000', function () {
                it('should return a 404 status and an error message', async function () {
                    const res = await agent
                        .get('/entry/000000000000000000000000');

                    expect(res).to.have.status(404);
                    expect(res.body).to.deep.equal({ error: "There is no entry with that entryId." });
                });
            });
        });
    });

    describe('Test the POST /entry route', function () {
        describe('Happy paths', function () {
            describe('POST /entry with {storyTitle: "Deterministic story title", bodyText: "Deterministic text"}', function () {
                it('should return a 201 CREATED and the entry.fullInfo(), and add entry to the author\'s publishedEntries', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .post('/entry')
                        .send({ storyTitle: "Deterministic story title", bodyText: "Deterministic text" });

                    expect(res).to.have.status(201);
                    expectMongoObjectId(res.body.storyId);
                    expect(res.body.entryId).to.deep.equal(res.body.storyId);
                    expect(res.body.storyTitle).to.deep.equal("Deterministic story title");
                    expect(res.body.entryTitle).to.be.null;
                    expect(res.body.authorName).to.deep.equal(newUserName);
                    expectMongoObjectId(res.body.authorId);
                    expect(res.body.bodyText).to.deep.equal("Deterministic text");
                    expect(res.body.previousEntry).to.be.null;
                    expect(res.body.flagId).to.be.null;
                    expect(res.body.likes).to.deep.equal(0);
                    expect(res.body.createDate).to.be.a('string');

                    const updateRes = await agent
                        .get('/profile');

                    expect(updateRes).to.have.status(200);
                    expect(updateRes.body.publishedEntries).to.be.an('array').with.lengthOf(1);

                    const { storyId, entryId, storyTitle, entryTitle, authorName, previousEntry } = res.body;
                    const entrySummary = { storyId, entryId, storyTitle, entryTitle, authorName, previousEntry };
                    expect(entrySummary).to.deep.equal(updateRes.body.publishedEntries[0]);

                    populateUserInfo(updateRes.body);
                });
            });
        });

        describe('Sad paths', function () {
            describe('Logout and POST /entry with {storyTitle: "Deterministic story title", bodyText: "Deterministic text"}', function () {
                it('should redirect to /login', async function () {
                    const res = await agent
                        .post('/logout');

                    expect(res).to.have.status(200);
                    const res2 = await agent
                        .post('/entry')
                        .send({ storyTitle: "Deterministic story title", bodyText: "Deterministic text" });

                    expect(res2).to.redirectTo(constants.mochaTestingUrl + '/login');
                });
            });

            describe('POST /entry with {storyTitle: "Deterministic story title"}', function () {
                it('should return a 400 bad request and an error message', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .post('/entry')
                        .send({ storyTitle: "Deterministic story title" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Missing story text." })
                });
            });

            describe('Post /entry with {bodyText: "Deterministic text"}', function () {
                it('should return a 400 bad request and an error message', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .post('/entry')
                        .send({ bodyText: "Deterministic text" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Missing story title." })
                        ;
                });
            });
        });
    });

    describe('Test the POST /entry/:entryId route', function () {
        describe('Happy paths', function () {
            describe('POST /entry/6695b2573550c66db1ab9106 with {entryTitle: "Deterministic entry title", bodyText: "Deterministic text"}', function () {
                it('should return a 201 created and the entry.fullInfo() and add entry to the author\'s publishedEntries', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .post('/entry/6695b2573550c66db1ab9106')
                        .send({ entryTitle: "Deterministic entry title", bodyText: "Deterministic text" });

                    expect(res).to.have.status(201);
                    expectMongoObjectId(res.body.entryId);
                    expect(res.body.storyId).to.deep.equal("6695b2573550c66db1ab9106");
                    expect(res.body.storyTitle).to.deep.equal("In the beginning...");
                    expect(res.body.entryTitle).to.deep.equal("Deterministic entry title");
                    expect(res.body.authorName).to.deep.equal(newUserName);
                    expectMongoObjectId(res.body.authorId);
                    expect(res.body.bodyText).to.deep.equal("Deterministic text");
                    expect(res.body.previousEntry).to.deep.equal("6695b2573550c66db1ab9106");
                    expect(res.body.flagId).to.be.null;
                    expect(res.body.likes).to.be.a('number');
                    expect(res.body.createDate).to.be.a('string');

                    const updateRes = await agent
                        .get('/profile');

                    expect(updateRes).to.have.status(200);
                    expect(updateRes.body.publishedEntries).to.be.an('array').with.lengthOf(2);

                    const { storyId, entryId, storyTitle, entryTitle, authorName, previousEntry, } = res.body;
                    const entrySummary = { storyId, entryId, storyTitle, entryTitle, authorName, previousEntry, };
                    expect(entrySummary).to.deep.equal(updateRes.body.publishedEntries[0]);

                    populateUserInfo(updateRes.body);
                });
            });
        });

        describe('Sad paths', function () {
            describe('Logout and POST /entry/6695b2573550c66db1ab9106 with {entryTitle: "Deterministic entry title", bodyText: "Deterministic text', function () {
                it('should redirect to /login', async function () {
                    const logoutRes = await agent
                        .post('/logout');

                    expect(logoutRes).to.have.status(200);
                    const res = await agent
                        .post('/entry/6695b2573550c66db1ab9106')
                        .send({ entryTitle: "Deterministic entry title", bodyText: "Deterministic text" });

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                });
            });

            describe('POST /entry/6695b2573550c66db1ab9106 with {entryTitle: "Deterministic entry title"}', function () {
                it('should return a 400 misformed and an error message', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .post('/entry/6695b2573550c66db1ab9106')
                        .send({ entryTitle: "Deterministic entry title" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Missing story text." })
                });
            });

            describe('POST /entry/6695b2573550c66db1ab9106 with {bodyText: "Deterministic text"}', function () {
                it('should return a 400 misformed and an error message', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .post('/entry/6695b2573550c66db1ab9106')
                        .send({ bodyText: "Deterministic text" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Missing entry title." })
                });
            });

        });
    });

    describe('Test the POST /entry/:entryId/like route', function () {
        describe('Happy paths', function () {
            describe('Login and POST /entry/6695b2573550c66db1ab9106/like', function () {
                it('should return a 200 status and a success message, and add a like to the database', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .post('/entry/6695b2573550c66db1ab9106/like');

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal({ message: "Entry liked." });
                    const likeRes = Like.findOne({ user: newUserPrivateProfile().userId, entry: '6695b2573550c66db1ab9106' });
                    expect(likeRes).to.not.be.null;

                    const entryIdRes = await agent
                        .get('/entry/6695b2573550c66db1ab9106');

                    expect(entryIdRes).to.have.status(200);
                    expect(entryIdRes.body.likes).to.be.at.least(1);
                    expect(entryIdRes.body.likedByUser).to.be.true;

                    const entryListRes = await agent
                        .get('/entry')
                        .query({ fields: "b", regex: "Wakamolensis" });

                    expect(entryListRes).to.have.status(200);
                    expect(entryListRes.body).to.be.an('array').with.lengthOf(1);
                    expect(entryListRes.body[0].likes).to.be.at.least(1);
                    expect(entryListRes.body[0].likedByUser).to.be.true;
                });
            });
        });

        describe('Sad paths', function () {
            describe('Logout and POST a like to a story', function () {
                it('should redirect to /login', async function () {
                    const logoutRes = await agent
                        .post('/logout');

                    expect(logoutRes).to.have.status(200);

                    const res = await agent
                        .post('/entry/6695b2573550c66db1ab9106/like');

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                });
            });

            describe('Login, post an entry, and like the entry', function () {
                it('should return a 409 status and an error message', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    expect(loginRes).to.have.status(200);

                    const entryRes = await agent
                        .post('/entry')
                        .send({ storyTitle: "Title", bodyText: testString });

                    expect(entryRes).to.have.status(201);

                    const res = await agent
                        .post('/entry/' + entryRes.body.entryId + '/like');

                    expect(res).to.have.status(409);

                    expect(res.body).to.deep.equal({ error: "You cannot like your own entries." });

                    const delRes = await Entry.findByIdAndDelete(entryRes.body.entryId);

                    expect(delRes).to.not.be.null;
                });
            });

            describe('Login and POST a like to an already liked story', function () {
                it('should return a 409 status and an error message', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .post('/entry/6695b2573550c66db1ab9106/like');

                    expect(res).to.have.status(409);
                    expect(res.body).to.deep.equal({ error: "You have already liked that entry." });
                });
            });

            describe('Login and POST a like to a nonexistant story', function () {
                it('should return a 404 status and an error message', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .post('/entry/000000000000000000000000/like');

                    expect(res).to.have.status(404);
                    expect(res.body).to.deep.equal({ error: "There is no entry with that entryId." });
                });
            });

            describe('Login and POST a like to a misformed storyId', function () {
                it('should return a 400 status and an error message', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .post('/entry/blarg/like');

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "That is not a properly formatted entryId." });
                });
            });
        });
    });

    describe('Test the DELETE /entry/:entryId/like route', function () {
        describe('Happy paths', function () {
            describe('Login and unlike a liked entry', function () {
                it('should return a 200 status and return a success message and remove the like from the database', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    expect(loginRes).to.have.status(200);

                    await agent
                        .post('/entry/6695b2573550c66db1ab9106/like');

                    const res = await agent
                        .delete('/entry/6695b2573550c66db1ab9106/like');

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal({ message: "Like successfully removed." });

                    const foundLike = await Like.findOne({ entry: '6695b2573550c66db1ab9106', user: newUserPrivateProfile().userId });

                    expect(foundLike).to.be.null;
                });
            });
        });

        describe('Sad paths', function () {
            describe('Logout and unlike a liked entry', function () {
                it('should redirect to /login', async function () {
                    await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });
                    await agent
                        .post('/entry/6695b2573550c66db1ab9106/like');
                    await agent
                        .post('/logout');

                    const res = await agent
                        .delete('/entry/6695b2573550c66db1ab9106/like');

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                });
            });

            describe('Login and unlike an entry that isn\'t liked', function () {
                it('should return a 404 status and an error message', async function () {
                    await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    const res = await agent
                        .delete('/entry/66a7fd2095206fecbb52c189/like');

                    expect(res).to.have.status(404);
                    expect(res.body).to.deep.equal({ error: "You have not liked that entry." });
                });
            });

            describe('Login and unlike a nonexistant entry', function () {
                it('should return a 404 status and an error message', async function () {
                    await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    const res = await agent
                        .delete('/entry/000000000000000000000000/like');

                    expect(res).to.have.status(404);
                    expect(res.body).to.deep.equal({ error: "There is no entry with that entryId." });
                });
            });

            describe('Login and unlike with a bad entryId', function () {
                it('should return a 400 status and an error message', async function () {
                    await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    const res = await agent
                        .delete('/entry/blarg/like');

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "That is not a properly formatted entryId." });
                });
            });
        });
    });

});