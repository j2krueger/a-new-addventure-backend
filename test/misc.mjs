"use strict";

import * as globals from './globals.mjs';
const {
    // resources
    expect,
    // mongoose,
    agent,
    constants,
    // constants,
    testString,
    newUser1Name,
    newUser1Email,
    // newPassword,
    testUser1Login,
    // adminLogin,
    // newUserPrivateProfile,
    // newUserPublicInfo,
    // newUserBasicInfo,
    // models
    // User,
    // Chapter,
    // Follow,
    Message,
    // functions
    // expectMongoObjectId,
} = globals;

describe('Test miscelaneous routes', function () {
    this.slow(10000);

    describe('Test the POST /message route', function () {
        describe('Happy paths', function () {
            describe('LOGOUT and POST /message with {name: "Freddy", email: "Freddy@example.com", messageText: testSring}', function () {
                it('should return a 200 status code and a success message, and add the message to the database', async function () {
                    await agent.post('/logout');

                    const res = await agent.post('/message').send({ name: "Freddy", email: "Freddy@example.com", messageText: testString });
                    const message = await Message.findOne({ name: "Freddy", email: "Freddy@example.com", messageText: testString });

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal({ message: "Message sent." });
                    expect(message.name).to.deep.equal("Freddy");
                    expect(message.email).to.deep.equal("Freddy@example.com");
                    expect(message.messageText).to.deep.equal(testString);
                    expect(message.verified).to.be.false;

                    await Message.findByIdAndDelete(message._id);
                });
            });

            describe('Logout and POST /message with {messageText: testString}', function () {
                it('should return a 200 status code and a success message, and add the message to the database', async function () {
                    await agent.post('/logout');

                    const res = await agent.post('/message').send({ messageText: testString });
                    const message = await Message.findOne({ messageText: testString });

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal({ message: "Message sent." });
                    expect(message.name).to.deep.equal("Anonymous");
                    expect(message.email).to.deep.equal("No email");
                    expect(message.messageText).to.deep.equal(testString);
                    expect(message.verified).to.be.false;

                    await Message.findByIdAndDelete(message._id);
                });
            });

            describe('Login and POST /message with {useLoginInfo: true, messageText: testString}', function () {
                it('should return a 200 status code and a success message, and add the message to the database', async function () {
                    await agent.post('/login').send(testUser1Login);

                    const res = await agent.post('/message').send({ useLoginInfo: true, messageText: testString });
                    const message = await Message.findOne({ messageText: testString });

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal({ message: "Message sent." });
                    expect(message.name).to.deep.equal(newUser1Name);
                    expect(message.email).to.deep.equal(newUser1Email);
                    expect(message.messageText).to.deep.equal(testString);
                    expect(message.verified).to.be.true;

                    await Message.findByIdAndDelete(message._id);
                });
            });

            describe('Login and POST /message with {name: newUser1Name, email: newUser1Email, messageText: testString + "unique3"}', function () {
                it('should return a 200 status code and a success message, and add the message to the database', async function () {
                    await agent.post('/login').send(testUser1Login);

                    const res = await agent.post('/message').send({ name: newUser1Name, email: newUser1Email, messageText: testString + "unique3" });
                    const message = await Message.findOne({ messageText: testString + "unique3" });

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal({ message: "Message sent." });
                    expect(message.name).to.deep.equal(newUser1Name);
                    expect(message.email).to.deep.equal(newUser1Email);
                    expect(message.messageText).to.deep.equal(testString + "unique3");
                    expect(message.verified).to.be.true;

                    await Message.findByIdAndDelete(message._id);
                });
            });
        });

        describe('Sad paths', function () {
            describe('POST /message with no messageText', function () {
                it('should return a 400 status code with an error message', async function () {
                    const res = await agent.post('/message');

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Message text is missing." });
                });
            });

            describe('Logout and POST /message with {useLoginInfo: true, messageText: "This is a logged out test message."}', function () {
                it('should redirect to /login', async function () {
                    await agent.post('/logout');

                    const res = await agent.post('/message').send({ useLoginInfo: true, messageText: "This is a logged out test message." });

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                });
            });
        });
    });

    describe('Test the GET /stats route', function () {
        describe('Logout and GET /stats', function () {
            it('should return a 200 status and some statistics.', async function () {
                await agent.post('/logout');

                const res = await agent.get('/stats');

                expect(res).to.have.status(200);
                expect(res.body.users).to.be.a('number');
                expect(res.body.stories).to.be.a('number');
                expect(res.body.chapters).to.be.a('number');
            });
        });

        describe('Login and GET /stats', function () {
            it('should return a 200 status and some statistics', async function () {
                await agent.post('/login').send(testUser1Login);

                const res = await agent.get('/stats');

                expect(res).to.have.status(200);
                expect(res.body.users).to.be.a('number');
                expect(res.body.stories).to.be.a('number');
                expect(res.body.chapters).to.be.a('number');
            });
        });
    });
});