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
    expectMongoObjectId,
} = globals;

describe('Test miscelaneous routes', function () {
    this.slow(10000);

    describe('Test the POST /message route', function () {
        describe('Happy paths', function () {
            describe('LOGOUT and POST /message with {name: "Freddy", email: "Freddy@example.com", messageText: "This is a test message."}', function () {
                it('should return a 200 status code and a success message, and add the message to the database', async function () {
                    const logoutRes = await agent
                        .post('/logout');

                    expect(logoutRes).to.have.status(200);

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

            describe('Login and POST /message with {name: newUserName, email: newEmail, messageText: "This is a logged in test message."}', function () {
                it('should return a 200 status code and a success message, and add the message to the database', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .post('/message')
                        .send({ name: newUserName, email: newEmail, messageText: "This is a logged in test message." });

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

            describe('Logout and POST /message with {useLoginInfo: true, messageText: "This is a logged out test message."}', function () {
                it('should redirect to /login', async function () {
                    const logoutRes = await agent
                        .post('/logout');

                    expect(logoutRes).to.have.status(200);

                    const res = await agent
                        .post('/message')
                        .send({ useLoginInfo: true, messageText: "This is a logged out test message." });

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                });
            });
        });
    });

    describe('Test the GET /message route', function () {
        describe('Happy paths', function () {
            describe('Login as admin and GET /message', function () {
                it('should return a 200 status and an array of messages', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: "Freddy", password: "s33krit!" });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .get('/message');

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf.at.least(5);
                    for (const message of res.body) {
                        expectMongoObjectId(message._id);
                        expect(message.messageText).to.be.a('string');
                        expect(message.name).to.be.a('string');
                        expect(message.email).to.be.a('string');
                        expect(message.read).to.be.a('boolean');
                        expect(message.verified).to.be.a('boolean');
                    }
                });
            });

            describe('Login as admin and GET /message with query string {unread: true}', function () {
                it('should return a 200 status and an array of messages with read == false', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: "Freddy", password: "s33krit!" });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .get('/message')
                        .query({ unread: true });

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf.at.least(4);
                    for (const message of res.body) {
                        expectMongoObjectId(message._id);
                        expect(message.messageText).to.be.a('string');
                        expect(message.name).to.be.a('string');
                        expect(message.email).to.be.a('string');
                        expect(message.read).to.be.false;
                        expect(message.verified).to.be.a('boolean');
                    }
                });
            });
        });

        describe('Sad paths', function () {
            describe('Login as non-admin and GET /message', function () {
                it('should redirect to /login', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .get('/message');

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                });
            });

            describe('Logout and GET /message', function () {
                it('should redirect to /login', async function () {
                    const logoutRes = await agent
                        .post('/logout');

                    expect(logoutRes).to.have.status(200);

                    const res = await agent
                        .get('/message');

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                });
            });
        });
    });
});