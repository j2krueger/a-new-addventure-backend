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
    // testEntry,
    testEntry1a,
    testEntry1b,
    testEntry1aa,
    // newUserPrivateProfile,
    // newUserPublicInfo,
    newUserBasicInfo,
    shouldSendEmail,
    expectedNumberOfEmails,
    // summaryKeys,
    // models
    User,
    Entry,
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
        expect(userRes.body.publishedEntries).to.be.an('array');
        expect(userRes.body.publishedEntries).to.have.lengthOf(0);

        await agent.post('/login').send(testUserLogin);

        const story1Res = await agent.post('/entry').send(testStory1);
        expect(story1Res).to.have.status(201);
        const entry1aRes = await agent.post('/entry/' + story1Res.body.entryId).send(testEntry1a);
        expect(entry1aRes).to.have.status(201);
        const entry1aaRes = await agent.post('/entry/' + entry1aRes.body.entryId).send(testEntry1aa);
        expect(entry1aaRes).to.have.status(201);
        const entry1bRes = await agent.post('/entry/' + story1Res.body.entryId).send(testEntry1b);
        expect(entry1bRes).to.have.status(201);

        const story2Res = await agent.post('/entry').send(testStory2);
        expect(story2Res).to.have.status(201);

        for (let userCount = 0; userCount <= constants.entriesPerPage; userCount++) {
            console.log('Generating user ' + userCount);
            const thisRes = await agent.post('/register/').send({ userName: userCount + newUserName, email: userCount + newEmail, password: newPassword });
            shouldSendEmail();
            expect(thisRes).to.have.status(201);
        }

        const reUser = await agent.get('/profile');
        populateUserInfo(reUser.body);
    },

    async afterAll() {
        await agent
            .post('/logout');
        await User.deleteMany({ userName: { $regex: testString } });
        await Entry.deleteMany({ authorName: { $regex: testString } });
        await Entry.deleteMany({ bodyText: { $regex: testString } });
        await Message.deleteMany({ messageText: { $regex: testString } });
        await Follow.deleteMany({ follower: newUserBasicInfo().userId });
        await Like.deleteMany({ user: newUserBasicInfo().userId });
        await Flag.deleteMany({ reason: { $regex: testString } });
        mongoose.disconnect();
        console.log(`A total of ${expectedNumberOfEmails()} automatic emails should have reached your inbox.`);
    }
};

