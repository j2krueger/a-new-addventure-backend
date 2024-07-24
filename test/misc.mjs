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

    describe('Test the GET /admin/message route', function () {
        describe('Happy paths', function () {
            describe('Login as admin and GET /admin/message', function () {
                it('should return a 200 status and an array of messages', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: "Freddy", password: "s33krit!" });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .get('/admin/message');

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf.at.least(5);
                    for (const message of res.body) {
                        expectMongoObjectId(message._id);
                        expect(message.messageText).to.be.a('string');
                        expect(message.createDate).to.be.a('string');
                        expect(message.name).to.be.a('string');
                        expect(message.email).to.be.a('string');
                        expect(message.read).to.be.a('boolean');
                        expect(message.verified).to.be.a('boolean');
                    }
                });
            });

            describe('Login as admin and GET /admin/message with query string {unread: true}', function () {
                it('should return a 200 status and an array of messages with read == false', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: "Freddy", password: "s33krit!" });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .get('/admin/message')
                        .query({ unread: true });

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf.at.least(4);
                    for (const message of res.body) {
                        expectMongoObjectId(message._id);
                        expect(message.messageText).to.be.a('string');
                        expect(message.createDate).to.be.a('string');
                        expect(message.name).to.be.a('string');
                        expect(message.email).to.be.a('string');
                        expect(message.read).to.be.false;
                        expect(message.verified).to.be.a('boolean');
                    }
                });
            });
        });

        describe('Sad paths', function () {
            describe('Login as non-admin and GET /admin/message', function () {
                it('should redirect to /login', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .get('/admin/message');

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                });
            });

            describe('Logout and GET /admin/message', function () {
                it('should redirect to /login', async function () {
                    const logoutRes = await agent
                        .post('/logout');

                    expect(logoutRes).to.have.status(200);

                    const res = await agent
                        .get('/admin/message');

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                });
            });
        });
    });

    describe('Test the PUT /admin/message/:messageId route', function () {
        describe('Happy paths', function () {
            describe('Login as admin and mark a message as read', function () {
                it('should return a 200 status and mark the message as read in the database', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: "Freddy", password: "s33krit!" });

                    expect(loginRes).to.have.status(200);

                    const testMessage = await Message.findOne({ messageText: { $regex: "test message" }, read: false });

                    expect(testMessage).to.not.be.null;

                    const res = await agent
                        .put('/admin/message/' + testMessage._id)
                        .send({ read: true });

                    expect(res).to.have.status(200);

                    const reTestMessage = await Message.findById(testMessage._id);

                    expect(reTestMessage.read).to.be.true;
                });
            });

            describe('Login as admin and mark a message as unread', function () {
                it('should return a 200 status and mark the message as read in the database', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: "Freddy", password: "s33krit!" });

                    expect(loginRes).to.have.status(200);

                    const testMessage = await Message.findOne({ messageText: { $regex: "test message" }, read: true });

                    expect(testMessage).to.not.be.null;

                    const res = await agent
                        .put('/admin/message/' + testMessage._id)
                        .send({ read: false });

                    expect(res).to.have.status(200);

                    const reTestMessage = await Message.findById(testMessage._id);

                    expect(reTestMessage.read).to.be.false;
                });
            });
        });

        describe('Sad paths', function () {
            describe('Login as admin and do a bad PUT', function () {
                it('should return a 400 status and an error message', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: "Freddy", password: "s33krit!" });

                    expect(loginRes).to.have.status(200);

                    const testMessage = await Message.findOne({ messageText: { $regex: "test message" }, read: false });

                    expect(testMessage).to.not.be.null;

                    const res = await agent
                        .put('/admin/message/' + testMessage._id)
                        .send({ read: "string" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Invalid request." })
                });
            });

            describe('Login as admin and do a PUT with a nonexistant messageId', function () {
                it('should return a 404 status and an error message', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: "Freddy", password: "s33krit!" });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .put('/admin/message/000000000000000000000000')
                        .send({ read: "string" });

                    expect(res).to.have.status(404);
                    expect(res.body).to.deep.equal({ error: "There is no message with that messageId." })
                });
            });

            describe('Login as admin and do a Put with a misformed ID', function () {
                it('should return a 400 status and an error message', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: "Freddy", password: "s33krit!" });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .put('/admin/message/notAmessageId')
                        .send({ read: "string" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "That is not a properly formatted messageId." })
                });
            });

            describe('Login as non-admin and try to mark a message as read', function () {
                it('should redirect to /login', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    expect(loginRes).to.have.status(200);


                    const testMessage = await Message.findOne({ messageText: { $regex: "test message" }, read: false });

                    expect(testMessage).to.not.be.null;

                    const res = await agent
                        .put('/admin/message/' + testMessage._id)
                        .send({ read: true });

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                });
            });

            describe('Logout and try to mark a message as read', function () {
                it('should redirect to /login', async function () {
                    const logoutRes = await agent
                        .post('/logout');

                    expect(logoutRes).to.have.status(200);

                    const testMessage = await Message.findOne({ messageText: { $regex: "test message" }, read: false });

                    expect(testMessage).to.not.be.null;

                    const res = await agent
                        .put('/admin/message/' + testMessage._id)
                        .send({ read: true });

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                });
            });
        });
    });

    describe('Test the DELETE /admin/message/:messageId route', function () {
        describe('Happy paths', function () {
            describe('Login as admin and delete a message', function () {
                it('should return a 204 status and delete the message from the database', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: "Freddy", password: "s33krit!" });

                    expect(loginRes).to.have.status(200);

                    const testMessage = await Message.findOne({ messageText: { $regex: "test message" }, read: false });

                    expect(testMessage).to.not.be.null;

                    const res = await agent
                        .delete('/admin/message/' + testMessage._id);

                    expect(res).to.have.status(204);

                    const reTestMessage = await Message.findById(testMessage._id)
                    expect(reTestMessage).to.be.null;
                });
            });
        });

        describe('Sad paths', function () {
            describe('Login as admin and delete a nonexistant message', function () {
                it('should return a 404 and an error message', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: "Freddy", password: "s33krit!" });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .delete('/admin/message/000000000000000000000000');

                    expect(res).to.have.status(404);

                    expect(res.body).to.deep.equal({ error: "There is no message with that messageId." });
                });
            });

            describe('Login as admin and delete a misformed messageId', function () {
                it('should return a 400 status and an error message', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: "Freddy", password: "s33krit!" });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .delete('/admin/message/notAmessageId');

                    expect(res).to.have.status(400);

                    expect(res.body).to.deep.equal({ error: "That is not a properly formatted messageId." });
                });
            });

            describe('Login as non admin and try to delete a message', function () {
                it('should redirect to /login', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    expect(loginRes).to.have.status(200);

                    const testMessage = await Message.findOne({ messageText: { $regex: "test message" }, read: false });

                    expect(testMessage).to.not.be.null;

                    const res = await agent
                        .delete('/admin/message/' + testMessage._id);

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                });
            });

            describe('Logout and delete a message', function () {
                it('should redirect to /login', async function () {
                    const logoutRes = await agent
                        .post('/logout');

                    expect(logoutRes).to.have.status(200);

                    const testMessage = await Message.findOne({ messageText: { $regex: "test message" }, read: false });

                    expect(testMessage).to.not.be.null;

                    const res = await agent
                        .delete('/admin/message/' + testMessage._id);

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                });
            });
        });
    });
});