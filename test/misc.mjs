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
    newUserName,
    newEmail,
    // newPassword,
    testUserLogin,
    adminLogin,
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
                    await agent.post('/login').send(testUserLogin);

                    const res = await agent.post('/message').send({ useLoginInfo: true, messageText: testString });
                    const message = await Message.findOne({ messageText: testString });

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal({ message: "Message sent." });
                    expect(message.name).to.deep.equal(newUserName);
                    expect(message.email).to.deep.equal(newEmail);
                    expect(message.messageText).to.deep.equal(testString);
                    expect(message.verified).to.be.true;

                    await Message.findByIdAndDelete(message._id);
                });
            });

            describe('Login and POST /message with {name: newUserName, email: newEmail, messageText: testString + "unique3"}', function () {
                it('should return a 200 status code and a success message, and add the message to the database', async function () {
                    await agent.post('/login').send(testUserLogin);

                    const res = await agent.post('/message').send({ name: newUserName, email: newEmail, messageText: testString + "unique3" });
                    const message = await Message.findOne({ messageText: testString + "unique3" });

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal({ message: "Message sent." });
                    expect(message.name).to.deep.equal(newUserName);
                    expect(message.email).to.deep.equal(newEmail);
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

    describe('Test the GET /admin/message route', function () {
        describe('Happy paths', function () {
            describe('Login as admin and GET /admin/message', function () {
                it('should return a 200 status and an array of messages', async function () {
                    await agent.post('/login').send(adminLogin);
                    await agent.post('/message').send({ messageText: testString });
                    const message = await Message.findOne({ messageText: testString });

                    const res = await agent.get('/admin/message');

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf.at.least(1);
                    for (const currentMessage of res.body) {
                        expectMongoObjectId(currentMessage._id);
                        expect(currentMessage.messageText).to.be.a('string');
                        expect(currentMessage.createDate).to.be.a('string');
                        expect(currentMessage.name).to.be.a('string');
                        expect(currentMessage.email).to.be.a('string');
                        expect(currentMessage.read).to.be.a('boolean');
                        expect(currentMessage.verified).to.be.a('boolean');
                    }
                    expect(res.body.some(m => (m._id == message._id))).to.be.true;

                    await Message.findByIdAndDelete(message._id);
                });
            });

            describe('Login as admin and GET /admin/message with query string {unread: true}', function () {
                it('should return a 200 status and an array of messages with read == false', async function () {
                    await agent.post('/login').send(adminLogin);
                    await agent.post('/message').send({ messageText: testString });
                    const message = await Message.findOne({ messageText: testString });
                    await agent.post('/message').send({ messageText: testString + "2" });
                    const message2 = await Message.findOne({ messageText: testString + "2" });
                    message2.read = true;
                    await message2.save();

                    const res = await agent.get('/admin/message').query({ unread: true });

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf.at.least(1);
                    for (const message of res.body) {
                        expectMongoObjectId(message._id);
                        expect(message.messageText).to.be.a('string');
                        expect(message.createDate).to.be.a('string');
                        expect(message.name).to.be.a('string');
                        expect(message.email).to.be.a('string');
                        expect(message.read).to.be.false;
                        expect(message.verified).to.be.a('boolean');
                    }
                    expect(res.body.some(m => (m._id == message._id))).to.be.true;
                    expect(res.body.some(m => (m._id == message2._id))).to.be.false;

                    await Message.findByIdAndDelete(message._id);
                    await Message.findByIdAndDelete(message2._id);
                });
            });
        });

        describe('Sad paths', function () {
            describe('Login as non-admin and GET /admin/message', function () {
                it('should redirect to /login', async function () {
                    await agent.post('/login').send(testUserLogin);

                    const res = await agent.get('/admin/message');

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                });
            });

            describe('Logout and GET /admin/message', function () {
                it('should redirect to /login', async function () {
                    await agent.post('/logout');

                    const res = await agent.get('/admin/message');

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                });
            });
        });
    });

    describe('Test the PUT /admin/message/:messageId route', function () {
        describe('Happy paths', function () {
            describe('Login as admin and mark a message as read', function () {
                it('should return a 200 status and mark the message as read in the database', async function () {
                    await agent.post('/login').send(adminLogin);
                    await agent.post('/message').send({ messageText: testString });
                    const message = await Message.findOne({ messageText: testString });

                    const res = await agent.put('/admin/message/' + message._id).send({ read: true });
                    const reTestMessage = await Message.findById(message._id);

                    expect(res).to.have.status(200);
                    expect(reTestMessage.read).to.be.true;

                    await Message.findByIdAndDelete(message._id);
                });
            });

            describe('Login as admin and mark a message as unread', function () {
                it('should return a 200 status and mark the message as unread in the database', async function () {
                    await agent.post('/login').send(adminLogin);
                    await agent.post('/message').send({ messageText: testString });
                    const message = await Message.findOne({ messageText: testString });
                    message.read = true;
                    message.save();

                    const res = await agent.put('/admin/message/' + message._id).send({ read: false });
                    const reTestMessage = await Message.findById(message._id);

                    expect(res).to.have.status(200);
                    expect(reTestMessage.read).to.be.false;

                    await Message.findByIdAndDelete(message._id);
                });
            });
        });

        describe('Sad paths', function () {
            describe('Login as admin and do a bad PUT', function () {
                it('should return a 400 status and an error message', async function () {
                    await agent.post('/login').send(adminLogin);
                    await agent.post('/message').send({ messageText: testString });
                    const message = await Message.findOne({ messageText: testString });

                    const res = await agent.put('/admin/message/' + message._id).send({ read: "string" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Invalid request." })

                    await Message.findByIdAndDelete(message._id);
                });
            });

            describe('Login as admin and do a PUT with a nonexistant messageId', function () {
                it('should return a 404 status and an error message', async function () {
                    await agent.post('/login').send(adminLogin);

                    const res = await agent.put('/admin/message/000000000000000000000000').send({ read: true });

                    expect(res).to.have.status(404);
                    expect(res.body).to.deep.equal({ error: "There is no message with that messageId." })
                });
            });

            describe('Login as admin and do a Put with a misformed ID', function () {
                it('should return a 400 status and an error message', async function () {
                    await agent.post('/login').send(adminLogin);

                    const res = await agent.put('/admin/message/notAmessageId').send({ read: true });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "That is not a properly formatted messageId." })
                });
            });

            describe('Login as non-admin and try to mark a message as read', function () {
                it('should redirect to /login', async function () {
                    await agent.post('/login').send(testUserLogin);
                    await agent.post('/message').send({ messageText: testString });
                    const message = await Message.findOne({ messageText: testString });

                    const res = await agent.put('/admin/message/' + message._id).send({ read: true });

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');

                    await Message.findByIdAndDelete(message._id);
                });
            });

            describe('Logout and try to mark a message as read', function () {
                it('should redirect to /login', async function () {
                    await agent.post('/login').send(testUserLogin);
                    await agent.post('/message').send({ messageText: testString });
                    const message = await Message.findOne({ messageText: testString });
                    await agent.post('/logout');

                    const res = await agent.put('/admin/message/' + message._id).send({ read: true });

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');

                    await Message.findByIdAndDelete(message._id);
                });
            });
        });
    });

    describe('Test the DELETE /admin/message/:messageId route', function () {
        describe('Happy paths', function () {
            describe('Login as admin and delete a message', function () {
                it('should return a 204 status and delete the message from the database', async function () {
                    await agent.post('/login').send(adminLogin);
                    await agent.post('/message').send({ messageText: testString });
                    const message = await Message.findOne({ messageText: testString });

                    const res = await agent.delete('/admin/message/' + message._id);
                    const reTestMessage = await Message.findById(message._id);

                    expect(res).to.have.status(204);

                    expect(reTestMessage).to.be.null;

                    await Message.findByIdAndDelete(message._id);
                });
            });
        });

        describe('Sad paths', function () {
            describe('Login as admin and delete a nonexistant message', function () {
                it('should return a 404 and an error message', async function () {
                    await agent.post('/login').send(adminLogin);

                    const res = await agent.delete('/admin/message/000000000000000000000000');

                    expect(res).to.have.status(404);
                    expect(res.body).to.deep.equal({ error: "There is no message with that messageId." });
                });
            });

            describe('Login as admin and delete a misformed messageId', function () {
                it('should return a 400 status and an error message', async function () {
                    await agent.post('/login').send(adminLogin);

                    const res = await agent.delete('/admin/message/notAmessageId');

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "That is not a properly formatted messageId." });
                });
            });

            describe('Login as non admin and try to delete a message', function () {
                it('should redirect to /login', async function () {
                    await agent.post('/login').send(testUserLogin);
                    await agent.post('/message').send({ messageText: testString });
                    const message = await Message.findOne({ messageText: testString });

                    const res = await agent.delete('/admin/message/' + message._id);

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');

                    await Message.findByIdAndDelete(message._id);
                });
            });

            describe('Logout and delete a message', function () {
                it('should redirect to /login', async function () {
                    await agent.post('/logout');
                    await agent.post('/message').send({ messageText: testString });
                    const message = await Message.findOne({ messageText: testString });

                    const res = await agent.delete('/admin/message/' + message._id);

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');

                    await Message.findByIdAndDelete(message._id);
                });
            });
        });
    });
});