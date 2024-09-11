"use strict";

import * as globals from './globals.mjs';

const {
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
    testUserLogin,
    // adminLogin,
    // testStory,
    testStory1,
    testStory2,
    // testChapter,
    testChapter1a,
    testChapter1b,
    testChapter1aa,
    // newUserPrivateProfile,
    // newUserPublicInfo,
    newUserBasicInfo,
    shouldSendEmail,
    expectedNumberOfEmails,
    // summaryKeys,
    // models
    User,
    Chapter,
    Follow,
    Message,
    Like,
    Flag,
    // Bookmark,
    // functions
    populateUserInfo,
    expectMongoObjectId,
    // deepCopy,
} = globals;

export const mochaHooks = {
    async beforeAll() {
        console.time('Total testing time');
        try {
            mongoose.connect(constants.databaseURI, { dbName: constants.dbName });
            console.log('Database Connected');
        } catch (error) {
            console.log("Database not conected: ", error)
        }
        const userRes = await agent.post('/register').send({ userName: newUserName, email: newEmail, password: newPassword });
        shouldSendEmail();

        expect(userRes).to.have.status(201);
        expect(userRes.body).to.be.an('object');
        expect(userRes.body.userName).to.equal(newUserName);
        expect(userRes.body.email).to.equal(newEmail);
        expectMongoObjectId(userRes.body.userId);
        expect(userRes.body.bio).to.equal("I haven't decided what to put in my bio yet.");
        expect(userRes.body.publishEmail).to.equal(false);
        expect(userRes.body.darkMode).to.equal(false);
        expect(userRes.body.publishedChapters).to.be.an('array');
        expect(userRes.body.publishedChapters).to.have.lengthOf(0);

        await agent.post('/login').send(testUserLogin);

        const story1Res = await agent.post('/chapter').send(testStory1);
        expect(story1Res).to.have.status(201);
        const chapter1aRes = await agent.post('/chapter/' + story1Res.body.chapterId).send(testChapter1a);
        expect(chapter1aRes).to.have.status(201);
        const chapter1aaRes = await agent.post('/chapter/' + chapter1aRes.body.chapterId).send(testChapter1aa);
        expect(chapter1aaRes).to.have.status(201);
        const chapter1bRes = await agent.post('/chapter/' + story1Res.body.chapterId).send(testChapter1b);
        expect(chapter1bRes).to.have.status(201);

        const story2Res = await agent.post('/chapter').send(testStory2);
        expect(story2Res).to.have.status(201);

        const reUser = await agent.get('/profile');
        populateUserInfo(reUser.body);

        await agent.post('/login').send(globals.adminLogin);
        const likeRes = await agent.post('/chapter/' + chapter1aRes.body.chapterId + '/like');
        expect(likeRes).to.have.status(200);
    },

    async afterAll() {
        await agent
            .post('/logout');
        await User.deleteMany({ userName: { $regex: testString } });
        await Chapter.deleteMany({ authorName: { $regex: testString } });
        await Chapter.deleteMany({ bodyText: { $regex: testString } });
        await Message.deleteMany({ messageText: { $regex: testString } });
        await Follow.deleteMany({ follower: newUserBasicInfo().userId });
        await Like.deleteMany({ user: newUserBasicInfo().userId });
        await Flag.deleteMany({ reason: { $regex: testString } });
        mongoose.disconnect();
        console.timeEnd('Total testing time');
        console.log(`A total of ${expectedNumberOfEmails()} automatic emails should have reached your inbox.`);
    }
};

