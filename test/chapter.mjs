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
    testChapter,
    newUserPrivateProfile,
    // newUserPublicInfo,
    // newUserBasicInfo,
    summaryKeys,
    // models
    // User,
    Chapter,
    // Follow,
    // Message,
    Like,
    Flag,
    Bookmark,
    // functions
    // populateUserInfo,
    expectMongoObjectId,
    deepCopy,
} = globals;

describe('Test the chapter handling routes', function () {
    this.slow(1000);

    describe('Test the chapter retrieval routes', function () {
        describe('Test the GET /chapter route', function () {
            describe('Happy paths', function () {
                describe('Logout and GET /chapter', function () {
                    it('should return a 200 OK and a list of chapters', async function () {
                        await agent.post('/logout');

                        const res = await agent.get('/chapter');

                        expect(res).to.have.status(200);
                        expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.resultsPerPage);
                        for (const chapter of res.body) {
                            expect(chapter).to.have.all.keys(...summaryKeys);
                            expectMongoObjectId(chapter.storyId);
                            expectMongoObjectId(chapter.chapterId);
                            expect(chapter.storyTitle).to.be.a('string');
                            if (chapter.storyId == chapter.chapterId) {
                                expect(chapter.chapterTitle).to.be.null;
                            } else {
                                expect(chapter.chapterTitle).to.be.a('string');
                            }
                            expect(chapter.authorName).to.be.a('string');
                        }
                    });
                });

                describe('Login and GET /chapter', function () {
                    it('should return a 200 OK and a list of chapters', async function () {
                        await agent.post('/login').send(testUserLogin);

                        const res = await agent.get('/chapter');

                        expect(res).to.have.status(200);
                        expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.resultsPerPage);
                        for (const chapter of res.body) {
                            expect(chapter).to.have.all.keys('likedByUser', 'bookmarkedByUser', ...summaryKeys);
                            expectMongoObjectId(chapter.storyId);
                            expectMongoObjectId(chapter.chapterId);
                            expect(chapter.storyTitle).to.be.a('string');
                            if (chapter.storyId == chapter.chapterId) {
                                expect(chapter.chapterTitle).to.be.null;
                            } else {
                                expect(chapter.chapterTitle).to.be.a('string');
                            }
                            expect(chapter.authorName).to.be.a('string');
                        }
                    });
                });

                describe('GET /chapter with search query string {storiesOnly: true}', function () {
                    it('should return a 200 status and a list of stories', async function () {
                        await agent.post('/logout');

                        const res = await agent.get('/chapter').query({ storiesOnly: true });

                        expect(res).to.have.status(200);
                        expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.resultsPerPage);
                        for (const chapter of res.body) {
                            expect(chapter).to.have.all.keys(...summaryKeys);
                            expectMongoObjectId(chapter.storyId);
                            expectMongoObjectId(chapter.chapterId);
                            expect(chapter.storyId).to.deep.equal(chapter.chapterId);
                            expect(chapter.storyTitle).to.be.a('string');
                            expect(chapter.chapterTitle).to.be.null;
                            expect(chapter.previousChapter).to.be.null;
                            expect(chapter.authorName).to.be.a('string');
                        }
                    });
                });

                describe('GET /chapter with search query string { search: "a:Freddy" } ', function () {
                    it('should return a 200 OK list of chapters with authorName matching "Freddy"', async function () {
                        const res = await agent.get('/chapter').query({ search: "a:Freddy" });

                        expect(res).to.have.status(200);
                        expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.resultsPerPage);
                        for (const chapter of res.body) {
                            expect(chapter).to.have.all.keys(...summaryKeys);
                            expectMongoObjectId(chapter.storyId);
                            expectMongoObjectId(chapter.chapterId);
                            expect(chapter.storyTitle).to.be.a('string');
                            if (chapter.storyId == chapter.chapterId) {
                                expect(chapter.chapterTitle).to.be.null;
                            } else {
                                expect(chapter.chapterTitle).to.be.a('string');
                            }
                            expect(chapter.authorName).to.be.a('string').which.matches(/Freddy/i);
                        }
                    });
                });

                describe('GET /chapter with search query string { search: "c:dd"} ', function () {
                    it('should return a 200 OK list of chapters with chapterTitle matching "dd"', async function () {
                        const res = await agent.get('/chapter').query({ search: 'c:dd' });

                        expect(res).to.have.status(200);
                        expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.resultsPerPage);
                        for (const chapter of res.body) {
                            expect(chapter).to.have.all.keys(...summaryKeys);
                            expectMongoObjectId(chapter.storyId);
                            expectMongoObjectId(chapter.chapterId);
                            expect(chapter.storyTitle).to.be.a('string');
                            expect(chapter.chapterTitle).to.be.a('string').which.matches(/dd/i);
                            expect(chapter.authorName).to.be.a('string');
                        }
                    });
                });

                describe('GET /chapter with search query string { search: "s:beginning" } ', function () {
                    it('should return a 200 OK list of chapters with storyTitle matching "beginning"', async function () {
                        const res = await agent.get('/chapter').query({ search: 's:beginning' });

                        expect(res).to.have.status(200);
                        expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.resultsPerPage);
                        for (const chapter of res.body) {
                            expect(chapter).to.have.all.keys(...summaryKeys);
                            expectMongoObjectId(chapter.storyId);
                            expectMongoObjectId(chapter.chapterId);
                            expect(chapter.storyTitle).to.be.a('string').which.matches(/beginning/i);
                            if (chapter.storyId == chapter.chapterId) {
                                expect(chapter.chapterTitle).to.be.null;
                            } else {
                                expect(chapter.chapterTitle).to.be.a('string');
                            }
                            expect(chapter.authorName).to.be.a('string');
                        }
                    });
                });

                describe('GET /chapter with search query string { search: "ac:dd" } ', function () {
                    it('should return a 200 OK list of chapters with authorName OR chapter title matching "dd"', async function () {
                        const res = await agent.get('/chapter').query({ search: 'ac:dd' });

                        expect(res).to.have.status(200);
                        expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.resultsPerPage);
                        for (const chapter of res.body) {
                            expect(chapter).to.have.all.keys(...summaryKeys);
                            expectMongoObjectId(chapter.storyId);
                            expectMongoObjectId(chapter.chapterId);
                            expect(chapter.storyTitle).to.be.a('string');
                            if (chapter.storyId == chapter.chapterId) {
                                expect(chapter.chapterTitle).to.be.null;
                            } else {
                                expect(chapter.chapterTitle).to.be.a('string');
                            }
                            expect(chapter.authorName).to.be.a('string');
                            expect(chapter.authorName + ' ' + chapter.chapterTitle).to.be.a('string').which.matches(/dd/i);
                        }
                    });
                });

                describe('GET /chapter with search query string { search: "o:a" }', function () {
                    it('should return a 200 OK list of chapters sorted in increasing order by author', async function () {
                        const res = await agent.get('/chapter').query({ search: "o:a" });

                        expect(res).to.have.status(200);
                        expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.resultsPerPage);
                        let previous = res.body[0].authorName;
                        for (const chapter of res.body) {
                            expect(chapter).to.have.all.keys(...summaryKeys);
                            expectMongoObjectId(chapter.storyId);
                            expectMongoObjectId(chapter.chapterId);
                            expect(chapter.storyTitle).to.be.a('string');
                            if (chapter.storyId == chapter.chapterId) {
                                expect(chapter.chapterTitle).to.be.null;
                            } else {
                                expect(chapter.chapterTitle).to.be.a('string');
                            }
                            expect(chapter.authorName).to.be.a('string');
                            expect(previous.toLowerCase() <= chapter.authorName.toLowerCase()).to.be.true;
                            previous = chapter.authorName;
                        }
                    });
                });

                describe('GET /chapter with search query string { search: "o:A" }', function () {
                    it('should return a 200 OK list of chapters sorted in decreasing order by author', async function () {
                        const res = await agent.get('/chapter').query({ search: "o:A" });

                        expect(res).to.have.status(200);
                        expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.resultsPerPage);
                        let previous = res.body[0].authorName;
                        for (const chapter of res.body) {
                            expect(chapter).to.have.all.keys(...summaryKeys);
                            expectMongoObjectId(chapter.storyId);
                            expectMongoObjectId(chapter.chapterId);
                            expect(chapter.storyTitle).to.be.a('string');
                            if (chapter.storyId == chapter.chapterId) {
                                expect(chapter.chapterTitle).to.be.null;
                            } else {
                                expect(chapter.chapterTitle).to.be.a('string');
                            }
                            expect(chapter.authorName).to.be.a('string');
                            expect(previous.toLowerCase() >= chapter.authorName.toLowerCase()).to.be.true;
                            previous = chapter.authorName;
                        }
                    });
                });

                describe('GET /chapter with search query string { search: "o:c" }', function () {
                    it('should return a 200 OK list of chapters sorted in increasing order by chapterTitle', async function () {
                        const res = await agent.get('/chapter').query({ search: "o:c" });

                        expect(res).to.have.status(200);
                        expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.resultsPerPage);
                        let previous = res.body[0].chapterTitle;
                        for (const chapter of res.body) {
                            expect(chapter).to.have.all.keys(...summaryKeys);
                            expectMongoObjectId(chapter.storyId);
                            expectMongoObjectId(chapter.chapterId);
                            expect(chapter.storyTitle).to.be.a('string');
                            if (chapter.storyId == chapter.chapterId) {
                                expect(chapter.chapterTitle).to.be.null;
                            } else {
                                expect(chapter.chapterTitle).to.be.a('string');
                                expect(previous == null || previous.toLowerCase() <= chapter.chapterTitle.toLowerCase()).to.be.true;
                                previous = chapter.chapterTitle;
                            }
                        }
                    });
                });

                describe('GET /chapter with search query string { search: "o:C" }', function () {
                    it('should return a 200 OK list of chapters sorted in increasing order by chapterTitle', async function () {
                        const res = await agent.get('/chapter').query({ search: "o:C" });

                        expect(res).to.have.status(200);
                        expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.resultsPerPage);
                        let previous = res.body[0].chapterTitle;
                        for (const chapter of res.body) {
                            expect(chapter).to.have.all.keys(...summaryKeys);
                            expectMongoObjectId(chapter.storyId);
                            expectMongoObjectId(chapter.chapterId);
                            expect(chapter.storyTitle).to.be.a('string');
                            if (chapter.storyId == chapter.chapterId) {
                                expect(chapter.chapterTitle).to.be.null;
                            } else {
                                expect(chapter.chapterTitle).to.be.a('string');
                                expect(chapter.chapterTitle == null || previous.toLowerCase() >= chapter.chapterTitle.toLowerCase()).to.be.true;
                                previous = chapter.chapterTitle;
                            }
                        }
                    });
                });

                describe('GET /chapter with search query string { search: "o:sC" }', function () {
                    it('should return a 200 OK list of chapters sorted in increasing order by chapterTitle', async function () {
                        const res = await agent.get('/chapter').query({ search: "o:sC" });

                        expect(res).to.have.status(200);
                        expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.resultsPerPage);
                        let previous = res.body[0];
                        for (const chapter of res.body) {
                            expect(chapter).to.have.all.keys(...summaryKeys);
                            expectMongoObjectId(chapter.storyId);
                            expectMongoObjectId(chapter.chapterId);
                            expect(chapter.storyTitle).to.be.a('string');
                            if (chapter.storyId == chapter.chapterId) {
                                expect(chapter.chapterTitle).to.be.null;
                            } else {
                                expect(chapter.chapterTitle).to.be.a('string');
                            }
                            if (previous.storyTitle.toLowerCase() == chapter.storyTitle.toLowerCase()) {
                                expect(chapter.chapterTitle == null || previous.chapterTitle.toLowerCase() >= chapter.chapterTitle.toLowerCase()).to.be.true;
                            } else {
                                expect(previous.storyTitle.toLowerCase() < chapter.storyTitle.toLowerCase())
                            }
                            previous = chapter;
                        }
                    });
                });
            });

            describe('Sad paths', function () {
                describe('GET /chapter with search query string { search: "o:x" }', function () {
                    it('should return a 400 status and an error message.', async function () {
                        const res = await agent.get('/chapter').query({ search: "o:x" });

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Misformed query string." })
                    });;
                });

                describe('GET /chapter with search query string { search: "o:aca" }', function () {
                    it('should return a 400 status and an error message.', async function () {
                        const res = await agent.get('/chapter').query({ search: "o:aca" });

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Misformed query string." })
                    });;
                });

                describe('GET /chapter with search query string { search: "o:acA" }', function () {
                    it('should return a 400 status and an error message.', async function () {
                        const res = await agent.get('/chapter').query({ search: "o:acA" });

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Misformed query string." })
                    });;
                });

                describe('GET /chapter with search query string { search: "w:Freddy" }', function () {
                    it('should return a 400 status and an error message.', async function () {
                        const res = await agent.get('/chapter').query({ search: "w:Freddy" });

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Misformed query string." })
                    });;
                });

                describe('GET /chapter with search query string { search: "aca:Freddy" }', function () {
                    it('should return a 400 status and an error message.', async function () {
                        const res = await agent.get('/chapter').query({ search: "aca:Freddy" });

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Misformed query string." })
                    });;
                });
            });
        });

        describe('Test the :chapterId param middleware', function () {
            describe('Happy paths', function () {
                describe('GET /chapter/:chapterId with an existing chapterId', function () {
                    it('should return a 200 status', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);

                        const res = await agent.get('/chapter/' + storyRes.body.chapterId);

                        expect(res).to.have.status(200);

                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });
            });

            describe('Sad paths', function () {
                describe('GET /chapter/:chapterId with a nonexistant chapterId', function () {
                    it('should return a 404 status and an error message', async function () {
                        const res = await agent.get('/chapter/000000000000000000000000');

                        expect(res).to.have.status(404);
                        expect(res.body).to.deep.equal({ error: "There is no chapter with that chapterId." });
                    });
                });
            });

            describe('GET /chapter/:chapterId with a misformed chapterId', function () {
                it('should return a 400 status and an error message', async function () {
                    const res = await agent.get('/chapter/0');

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "That is not a properly formatted chapterId." });
                });
            });
        });

        describe('Test the GET /chapter/:chapterId route', function () {
            describe('Happy paths', function () {
                describe('GET /chapter/:chapterId on a new story', function () {
                    it('should return a 200 OK and the chapter.fullInfoWithContinuations()', async function () {
                        const userRes = await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);

                        const res = await agent.get('/chapter/' + storyRes.body.chapterId);

                        expect(res).to.have.status(200);
                        expectMongoObjectId(res.body.chapterId);
                        expect(res.body.chapterId).to.deep.equal(storyRes.body.chapterId);
                        expect(res.body.authorName).to.deep.equal(testUserLogin.name);
                        expectMongoObjectId(res.body.authorId);
                        expect(res.body.authorId).to.deep.equal(userRes.body.userId)
                        expect(res.body.chapterTitle).to.be.null;
                        expect(res.body.storyTitle).to.deep.equal(testStory.storyTitle);
                        expect(res.body.bodyText).to.deep.equal(testStory.bodyText);
                        expect(res.body.previousChapter).to.be.null;
                        expect(res.body.likes).to.deep.equal(0);
                        expect(res.body.createDate).to.be.a('string');
                        expect(res.body.storyId).to.deep.equal(storyRes.body.chapterId);
                        expect(res.body.continuationChapters).to.be.an('array').with.lengthOf(0);

                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });

                describe('GET /chapter/:chapterId on a new chapter', function () {
                    it('should return a 200 OK and the chapter.fullInfoWithContinuations()', async function () {
                        const userRes = await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        const chapterRes = await agent.post('/chapter/' + storyRes.body.chapterId).send(testChapter);

                        const res = await agent.get('/chapter/' + chapterRes.body.chapterId);

                        expect(res).to.have.status(200);
                        expectMongoObjectId(res.body.chapterId);
                        expect(res.body.chapterId).to.deep.equal(chapterRes.body.chapterId);
                        expect(res.body.authorName).to.deep.equal(testUserLogin.name);
                        expectMongoObjectId(res.body.authorId);
                        expect(res.body.authorId).to.deep.equal(userRes.body.userId)
                        expect(res.body.chapterTitle).to.deep.equal(testChapter.chapterTitle);
                        expect(res.body.storyTitle).to.deep.equal(testStory.storyTitle);
                        expect(res.body.bodyText).to.deep.equal(testChapter.bodyText);
                        expect(res.body.previousChapter).to.deep.equal(storyRes.body.chapterId);
                        expect(res.body.likes).to.deep.equal(0);
                        expect(res.body.createDate).to.be.a('string');
                        expect(res.body.storyId).to.deep.equal(storyRes.body.chapterId);
                        expect(res.body.continuationChapters).to.be.an('array').with.lengthOf(0);

                        await Chapter.findByIdAndDelete(chapterRes.body.chapterId);
                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });
            });
        });
    });

    describe('Test the chapter posting routes', function () {
        describe('Test the POST /chapter route', function () {
            describe('Happy paths', function () {
                describe('POST /chapter with testStory', function () {
                    it('should return a 201 CREATED and the chapter.fullInfo()', async function () {
                        await agent.post('/login').send(testUserLogin);

                        const res = await agent.post('/chapter').send(testStory);

                        expect(res).to.have.status(201);
                        expectMongoObjectId(res.body.storyId);
                        expect(res.body.chapterId).to.deep.equal(res.body.storyId);
                        expect(res.body.storyTitle).to.deep.equal(testStory.storyTitle);
                        expect(res.body.chapterTitle).to.be.null;
                        expect(res.body.authorName).to.deep.equal(testUserLogin.name);
                        expectMongoObjectId(res.body.authorId);
                        expect(res.body.bodyText).to.deep.equal(testStory.bodyText);
                        expect(res.body.previousChapter).to.be.null;
                        expect(res.body.likes).to.deep.equal(0);
                        expect(res.body.createDate).to.be.a('string');
                        expect(res.body.keywords).to.deep.equal(testStory.keywords);

                        await Chapter.findByIdAndDelete(res.body.chapterId);
                    });
                });

                describe('POST /chapter with testStory but no keywords', function () {
                    it('should return a keywords value of an empty array', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const testStoryNoKeywords = deepCopy(testStory);
                        delete testStoryNoKeywords.keywords;

                        const res = await agent.post('/chapter').send(testStoryNoKeywords);

                        expect(res.body.keywords).to.deep.equal([]);

                        await Chapter.findByIdAndDelete(res.body.chapterId);
                    });
                });

                describe('POST /chapter with testStory and GET /profile', function () {
                    it('should return testStory from GET /profile in the publishedChapters field', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const chapterRes = await agent.post('/chapter').send(testStory);

                        const res = await agent.get('/profile');

                        expect(res.body.publishedChapters[0].storyId).to.deep.equal(chapterRes.body.storyId);
                        expect(res.body.publishedChapters[0].chapterId).to.deep.equal(chapterRes.body.chapterId);
                        expect(res.body.publishedChapters[0].storyTitle).to.deep.equal(chapterRes.body.storyTitle);
                        expect(res.body.publishedChapters[0].chapterTitle).to.deep.equal(chapterRes.body.chapterTitle);
                        expect(res.body.publishedChapters[0].authorName).to.deep.equal(chapterRes.body.authorName);
                        expect(res.body.publishedChapters[0].previousChapter).to.deep.equal(chapterRes.body.previousChapter);
                        expect(res.body.publishedChapters[0].keywords).to.deep.equal(chapterRes.body.keywords);

                        await Chapter.findByIdAndDelete(chapterRes.body.chapterId);
                    });
                });

                describe('POST /chapter with testStory and GET /user/:userId', function () {
                    it('should return testStory from GET /user/:userId in the publishedChapters field', async function () {
                        const loginRes = await agent.post('/login').send(testUserLogin);
                        const chapterRes = await agent.post('/chapter').send(testStory);

                        const res = await agent.get("/user/" + loginRes.body.userId);

                        expect(res.body.publishedChapters[0].chapterId).to.deep.equal(chapterRes.body.chapterId);
                        expect(res.body.publishedChapters[0].storyTitle).to.deep.equal(chapterRes.body.storyTitle);
                        expect(res.body.publishedChapters[0].chapterTitle).to.deep.equal(chapterRes.body.chapterTitle);
                        expect(res.body.publishedChapters[0].keywords).to.deep.equal(chapterRes.body.keywords);

                        await Chapter.findByIdAndDelete(chapterRes.body.chapterId);
                    });
                });
            });

            describe('Sad paths', function () {
                describe('Logout and POST /chapter with testStory', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/logout');

                        const res = await agent.post('/chapter').send(testStory);

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                    });
                });

                describe('POST /chapter with missing story text', function () {
                    it('should return a 400 bad request and an error message', async function () {
                        await agent.post('/login').send(testUserLogin);

                        const res = await agent.post('/chapter').send({ storyTitle: "Deterministic story title" });

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Missing story text." })
                    });
                });

                describe('Post /chapter with missing story title', function () {
                    it('should return a 400 bad request and an error message', async function () {
                        await agent.post('/login').send(testUserLogin);

                        const res = await agent.post('/chapter').send({ bodyText: "Deterministic text" });

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Missing story title." });
                    });
                });

                describe('Post /chapter with keywords defined to be something other than an array', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const testStoryBadKeywords = deepCopy(testStory);
                        testStoryBadKeywords.keywords = "string";

                        const res = await agent.post('/chapter').send(testStoryBadKeywords);

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Request body must be an array of strings." })

                        await Chapter.findByIdAndDelete(res.body.chapterId);
                    });
                });

                describe('Post /chapter with keywords defined to be an array containing a non-string', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const testStoryBadKeywords = deepCopy(testStory);
                        testStoryBadKeywords.keywords.push(1);

                        const res = await agent.post('/chapter').send(testStoryBadKeywords);

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Request body must be an array of strings." })

                        await Chapter.findByIdAndDelete(res.body.chapterId);
                    });
                });

                describe('Post /chapter with keywords defined to be an array containing an invalid keyword', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const testStoryBadKeywords = deepCopy(testStory);
                        testStoryBadKeywords.keywords.push("keyword?");

                        const res = await agent.post('/chapter').send(testStoryBadKeywords);

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Request body must be an array of strings." })

                        await Chapter.findByIdAndDelete(res.body.chapterId);
                    });
                });
            });
        });

        describe('Test the POST /chapter/:chapterId route', function () {
            describe('Happy paths', function () {
                describe('POST /chapter/:chapterId with testChapter', function () {
                    it('should return a 201 status and the chapter.fullInfo()', async function () {
                        const loginRes = await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);

                        const res = await agent.post('/chapter/' + storyRes.body.chapterId).send(testChapter);

                        expect(res).to.have.status(201);
                        expectMongoObjectId(res.body.chapterId);
                        expect(res.body.storyId).to.deep.equal(storyRes.body.storyId);
                        expect(res.body.storyTitle).to.deep.equal(testStory.storyTitle);
                        expect(res.body.chapterTitle).to.deep.equal(testChapter.chapterTitle);
                        expect(res.body.authorName).to.deep.equal(testUserLogin.name);
                        expect(res.body.authorId).to.deep.equal(loginRes.body.userId);
                        expect(res.body.bodyText).to.deep.equal(testChapter.bodyText);
                        expect(res.body.previousChapter).to.deep.equal(storyRes.body.chapterId);
                        expect(res.body.likes).to.deep.equal(0);
                        expect(res.body.createDate).to.be.a('string');
                        expect(res.body.keywords).to.deep.equal(testChapter.keywords);

                        await Chapter.findByIdAndDelete(res.body.chapterId);
                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });

                describe('POST /chapter/:chapterId with testChapter but no keywords', function () {
                    it('should return a 201 status and the chapter.fullInfo()', async function () {
                        const loginRes = await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        const testChapterNoKeywords = deepCopy(testChapter);
                        delete testChapterNoKeywords.keywords;

                        const res = await agent.post('/chapter/' + storyRes.body.chapterId).send(testChapterNoKeywords);

                        expect(res).to.have.status(201);
                        expectMongoObjectId(res.body.chapterId);
                        expect(res.body.storyId).to.deep.equal(storyRes.body.storyId);
                        expect(res.body.storyTitle).to.deep.equal(testStory.storyTitle);
                        expect(res.body.chapterTitle).to.deep.equal(testChapter.chapterTitle);
                        expect(res.body.authorName).to.deep.equal(testUserLogin.name);
                        expect(res.body.authorId).to.deep.equal(loginRes.body.userId);
                        expect(res.body.bodyText).to.deep.equal(testChapter.bodyText);
                        expect(res.body.previousChapter).to.deep.equal(storyRes.body.chapterId);
                        expect(res.body.likes).to.deep.equal(0);
                        expect(res.body.createDate).to.be.a('string');
                        expect(res.body.keywords).to.deep.equal([]);

                        await Chapter.findByIdAndDelete(res.body.chapterId);
                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });

                describe('POST /chapter/:chapterId with testChapter and check GET /profile', function () {
                    it('should return the chapter in the publishedChapters field', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        const chapterRes = await agent.post('/chapter/' + storyRes.body.chapterId).send(testChapter);

                        const res = await agent.get('/profile');

                        expect(res.body.publishedChapters[0].storyId).to.deep.equal(chapterRes.body.storyId);
                        expect(res.body.publishedChapters[0].chapterId).to.deep.equal(chapterRes.body.chapterId);
                        expect(res.body.publishedChapters[0].storyTitle).to.deep.equal(chapterRes.body.storyTitle);
                        expect(res.body.publishedChapters[0].chapterTitle).to.deep.equal(chapterRes.body.chapterTitle);
                        expect(res.body.publishedChapters[0].authorName).to.deep.equal(chapterRes.body.authorName);
                        expect(res.body.publishedChapters[0].previouChapter).to.deep.equal(chapterRes.body.previouChapter);
                        expect(res.body.publishedChapters[0].keywords).to.deep.equal(chapterRes.body.keywords);

                        await Chapter.findByIdAndDelete(chapterRes.body.chapterId);
                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });

                describe('POST /chapter/:chapterId with testChapter and check GET /user/:userId', function () {
                    it('should return the chapter in the publishedChapters field', async function () {
                        const userRes = await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        const chapterRes = await agent.post('/chapter/' + storyRes.body.chapterId).send(testChapter);

                        const res = await agent.get('/user/' + userRes.body.userId);

                        expect(res.body.publishedChapters[0].chapterId).to.deep.equal(chapterRes.body.chapterId);
                        expect(res.body.publishedChapters[0].storyTitle).to.deep.equal(chapterRes.body.storyTitle);
                        expect(res.body.publishedChapters[0].chapterTitle).to.deep.equal(chapterRes.body.chapterTitle);
                        expect(res.body.publishedChapters[0].keywords).to.deep.equal(chapterRes.body.keywords);

                        await Chapter.findByIdAndDelete(chapterRes.body.chapterId);
                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });
            });

            describe('Sad paths', function () {
                describe('Logout and POST /chapter/:chapterId with testChapter', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        await agent.post('/logout');

                        const res = await agent.post('/chapter/' + storyRes.body.chapterId).send(testChapter);

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');

                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });

                describe('POST /chapter/:chapterId with missing story text', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);

                        const res = await agent.post('/chapter/' + storyRes.body.chapterId).send({ chapterTitle: "Deterministic chapter title" });

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Missing story text." });

                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });

                describe('POST /chapter/:chapterId with missing chapterTitle', function () {
                    it('should return a 400 misformed and an error message', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);

                        const res = await agent.post('/chapter/' + storyRes.body.chapterId).send({ bodyText: "Deterministic text" });

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Missing chapter title." });

                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });

                describe('POST /chapter/:chapterId with keywords defined to be something other than an array', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        const testChapterBadKeywords = deepCopy(testChapter);
                        testChapterBadKeywords.keywords = "string";

                        const res = await agent.post('/chapter/' + storyRes.body.chapterId).send(testChapterBadKeywords);

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Request body must be an array of strings." });

                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });

                describe('POST /chapter/:chapterId with keywords defined to be an array containing a non-string', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        const testChapterBadKeywords = deepCopy(testChapter);
                        testChapterBadKeywords.keywords.push(1);

                        const res = await agent.post('/chapter/' + storyRes.body.chapterId).send(testChapterBadKeywords);

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Request body must be an array of strings." });

                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });

                describe('POST /chapter/:chapterId with keywords defined to be an array containing an invalid keyword', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        const testChapterBadKeywords = deepCopy(testChapter);
                        testChapterBadKeywords.keywords.push("keyword?");

                        const res = await agent.post('/chapter/' + storyRes.body.chapterId).send(testChapterBadKeywords);

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Request body must be an array of strings." });

                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });
            });
        });
    });



    describe('Test the like handling routes', function () {
        describe('Test the POST /chapter/:chapterId/like route', function () {
            describe('Happy paths', function () {
                describe('Login and POST /chapter/:chapterId/like', function () {
                    it('should return a 200 status and a success message, and add a like to the database', async function () {
                        await agent.post('/login').send(adminLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        const loginRes = await agent.post('/login').send(testUserLogin);

                        const res = await agent.post('/chapter/' + storyRes.body.chapterId + '/like');
                        const likeRes = await Like.findOne({ user: loginRes.body.userId, chapter: storyRes.body.chapterId });

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal({ message: "Chapter liked." });
                        expect(likeRes).to.not.be.null;

                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                        await Like.findByIdAndDelete(likeRes._id);
                    });
                });

                describe('Login and like a chapter and check GET /chapter/:chapterId', function () {
                    it('should count the like in the likes field and the likedByUser field', async function () {
                        await agent.post('/login').send(adminLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        const loginRes = await agent.post('/login').send(testUserLogin);

                        await agent.post('/chapter/' + storyRes.body.chapterId + '/like');
                        const chapterIdRes = await agent.get('/chapter/' + storyRes.body.chapterId);

                        expect(chapterIdRes.body.likes).to.deep.equal(1);
                        expect(chapterIdRes.body.likedByUser).to.be.true;

                        const likeIdRes = await Like.findOne({ user: loginRes.body.userId, chapter: storyRes.body.chapterId })
                        await Like.findByIdAndDelete(likeIdRes._id);
                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });

                describe('Login and like a chapter and check GET /chapter?search=<testString>', function () {
                    it('should return bookmarkedByUser is true in the chapter', async function () {
                        await agent.post('/login').send(adminLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        const loginRes = await agent.post('/login').send(testUserLogin);
                        await agent.post('/chapter/' + storyRes.body.chapterId + '/like');

                        const chapterIdRes = await agent.get('/chapter').query({ search: "s:" + testString });

                        expect(chapterIdRes.body).to.be.an('array').with.lengthOf(1);
                        expect(chapterIdRes.body[0].likedByUser).to.be.true;

                        const likeIdRes = await Like.findOne({ user: loginRes.body.userId, chapter: storyRes.body.chapterId })
                        await Like.findByIdAndDelete(likeIdRes._id);
                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });

                describe('Login and like a chapter and check GET /profile', function () {
                    it('should have the liked chapter in the likedChapters field', async function () {
                        await agent.post('/login').send(adminLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        await agent.post('/login').send(testUserLogin);
                        await agent.post('/chapter/' + storyRes.body.chapterId + '/like');
                        const like = await Like.findOne({ chapter: storyRes.body.chapterId });

                        const res = await agent.get('/profile');

                        expect(res).to.have.status(200);
                        expect(res.body.likedChapters).to.be.an('array').with.lengthOf(1);
                        expect(res.body.likedChapters[0].chapterId).to.deep.equal(storyRes.body.chapterId);

                        await Like.findByIdAndDelete(like._id);
                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });
            });

            describe('Sad paths', function () {
                describe('Logout and POST a like to a story', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        await agent.post('/logout');

                        const res = await agent.post('/chapter/' + storyRes.body.chapterId + '/like');

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');

                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });

                describe('Login, post a chapter, and like the chapter', function () {
                    it('should return a 409 status and an error message', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const chapterRes = await agent.post('/chapter').send(testStory);

                        const res = await agent.post('/chapter/' + chapterRes.body.chapterId + '/like');

                        expect(res).to.have.status(409);
                        expect(res.body).to.deep.equal({ error: "You cannot like your own chapters." });

                        await Chapter.findByIdAndDelete(chapterRes.body.chapterId);
                    });
                });

                describe('Login and POST a like to an already liked story', function () {
                    it('should return a 409 status and an error message', async function () {
                        await agent.post('/login').send(adminLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        await agent.post('/login').send(testUserLogin);

                        await agent.post('/chapter/' + storyRes.body.chapterId + '/like');
                        const res = await agent.post('/chapter/' + storyRes.body.chapterId + '/like');

                        expect(res).to.have.status(409);
                        expect(res.body).to.deep.equal({ error: "You have already liked that chapter." });

                        await agent.delete('/chapter/' + storyRes.body.chapterId + '/like');
                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });

                describe('Login and like a chapter, delete the chapter directly from the database, and check GET /profile', function () {
                    it('should remove that like from the user\'s likedChapters list and not crash the backend', async function () {
                        await agent.post('/login').send(adminLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        await agent.post('/login').send(testUserLogin);
                        await agent.post('/chapter/' + storyRes.body.chapterId + '/like');
                        const like = await Like.findOne({ chapter: storyRes.body.chapterId });
                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);

                        const res = await agent.get('/profile');

                        expect(res).to.have.status(200);
                        expect(res.body.likedChapters).to.be.an('array').with.lengthOf(0);

                        await Like.findByIdAndDelete(like._id);
                    });
                });
            });
        });

        describe('Test the DELETE /chapter/:chapterId/like route', function () {
            describe('Happy paths', function () {
                describe('Login and unlike a liked chapter', function () {
                    it('should return a 200 status and return a success message and remove the like from the database', async function () {
                        await agent.post('/login').send(adminLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        await agent.post('/login').send(testUserLogin);
                        await agent.post('/chapter/' + storyRes.body.chapterId + '/like');

                        const res = await agent.delete('/chapter/' + storyRes.body.chapterId + '/like');
                        const foundLike = await Like.findOne({ chapter: storyRes.body.chapterId });

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal({ message: "Like successfully removed." });
                        expect(foundLike).to.be.null;

                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });
            });

            describe('Sad paths', function () {
                describe('Logout and unlike a liked chapter', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        await agent.post('/chapter/' + storyRes.body.chapterId + '/like');
                        await agent.post('/logout');

                        const res = await agent.delete('/chapter/' + storyRes.body.chapterId + '/like');

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');

                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });

                describe('Login and unlike a chapter that isn\'t liked', function () {
                    it('should return a 404 status and an error message', async function () {
                        await agent.post('/login').send(adminLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        await agent.post('/login').send(testUserLogin);

                        const res = await agent.delete('/chapter/' + storyRes.body.chapterId + '/like');

                        expect(res).to.have.status(404);
                        expect(res.body).to.deep.equal({ error: "You have not liked that chapter." });

                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });
            });
        });
    });


    describe('Test the flag handling routes', function () {
        describe('Test POST /chapter/:chapterId/flag', function () {
            describe('Happy paths', function () {
                describe('Logout and flag a chapter', function () {
                    it('should return a 200 status and a success message, and put a flag in the database', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        await agent.post('/logout');

                        const res = await agent.post('/chapter/' + storyRes.body.chapterId + '/flag').send({ reason: testString });
                        const flag = await Flag.findOne({ reason: testString });

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal({ message: "Chapter successfully flagged." });
                        expect(flag.chapter.toString()).to.deep.equal(storyRes.body.chapterId);
                        expect(flag.user).to.be.null;
                        expect(flag.reason).to.deep.equal(testString);

                        await Flag.findByIdAndDelete(flag._id);
                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });

                describe('Login and flag a chapter', function () {
                    it('should return a 200 status and a success message, and put a flag in the database', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);


                        const res = await agent.post('/chapter/' + storyRes.body.chapterId + '/flag').send({ reason: testString + "1" });
                        const flag = await Flag.findOne({ reason: testString + "1" });

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal({ message: "Chapter successfully flagged." });
                        expect(flag.chapter.toString()).to.deep.equal(storyRes.body.chapterId);
                        expect(flag.user.equals(newUserPrivateProfile().userId)).to.be.true;
                        expect(flag.reason).to.deep.equal(testString + "1");

                        await Flag.findByIdAndDelete(flag._id);
                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });
            });

            describe('Sad paths', function () {
                describe('Flag without a reason', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);

                        const res = await agent.post('/chapter/' + storyRes.body.chapterId + '/flag');

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Flagging a chapter needs a reason." });

                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });

                describe('Flag with an empty reason', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);

                        const res = await agent.post('/chapter/' + storyRes.body.chapterId + '/flag').send({ reason: "" });

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Flagging a chapter needs a reason." });

                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });

                describe('Flag a chapter, then delete the chapter from the database and GET /admin/flag', function () {
                    it('should remove the flag from the list of returned flags and not crash the back end', async function () {
                        await agent.post('/login').send(adminLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        await agent.post('/chapter/' + storyRes.body.chapterId + '/flag').send({ reason: testString });
                        const flag = await Flag.findOne({ chapter: storyRes.body.chapterId });
                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);

                        const res = await agent.get('/admin/flag');

                        expect(res).to.have.status(200);
                        expect(res.body.some(f => f.chapter == storyRes.body.chapterId)).to.be.false;

                        await Flag.findByIdAndDelete(flag._id);
                    });
                });
            });
        });

    });

    describe('Test the bookmark handling routes', function () {
        describe('Test the POST /chapter/:chapterId/bookmark route', function () {
            describe('Happy paths', function () {
                describe('Login and POST a bookmark', function () {
                    it('should return a 200 status and a success message, and add a bookmark to the database', async function () {
                        const loginRes = await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);

                        const res = await agent.post('/chapter/' + storyRes.body.chapterId + '/bookmark');
                        const bookmark = await Bookmark.findOne({ user: loginRes.body.userId });

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal({ message: "Chapter bookmarked." });
                        expect(bookmark).to.not.be.null;

                        await Bookmark.findByIdAndDelete(bookmark._id);
                        await Chapter.findByIdAndDelete(storyRes.body.chapterId)
                    });

                });

                describe('Login, post a bookmark, and GET /profile', function () {
                    it('should return the bookmarked chapter in bookmarkedChapters', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        await agent.post('/chapter/' + storyRes.body.chapterId + '/bookmark');
                        const bookmark = await Bookmark.findOne({ chapter: storyRes.body.chapterId });

                        const res = await agent.get('/profile');

                        expect(res.body.bookmarkedChapters).to.be.an('array').with.lengthOf(1);
                        expect(res.body.bookmarkedChapters[0].storyId).to.deep.equal(storyRes.body.chapterId);

                        await Bookmark.findByIdAndDelete(bookmark._id);
                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });

                describe('Login, post a bookmark, and GET /chapter/:chapterId', function () {
                    it('should return bookmarkedByUser is true in the chapter', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        await agent.post('/chapter/' + storyRes.body.chapterId + '/bookmark');
                        const bookmark = await Bookmark.findOne({ chapter: storyRes.body.chapterId });

                        const res = await agent.get('/chapter/' + storyRes.body.chapterId);

                        expect(res).to.have.status(200);
                        expect(res.body.bookmarkedByUser).to.be.true;

                        await Bookmark.findByIdAndDelete(bookmark._id);
                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });

                describe('Login, post a bookmark, and GET /chapter?search=<testString>', function () {
                    it('should return bookmarkedByUser is true in the chapter', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        await agent.post('/chapter/' + storyRes.body.chapterId + '/bookmark');
                        const bookmark = await Bookmark.findOne({ chapter: storyRes.body.chapterId });

                        const res = await agent.get('/chapter').query({ search: "s:" + testString });

                        expect(res).to.have.status(200);
                        expect(res.body).to.be.an('array').with.lengthOf(1);
                        expect(res.body[0].bookmarkedByUser).to.be.true;

                        await Bookmark.findByIdAndDelete(bookmark._id);
                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });
            });

            describe('Sad paths', function () {
                describe('Logout and POST a bookmark', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const chapter = await agent.post('/chapter').send(testStory);
                        await agent.post('/logout');

                        const res = await agent.post('/chapter/' + chapter.body.chapterId + '/bookmark');

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');

                        await Chapter.findByIdAndDelete(chapter.body.chapterId);
                    });
                });

                describe('Login and POST a duplicate bookmark', function () {
                    it('should return 409 status and an error message', async function () {
                        const loginRes = await agent.post('/login').send(testUserLogin);
                        const chapter = await agent.post('/chapter').send(testStory);

                        await agent.post('/chapter/' + chapter.body.chapterId + '/bookmark');
                        const res = await agent.post('/chapter/' + chapter.body.chapterId + '/bookmark');

                        expect(res).to.have.status(409);

                        await Bookmark.findOneAndDelete({ user: loginRes.body.userId });
                        await Chapter.findByIdAndDelete(chapter.body.chapterId);
                    });
                });

                describe('Login, bookmark a chapter, then delete the chapter from the database, and GET /profile and check bookmarkedChapters', function () {
                    it('should not include the bookmark for the deleted chapter, and should not crash the backend', async function () {
                        await agent.post('/login').send(testUserLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        await agent.post('/chapter/' + storyRes.body.chapterId + '/bookmark');
                        const bookmark = await Bookmark.findOne({ chapter: storyRes.body.chapterId });
                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);

                        const res = await agent.get('/profile');

                        expect(res).to.have.status(200);
                        expect(res.body.bookmarkedChapters).to.deep.equal([]);

                        await Bookmark.findByIdAndDelete(bookmark._id);
                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });
            });
        });

        describe('Test the DELETE /chapter/:chapterId/bookmark route', function () {
            describe('Happy paths', function () {
                describe('Login and delete a bookmark', function () {
                    it('should return a 200 status and a success message, and remove the bookmark from the database', async function () {
                        await agent.post('/login').send(adminLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        await agent.post('/login').send(testUserLogin);
                        await agent.post('/chapter/' + storyRes.body.chapterId + '/bookmark');

                        const res = await agent.delete('/chapter/' + storyRes.body.chapterId + '/bookmark');
                        const bookmark = await Bookmark.findOne({ chapter: storyRes.body.chapterId });

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal({ message: "Bookmark successfully deleted." });
                        expect(bookmark).to.be.null;

                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });
            });

            describe('Sad paths', function () {
                describe('Login and delete a nonexistant bookmark', function () {
                    it('should return a 404 status and an error message', async function () {
                        await agent.post('/login').send(adminLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        await agent.post('/login').send(testUserLogin);

                        const res = await agent.delete('/chapter/' + storyRes.body.chapterId + '/bookmark');

                        expect(res).to.have.status(404);
                        expect(res.body).to.deep.equal({ error: "You don't have that chapter bookmarked." });

                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });

                describe('Logout and delete a bookmark', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/login').send(adminLogin);
                        const storyRes = await agent.post('/chapter').send(testStory);
                        await agent.post('/login').send(testUserLogin);
                        await agent.post('/chapter/' + storyRes.body.chapterId + '/bookmark');
                        const bookmark = await Bookmark.findOne({ chapter: storyRes.body.chapterId });
                        await agent.post('/logout');

                        const res = await agent.delete('/chapter/' + storyRes.body.chapterId + '/bookmark');

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');

                        await Bookmark.findByIdAndDelete(bookmark._id);
                        await Chapter.findByIdAndDelete(storyRes.body.chapterId);
                    });
                });
            });
        });
    });

    describe('Test the GET /chain/:chapterId route', function () {
        let chapterId1, chapterId2, chapterId3;

        before('Set up chain', async function () {
            await agent.post('/login').send(testUserLogin);
            const storyRes1 = await agent.post('/chapter').send(testStory);
            chapterId1 = storyRes1.body.chapterId;
            const storyRes2 = await agent.post('/chapter/' + chapterId1).send(testChapter);
            chapterId2 = storyRes2.body.chapterId;
            const storyRes3 = await agent.post('/chapter/' + chapterId2).send(testChapter);
            chapterId3 = storyRes3.body.chapterId;
        })

        after('Tear down chain', async function () {
            await Chapter.findByIdAndDelete(chapterId3);
            await Chapter.findByIdAndDelete(chapterId2);
            await Chapter.findByIdAndDelete(chapterId1);
        })

        describe('Happy paths', function () {
            describe('Logout and get a chain of length 1', function () {
                it('should return a 200 status and an array containing 1 chapter', async function () {
                    await agent.post('/logout');

                    const res = await agent.get('/chain/' + chapterId1);

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf(1);
                    expect(res.body[0].chapterId).to.deep.equal(chapterId1);
                });
            });

            describe('Logout and get a chain of length 2', function () {
                it('should return a 200 status and an array containing 2 chapters', async function () {
                    await agent.post('/logout');

                    const res = await agent.get('/chain/' + chapterId2);

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf(2);
                    expect(res.body[0].chapterId).to.deep.equal(chapterId1);
                    expect(res.body[1].chapterId).to.deep.equal(chapterId2);
                });
            });

            describe('Logout and get a chain of length 3', function () {
                it('should return a 200 status and an array containing 3 chapters', async function () {
                    await agent.post('/logout');

                    const res = await agent.get('/chain/' + chapterId3);

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf(3);
                    expect(res.body[0].chapterId).to.deep.equal(chapterId1);
                    expect(res.body[1].chapterId).to.deep.equal(chapterId2);
                    expect(res.body[2].chapterId).to.deep.equal(chapterId3);
                });
            });
        });

        describe('Sad paths', function () {
            describe('Logout and get a broken chain', function () {
                it('should return as much of the chain as it can', async function () {
                    await agent.post('/login').send(testUserLogin);
                    const storyRes1 = await agent.post('/chapter').send(testStory);
                    const storyRes2 = await agent.post('/chapter/' + storyRes1.body.chapterId).send(testChapter);
                    const storyRes3 = await agent.post('/chapter/' + storyRes2.body.chapterId).send(testChapter);
                    await Chapter.findByIdAndDelete(storyRes1.body.chapterId);
                    await agent.post('/logout');

                    const res = await agent.get('/chain/' + storyRes3.body.chapterId);

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf(2);
                    expect(res.body[0].chapterId).to.deep.equal(storyRes2.body.chapterId);
                    expect(res.body[1].chapterId).to.deep.equal(storyRes3.body.chapterId);

                    await Chapter.findByIdAndDelete(storyRes3.body.chapterId);
                    await Chapter.findByIdAndDelete(storyRes2.body.chapterId);
                });
            });
        });
    });

    describe('Test the GET /keyword route', function () {
        let story;

        before('Setup chapter for keyword testing', async function () {
            await agent.post('/login').send(testUserLogin);
            const storyRes = await agent.post('/chapter').send(testStory);
            story = storyRes.body;
        });

        after('Teardown chapter for keyword testing', async function () {
            await Chapter.findByIdAndDelete(story.chapterId);
        });

        describe('Happy paths', function () {
            describe('GET /keyword', function () {
                it('should return a 200 status and an array of keywords and their counts', async function () {
                    const res = await agent.get('/keyword');

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf.at.least(3);
                });
            });

            describe('GET /keyword with a query: { regex: testString }', function () {
                it('should return a 200 status and an array of keywords matching the regular expression, and their counts.', async function () {
                    const res = await agent.get('/keyword').query({ regex: testString });

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf.at.least(2);
                    for (const keyword of res.body) {
                        expect(keyword.keyword).to.match(new RegExp(testString));
                    }
                });
            });
        });

        describe('Sad paths', function () {
            describe('GET /keyword with a query string that doesn\'t match any keywords', function () {
                it('should return a 404 status and an error message', async function () {
                    const res = await agent.get('/keyword').query({ regex: testString + testString });

                    expect(res).to.have.status(404);
                    expect(res.body).to.deep.equal({ error: "No matching keywords found." });
                });
            });
        });
    });

    describe('Test the keyword modification routes', function () {
        let story;

        beforeEach('Setup chapter for keyword testing', async function () {
            await agent.post('/login').send(testUserLogin);
            const storyRes = await agent.post('/chapter').send(testStory);
            story = storyRes.body;
        });

        afterEach('Teardown chapter for keyword testing', async function () {
            await Chapter.findByIdAndDelete(story.chapterId);
        });

        describe('Test the PUT /chapter/:chapterId/keyword route', function () {
            describe('Happy paths', function () {
                describe('Login as the user who created the chapter, and add a keyword', function () {
                    it('should return a 200 status and a success message, and add the keyword to the chapter in the database.', async function () {
                        await agent.post('/login').send(testUserLogin);

                        const res = await agent.put('/chapter/' + story.chapterId + '/keyword').send(["silly"]);
                        const chapter = await Chapter.findById(story.chapterId);

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal({ message: "Keywords successfully added." });
                        expect(chapter.keywords).to.be.an('array');
                        expect(chapter.keywords).to.include("silly");
                    });
                });
            });

            describe('Sad paths', function () {
                describe('Login as a different user and add a keyword', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/login').send(adminLogin);

                        const res = await agent.put('/chapter/' + story.chapterId + '/keyword').send(["silly"]);

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                    });
                });

                describe('Logout and add a keyword', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/logout');

                        const res = await agent.put('/chapter/' + story.chapterId + '/keyword').send(["silly"]);

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                    });
                });

                describe('Login as author and do a PUT with a non-array', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/login').send(testUserLogin);

                        const res = await agent.put('/chapter/' + story.chapterId + '/keyword').send("silly");

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Request body must be an array of strings." });
                    });
                });

                describe('Login as author and add an invalid keyword', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/login').send(testUserLogin);

                        const res = await agent.put('/chapter/' + story.chapterId + '/keyword').send(["silly?"]);

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Request body must be an array of strings." });
                    });
                });
            });
        });

        describe('Test the DELETE /chapter/:chapterId/keyword/:keywordValue route', function () {
            describe('Happy paths', function () {
                describe('Login as author and delete a keyword', function () {
                    it('should return a 200 status and a success message, and remove the keyword from the chapter', async function () {
                        await agent.post('/login').send(testUserLogin);

                        const res = await agent.delete('/chapter/' + story.chapterId + '/keyword/' + story.keywords[2]);
                        const chapter = await Chapter.findById(story.chapterId);

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal({ message: "Keyword successfully deleted." });
                        expect(chapter.keywords).to.not.include(story.keywords[2]);
                    });
                });
            });

            describe('Sad paths', function () {
                describe('Login as a different user and delete a keyword', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/login').send(adminLogin);

                        const res = await agent.delete('/chapter/' + story.chapterId + '/keyword/' + story.keywords[2]);

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                    });
                });

                describe('Logout and delete a keyword', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/logout');

                        const res = await agent.delete('/chapter/' + story.chapterId + '/keyword/' + story.keywords[2]);

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                    });
                });

                describe('Login as author and DELETE with an invalid keyword', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/login').send(testUserLogin);

                        const res = await agent.delete('/chapter/' + story.chapterId + '/keyword/silly!');

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "That is not a valid keyword." });
                    });
                });

                describe('Login as author and DELETE with a keyword that the chapter doesn\'t have', function () {
                    it('should return a 404 status and an error message', async function () {
                        await agent.post('/login').send(testUserLogin);

                        const res = await agent.delete('/chapter/' + story.chapterId + '/keyword/silly');

                        expect(res).to.have.status(404);
                        expect(res.body).to.deep.equal({ error: "Keyword not found in chapter." });
                    });
                });
            });
        });
    });
});