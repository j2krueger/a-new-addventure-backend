"use strict";

import * as globals from './globals.mjs';
const {
    // resources
    expect,
    // mongoose,
    agent,
    constants,
    // constants,
    newUserName,
    newEmail,
    newPassword,
    // newUserPrivateProfile,
    // newUserPublicInfo,
    // newUserBasicInfo,
    // models
    // User,
    // Entry,
    // Follow,
    Message,
    // functions
    // populateUserInfo,
    // expectMongoObjectId,
} = globals;

describe('Test miscelaneous routes', function () {
    this.slow(10000);

    describe('Test the /message route', function () {
        describe('Happy paths', function () {
            describe('POST /message with {name: "Freddy", email: "Freddy@example.com", messageText: "This is a test message."}', function () {
                it('should return a 200 status code and a success message, and add the message to the database', async function () {
                    const res = await agent
                        .post('/message')
                        .send({ name: "Freddy", email: "Freddy@example.com", messageText: "This is a test message." });

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal({ message: "Message sent." });
                    const message = await Message.findOne({ name: "Freddy", email: "Freddy@example.com", messageText: "This is a test message." });
                    expect(message.name).to.deep.equal("Freddy");
                    expect(message.email).to.deep.equal("Freddy@example.com");
                    expect(message.messageText).to.deep.equal("This is a test message.");
                    expect(message.verified).to.be.false;
                });
            });

            describe('POST /message with {messageText: "This is an anonymous test message"}', function () {
                it('should return a 200 status code and a success message, and add the message to the database', async function () {
                    const res = await agent
                        .post('/message')
                        .send({ messageText: "This is an anonymous test message" });

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal({ message: "Message sent." });

                    const message = await Message.findOne({ messageText: "This is an anonymous test message" });
                    expect(message.name).to.deep.equal("Anonymous");
                    expect(message.email).to.deep.equal("No email");
                    expect(message.messageText).to.deep.equal("This is an anonymous test message");
                    expect(message.verified).to.be.false;
                });
            });

            describe('Login and POST /message with {useLoginInfo: true, messageText: "This is a logged in test message."}', function () {
                it('should return a 200 status code and a success message, and add the message to the database', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .post('/message')
                        .send({ useLoginInfo: true, messageText: "This is a logged in test message." });

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal({ message: "Message sent." });

                    const message = await Message.findOne({ messageText: "This is a logged in test message." });
                    expect(message.name).to.deep.equal(newUserName);
                    expect(message.email).to.deep.equal(newEmail);
                    expect(message.messageText).to.deep.equal("This is a logged in test message.");
                    expect(message.verified).to.be.true;
                });
            });
        });

        describe('Sad paths', function () {
            describe('POST /message with no messageText', function () {
                it('should return a 400 status code with an error message', async function () {
                    const res = await agent
                        .post('/message');

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Message text is missing." });
                });
            });

            describe('Logout and POST /message with {useLoginInfo: true, messageText: "This is a logged in test message."}', function () {
                it('should redirect to /login', async function () {
                    const logoutRes = await agent
                        .post('/logout');

                    expect(logoutRes).to.have.status(200);

                    const res = await agent
                        .post('/message')
                        .send({ useLoginInfo: true, messageText: "This is a logged in test message." });

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                });
            });
        });
    });
});