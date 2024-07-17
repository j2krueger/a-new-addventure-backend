"use strict";

import * as globals from './globals.mjs';

const {
    expect,
    mongoose,
    agent,
    constants,
    newUserName,
    newEmail,
    newPassword,
    User,
    Entry,
    populateUserInfo,
    expectMongoObjectId,
} = globals;

export const mochaHooks = {
    async beforeAll() {
        try {
            mongoose.connect(constants.databaseURI, { dbName: constants.dbName });
            console.log('Database Connected');
        } catch (error) {
            console.log("Database not conected: ", error)
        }
        const res = await agent
            .post('/register')
            .send({ userName: newUserName, email: newEmail, password: newPassword });

        expect(res).to.have.status(201);
        expect(res.body).to.be.an('object');
        expect(res.body.userName).to.equal(newUserName);
        expect(res.body.email).to.equal(newEmail);
        expectMongoObjectId(res.body.userId);
        expect(res.body.bio).to.equal("I haven't decided what to put in my bio yet.");
        expect(res.body.publishEmail).to.equal(false);
        expect(res.body.darkMode).to.equal(false);
        expect(res.body.publishedEntries).to.be.an('array');
        expect(res.body.publishedEntries).to.have.lengthOf(0);
        populateUserInfo(res.body);
    },

    async afterAll() {
        await agent
            .post('/logout');
        await User.deleteOne({ userName: newUserName });
        await User.deleteOne({ userName: 'test' + newUserName });
        await Entry.deleteMany({ authorName: { $regex: "^test" } });
        mongoose.disconnect();

    }
};

