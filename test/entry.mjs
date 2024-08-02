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
    // newPassword,
    testUserLogin,
    adminLogin,
    testStory,
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
                        .send(testUserLogin);

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
                        .send(testUserLogin);

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
                    await agent.post('/logout');

                    const res = await agent
                        .post('/entry')
                        .send({ storyTitle: "Deterministic story title", bodyText: "Deterministic text" });

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                });
            });

            describe('POST /entry with {storyTitle: "Deterministic story title"}', function () {
                it('should return a 400 bad request and an error message', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send(testUserLogin);

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
                        .send(testUserLogin);

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
                        .send(testUserLogin);

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
                        .send(testUserLogin);

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
                        .send(testUserLogin);

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

    describe('Test the DELETE /entry/:entryId route', function () {
        describe('Happy paths', function () {
            describe('Login as admin and delete an entry', function () {
                it('should return a 200 status and a success message and delete the entry from the database', async function () {
                    await agent.post('/login').send(adminLogin);

                    const entry = await agent
                        .post('/entry')
                        .send({ storyTitle: "Test deletion entry.", bodyText: testString });

                    const res = await agent
                        .delete('/admin/entry/' + entry.body.entryId);

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal({ message: "Entry successfully deleted." });

                    const reEntry = await Entry.findById(entry.body.entryId);

                    expect(reEntry).to.be.null;
                });
            });
        });

        describe('Sad paths', function () {
            describe('Login as non-admin and delete an entry', function () {
                it('should redirect to /login', async function () {
                    await agent.post('/login').send(testUserLogin);

                    const entry = await agent
                        .post('/entry')
                        .send({ storyTitle: "Test deletion entry.", bodyText: testString });

                    const res = await agent
                        .delete('/admin/entry/' + entry.body.entryId);

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');

                    await Entry.findByIdAndDelete(entry.body.entryId);
                });
            });

            describe('Logout and delete an entry', function () {
                it('should redirect to /login', async function () {
                    await agent.post('/logout');

                    const entry = await agent
                        .post('/entry')
                        .send({ storyTitle: "Test deletion entry.", bodyText: testString });

                    const res = await agent
                        .delete('/admin/entry/' + entry.body.entryId);

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');

                    await Entry.findByIdAndDelete(entry.body.entryId);
                });
            });

            describe('Login as admin and delete with bad entryId', function () {
                it('should return a 400 status and an error message', async function () {
                    await agent.post('/login').send(adminLogin);

                    const res = await agent.delete('/admin/entry/buh');

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "That is not a properly formatted entryId." });
                });
            });

            describe('Login as admin and delete with nonexistant entryId', function () {
                it('should return a 404 status and an error message', async function () {
                    await agent.post('/login').send(adminLogin);

                    const res = await agent.delete('/admin/entry/000000000000000000000000');

                    expect(res).to.have.status(404);
                    expect(res.body).to.deep.equal({ error: "There is no entry with that entryId." });
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
                        .send(testUserLogin);

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
                        .send(testUserLogin);

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
                        .send(testUserLogin);

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
                        .send(testUserLogin);

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
                        .send(testUserLogin);

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
                        .send(testUserLogin);

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
                        .send(testUserLogin);
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
                        .send(testUserLogin);

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
                        .send(testUserLogin);

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
                        .send(testUserLogin);

                    const res = await agent
                        .delete('/entry/blarg/like');

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
                        await agent.post('/logout');
                        const entry = await Entry.findOne({ entryTitle: "Deterministic entry title" });

                        const res = await agent
                            .post('/entry/' + entry._id + '/flag')
                            .send({ reason: testString });

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal({ message: "Entry successfully flagged." });

                        const flag = await Flag.findOne({ reason: testString });
                        expect(flag.entry).to.deep.equal(entry._id);
                        expect(flag.user).to.be.null;
                        expect(flag.reason).to.deep.equal(testString);
                    });
                });

                describe('Login and flag an entry', function () {
                    it('should return a 200 status and a success message, and put a flag in the database', async function () {
                        await agent.post('/login')
                            .send(testUserLogin);
                        const entry = await Entry.findOne({ entryTitle: "Deterministic entry title" });

                        const res = await agent
                            .post('/entry/' + entry._id + '/flag')
                            .send({ reason: testString + "1" });

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal({ message: "Entry successfully flagged." });

                        const flag = await Flag.findOne({ reason: testString + "1" });
                        expect(flag.entry.equals(entry._id)).to.be.true;
                        expect(flag.user.equals(newUserPrivateProfile().userId)).to.be.true;
                        expect(flag.reason).to.deep.equal(testString + "1");
                    });
                });
            });

            describe('Sad paths', function () {
                describe('Flag with a bad entry id', function () {
                    it('should return a 400 status and an error message', async function () {
                        const res = await agent
                            .post('/entry/blech/flag')
                            .send({ reason: testString });

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "That is not a properly formatted entryId." });
                    });
                });

                describe('Flag a nonexistant entry', function () {
                    it('should return a 404 status and an error message', async function () {
                        const res = await agent
                            .post('/entry/000000000000000000000000/flag')
                            .send({ reason: testString });

                        expect(res).to.have.status(404);
                        expect(res.body).to.deep.equal({ error: "There is no entry with that entryId." });

                    });
                });

                describe('Flag without a reason', function () {
                    it('should return a 400 status and an error message', async function () {
                        const entry = await Entry.findOne({ entryTitle: "Deterministic entry title" });

                        const res = await agent
                            .post('/entry/' + entry._id + '/flag');

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Flagging an entry needs a reason." });
                    });
                });

                describe('Flag with an empty reason', function () {
                    it('should return a 400 status and an error message', async function () {
                        const entry = await Entry.findOne({ entryTitle: "Deterministic entry title" });

                        const res = await agent
                            .post('/entry/' + entry._id + '/flag')
                            .send({ reason: "" });

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Flagging an entry needs a reason." });
                    });
                });
            });
        });

        describe('Test DELETE /admin/flag/:flagId', function () {
            describe('Happy paths', function () {
                describe('Login as admin and delete a flag', function () {
                    it('should return a 200 status and a success message, and delete the flag from the database', async function () {
                        await agent.post('/login').send(adminLogin);
                        const flag = await Flag.findOne({ reason: testString + "1" });

                        const res = await agent.delete('/admin/flag/' + flag._id);

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal({ message: "Flag successfully defeated." });

                        const checkFlag = await Flag.findById(flag._id);
                        expect(checkFlag).to.be.null;
                    });
                });
            });

            describe('Sad paths', function () {
                describe('Logout and DELETE', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/logout');
                        const flag = await Flag.findOne({ reason: testString });

                        const res = await agent.delete('/admin/flag' + flag._id);

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                    });
                });

                describe('Login as non-admin and DELETE', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const flag = await Flag.findOne({ reason: testString });

                        const res = await agent.delete('/admin/flag/' + flag._id);

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                    });
                });

                describe('Login as admin and DELETE bad flagId', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/login').send(adminLogin);
                        const res = await agent.delete('/admin/flag/bleh');

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "That is not a properly formatted flagId." });
                    });
                });

                describe('Login as admin and DELETE nonexistant flagId', function () {
                    it('should return a 404 status and an error message', async function () {

                        await agent.post('/login').send(adminLogin);
                        const res = await agent.delete('/admin/flag/000000000000000000000000');

                        expect(res).to.have.status(404);
                        expect(res.body).to.deep.equal({ error: "There is no flag with that flagId." });
                    });
                });
            });
        });

        describe('Test GET /admin/flag', function () {
            describe('Happy paths', function () {
                describe('Login as admin and GET /admin/flag', function () {
                    it('should return a 200 status and a list of flags', async function () {
                        await agent.post('/login').send(adminLogin);

                        const res = await agent.get('/admin/flag');

                        expect(res).to.have.status(200);
                        expect(res.body).to.be.an('array').with.lengthOf.at.least(1);
                        for (const flag of res.body) {
                            expect(flag).to.include.all.keys('user', 'entry', 'reason');
                            expect(flag.entry).to.not.be.null;
                            expect(flag.reason).to.be.a('string').with.lengthOf.at.least(1);
                        }
                    });
                });
            });

            describe('Sad paths', function () {
                describe('Logout and get /admin/flag', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/logout');

                        const res = await agent
                            .get('/admin/flag');

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                    });
                });

                describe('Login as non-admin ang GET /admin/flag', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/login').send(testUserLogin);

                        const res = await agent.get('/admin/flag');

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                    });
                });
            });
        });
    });

    describe('Test the bookmark handling routes', function () {
        describe('Test the POST /entry/:entryId/bookmark', function () {
            describe('Happy paths', function () {
                describe('Login and POST a bookmark', function () {
                    it('should return a 200 status and a success message, and add a bookmark to the database', async function () {
                        const loginRes = await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/entry').send(testStory);

                        const res = await agent.post('/entry/' + storyRes.body.entryId + '/bookmark');

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal({ message: "Entry bookmarked." });

                        const bookmark = await Bookmark.findOne({ user: loginRes.body.userId });
                        expect(bookmark).to.not.be.null;
                        await Bookmark.findByIdAndDelete(bookmark._id);
                        await Entry.findByIdAndDelete(storyRes.body.entryId)
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

                        await Bookmark.findOneAndDelete({ user: loginRes.body._id });
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

                describe('Login an POST a bookmark on a nonexistantId', function () {
                    it('should return a 404 status and an error message', async function () {
                        await agent.post('/login').send(testUserLogin);

                        const res = await agent.post('/entry/000000000000000000000000/bookmark');

                        expect(res).to.have.status(404);
                        expect(res.body).to.deep.equal({ error: "There is no entry with that entryId." });
                    });
                });

                // FIXME Login, bookmark an entry, then delete the entry, and test bookmarks
            });
        });
    });
});