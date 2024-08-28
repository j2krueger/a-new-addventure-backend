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
    newEmail,
    newPassword,
    testUserLogin,
    adminLogin,
    testStory,
    testEntry,
    newUserPrivateProfile,
    // newUserPublicInfo,
    // newUserBasicInfo,
    // summaryKeys,
    // models
    User,
    Entry,
    // Follow,
    Message,
    Like,
    Flag,
    Bookmark,
    // functions
    // populateUserInfo,
    expectMongoObjectId,
} = globals;

describe('Test the admin routes', function () {
    describe('Test the DELETE /admin/entry/:entryId route', function () {
        describe('Happy paths', function () {
            describe('Login as admin and delete an entry', function () {
                it('should return a 200 status and a success message and delete the entry from the database', async function () {
                    await agent.post('/login').send(testUserLogin);
                    const storyRes = await agent.post('/entry').send(testStory);
                    await agent.post('/login').send(adminLogin);

                    const res = await agent.delete('/admin/entry/' + storyRes.body.entryId);
                    const reEntry = await Entry.findById(storyRes.body.entryId);

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal({ message: "Entry successfully deleted." });
                    expect(reEntry).to.be.null;
                });
            });

            describe('Like an entry, then DELETE /admin/entry/:entryId', function () {
                it('should delete the like from the database', async function () {
                    await agent.post('/login').send(testUserLogin);
                    const storyRes = await agent.post('/entry').send(testStory);
                    await agent.post('/login').send(adminLogin);
                    await agent.post('/entry/' + storyRes.body.entryId + '/like');

                    const res = await agent.delete('/admin/entry/' + storyRes.body.entryId);
                    const like = await Like.findOne({ entry: storyRes.body.entryId });

                    expect(res).to.have.status(200);
                    expect(like).to.be.null;
                });
            });

            describe('Bookmark an entry, then DELETE /admin/entry/:entryId', function () {
                it('should delete the bookmark from the database', async function () {
                    await agent.post('/login').send(adminLogin);
                    const storyRes = await agent.post('/entry').send(testStory);
                    await agent.post('/entry/' + storyRes.body.entryId + '/bookmark');

                    const res = await agent.delete('/admin/entry/' + storyRes.body.entryId);
                    const bookmark = await Bookmark.findOne({ entry: storyRes.body.entryId });

                    expect(res).to.have.status(200);
                    expect(bookmark).to.be.null;
                });
            });

            describe('Flag an entry, then DELETE /admin/entry/:entryId', function () {
                it('should delete the flag from the database', async function () {
                    await agent.post('/login').send(adminLogin);
                    const storyRes = await agent.post('/entry').send(testStory);
                    await agent.post('/entry/' + storyRes.body.entryId + '/flag').send({ reason: testString });

                    const res = await agent.delete('/admin/entry/' + storyRes.body.entryId);
                    const flag = await Flag.findOne({ entry: storyRes.body.entryId });

                    expect(res).to.have.status(200);
                    expect(flag).to.be.null;
                });
            });

            describe('Continue an entry, then delete the entry', function () {
                it('should also delete the continuation entry', async function () {
                    await agent.post('/login').send(testUserLogin);
                    const storyRes = await agent.post('/entry').send(testStory);
                    const entryRes = await agent.post('/entry/' + storyRes.body.entryId).send(testEntry);
                    await agent.post('/login').send(adminLogin);

                    const res = await agent.delete('/admin/entry/' + storyRes.body.entryId);
                    const entry = await Entry.findById(entryRes.body.entryId);

                    expect(res).to.have.status(200);
                    expect(entry).to.be.null;

                    await Entry.findByIdAndDelete(entryRes.body.entryId);
                    await Entry.findByIdAndDelete(storyRes.body.entryId);
                });
            });
        });

        describe('Sad paths', function () {
            describe('Login as non-admin and delete an entry', function () {
                it('should redirect to /login', async function () {
                    await agent.post('/login').send(testUserLogin);
                    const storyRes = await agent.post('/entry').send(testStory);

                    const res = await agent.delete('/admin/entry/' + storyRes.body.entryId);

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');

                    await Entry.findByIdAndDelete(storyRes.body.entryId);
                });
            });

            describe('Logout and delete an entry', function () {
                it('should redirect to /login', async function () {
                    await agent.post('/login').send(testUserLogin);
                    const storyRes = await agent.post('/entry').send(testStory);
                    await agent.post('/logout');

                    const res = await agent.delete('/admin/entry/' + storyRes.body.entryId);

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');

                    await Entry.findByIdAndDelete(storyRes.body.entryId);
                });
            });
        });
    });

    describe('Test DELETE /admin/flag/:flagId', function () {
        describe('Happy paths', function () {
            describe('Login as admin and delete a flag', function () {
                it('should return a 200 status and a success message, and delete the flag from the database', async function () {
                    await agent.post('/login').send(adminLogin);
                    const storyRes = await agent.post('/entry').send(testStory);
                    await agent.post('/entry/' + storyRes.body.entryId + '/flag').send({ reason: testString });
                    const flag = await Flag.findOne({ entry: storyRes.body.entryId });

                    const res = await agent.delete('/admin/flag/' + flag._id);
                    const checkFlag = await Flag.findById(flag._id);

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal({ message: "Flag successfully deleted." });
                    expect(checkFlag).to.be.null;

                    await Entry.findByIdAndDelete(storyRes.body.entryId);
                });
            });
        });

        describe('Sad paths', function () {
            describe('Logout and DELETE', function () {
                it('should redirect to /login', async function () {
                    await agent.post('/login').send(adminLogin);
                    const storyRes = await agent.post('/entry').send(testStory);
                    await agent.post('/entry/' + storyRes.body.entryId + '/flag').send({ reason: testString });
                    const flag = await Flag.findOne({ entry: storyRes.body.entryId });
                    await agent.post('/logout');

                    const res = await agent.delete('/admin/flag/' + flag._id);

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');

                    await Flag.findByIdAndDelete(flag._id);
                    await Entry.findByIdAndDelete(storyRes.body.entryId);
                });
            });

            describe('Login as non-admin and DELETE', function () {
                it('should redirect to /login', async function () {
                    await agent.post('/login').send(testUserLogin);
                    const storyRes = await agent.post('/entry').send(testStory);
                    await agent.post('/entry/' + storyRes.body.entryId + '/flag').send({ reason: testString });
                    const flag = await Flag.findOne({ entry: storyRes.body.entryId });
                    await agent.post('/login').send(testUserLogin);

                    const res = await agent.delete('/admin/flag/' + flag._id);

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');

                    await Entry.findByIdAndDelete(storyRes.body.entryId);
                    await Flag.findByIdAndDelete(flag._id);
                });
            });

            describe('Login as admin and DELETE bad flagId', function () {
                it('should return a 400 status and an error message', async function () {
                    await agent.post('/login').send(adminLogin);
                    const res = await agent.delete('/admin/flag/0');

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
                    const storyRes = await agent.post('/entry').send(testStory);
                    await agent.post('/entry/' + storyRes.body.entryId + '/flag').send({ reason: testString });
                    const flag = await Flag.findOne({ entry: storyRes.body.entryId });

                    const res = await agent.get('/admin/flag');

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf.at.least(1);
                    for (const currentFlag of res.body) {
                        expect(currentFlag).to.include.all.keys('user', 'entry', 'reason');
                        expect(currentFlag.entry).to.not.be.null;
                        expect(currentFlag.reason).to.be.a('string').with.lengthOf.at.least(1);
                    }
                    expect(res.body.some(f => (f._id == flag._id))).to.be.true;

                    await Flag.findByIdAndDelete(flag._id);
                    await Entry.findByIdAndDelete(storyRes.body.entryId);
                });
            });
        });

        describe('Sad paths', function () {
            describe('Logout and get /admin/flag', function () {
                it('should redirect to /login', async function () {
                    await agent.post('/logout');

                    const res = await agent.get('/admin/flag');

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

                    const res = await agent.put('/admin/message/0').send({ read: true });

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

    describe('Test the user modification routes', function () {
        describe('Test the POST /admin/user/:userId/lock route', function () {
            let lockedUserId, unlockedUserId;

            before('Set up users for lock testing', async function () {
                const res = await agent.post('/register')
                    .send({ userName: 'unlocked' + newUserName, email: 'unlocked' + newEmail, password: newPassword });
                unlockedUserId = res.body.userId;
                const res2 = await agent.post('/register')
                    .send({ userName: 'locked' + newUserName, email: 'locked' + newEmail, password: newPassword });
                lockedUserId = res2.body.userId;
            });

            beforeEach('Make sure each user is in the correct state before each test', async function () {
                const unlockedUser = await User.findById(unlockedUserId);
                unlockedUser.locked = false;
                unlockedUser.save();
                const lockedUser = await User.findById(lockedUserId);
                lockedUser.locked = true;
                lockedUser.save();
            });

            after('Tear down users for lock testing', async function () {
                await User.findByIdAndDelete(lockedUserId);
                await User.findByIdAndDelete(unlockedUserId);
            })

            describe('Happy paths', function () {
                describe('Login as admin and lock an unlocked user', function () {
                    it('should return a 200 status and a success message and set the field locked to true in the user\'s database entry', async function () {
                        await agent.post('/login').send(adminLogin);

                        const res = await agent.post('/admin/user/' + unlockedUserId + '/lock');
                        const user = await User.findById(unlockedUserId);

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal({ message: "User successfully locked." });
                        expect(user.locked).to.be.true;
                    });
                });

                describe('Login as locked user', function () {
                    it('should return a 200 status and the users user.privateProfile()', async function () {
                        const res = await agent.post('/login').send({ name: 'locked' + newUserName, password: newPassword });

                        expect(res).to.have.status(200);
                        expect(res.body.userName).to.deep.equal('locked' + newUserName);
                        expect(res.body.locked).to.be.true;
                    });
                });

                describe('Login as locked user and POST /entry', function () {
                    it('should redirect to login', async function () {
                        await agent.post('/login').send({ name: 'locked' + newUserName, password: newPassword });

                        const res = await agent.post('/entry').send(testEntry);

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                    });
                });

                describe('Login as unlocked user, lock user, and POST /entry', function () {
                    it('should redirect to login', async function () {
                        const loginRes = await agent.post('/login').send({ name: 'unlocked' + newUserName, password: newPassword });
                        const user = await User.findById(loginRes.body.userId);
                        user.locked = true;
                        user.save();

                        const res = await agent.post('/entry').send(testEntry);

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                    });
                });
            });

            describe('Sad paths', function () {
                describe('Logout and lock an unlocked user', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/logout');

                        const res = await agent.post('/admin/user/' + unlockedUserId + '/lock');

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                    });
                });

                describe('Login as non-admin and lock an unlocked user', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/login').send(testUserLogin);

                        const res = await agent.post('/admin/user/' + unlockedUserId + '/lock');

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                    });
                });

                describe('Login as admin and lock an already locked user', function () {
                    it('should return a 409 status and an error message', async function () {
                        await agent.post('/login').send(adminLogin);

                        const res = await agent.post('/admin/user/' + lockedUserId + '/lock');

                        expect(res).to.have.status(409);
                        expect(res.body).to.deep.equal({ error: "That user is already locked." });
                    });
                });
            });
        });

        describe('Test the DELETE /admin/user/:userId/lock route', function () {
            let lockedUserId, unlockedUserId;

            before('Set up users for lock testing', async function () {
                const unlockedUserRes = await agent.post('/register')
                    .send({ userName: 'unlocked' + newUserName, email: 'unlocked' + newEmail, password: newPassword });
                unlockedUserId = unlockedUserRes.body.userId;
                const lockedUserRes = await agent.post('/register')
                    .send({ userName: 'locked' + newUserName, email: 'locked' + newEmail, password: newPassword });
                lockedUserId = lockedUserRes.body.userId;
            });

            beforeEach('Make sure each user is in the correct state before each test', async function () {
                const unlockedUser = await User.findById(unlockedUserId);
                unlockedUser.locked = false;
                unlockedUser.save();
                const lockedUser = await User.findById(lockedUserId);
                lockedUser.locked = true;
                lockedUser.save();
            });

            after('Tear down users for lock testing', async function () {
                await User.findByIdAndDelete(lockedUserId);
                await User.findByIdAndDelete(unlockedUserId);
            })

            describe('Happy paths', function () {
                describe('Login as admin and unlock a locked user', function () {
                    it('should return a 200 status and a success message, and set the user\'s locked field to false', async function () {
                        await agent.post('/login').send(adminLogin);

                        const res = await agent.delete('/admin/user/' + lockedUserId + '/lock');
                        const user = await User.findById(lockedUserId);

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal({ message: "User successfully unlocked." });
                        expect(user.locked).to.be.false;
                    });
                });
            });

            describe('Sad paths', function () {
                describe('Logout and unlock a locked user', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/logout');

                        const res = await agent.delete('/admin/user/' + lockedUserId + '/lock');

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                    });
                });

                describe('Login as non admin and unlock a locked user', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/login').send(testUserLogin);

                        const res = await agent.delete('/admin/user/' + lockedUserId + '/lock');

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                    });
                });

                describe('Login as admin and unlock an unlocked user', function () {
                    it('should return a 409 status and an error message', async function () {
                        await agent.post('/login').send(adminLogin);

                        const res = await agent.delete('/admin/user/' + unlockedUserId + '/lock');

                        expect(res).to.have.status(409);
                        expect(res.body).to.deep.equal({ error: "That user is not locked." });
                    });
                });
            });
        });

        describe('Test the GET /admin/user/:userId route', function () {
            describe('Happy paths', function () {
                describe('Login as admin and GET /admin/user/:userId', function () {
                    it('should return a 200 status and return the user\'s entire database document', async function () {
                        await agent.post('/login').send(adminLogin);

                        const res = await agent.get('/admin/user/' + newUserPrivateProfile().userId);

                        expect(res).to.have.status(200);
                        expect(res.body.locked).to.be.false;
                        expect(res.body._id).to.deep.equal(newUserPrivateProfile().userId)
                    });
                });
            });

            describe('Sad paths', function () {
                describe('Logout and GET /admin/user/:userId', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/logout');

                        const res = await agent.get('/admin/user/' + newUserPrivateProfile().userId);

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                    });
                });

                describe('Login as non-admin and GET /admin/user/:userId', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/login').send(testUserLogin);

                        const res = await agent.get('/admin/user/' + newUserPrivateProfile().userId);

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                    });
                });
            });
        });

        describe('Test the PUT /admin/user/:userId route', function () {
            let testUserId, testAdminId;

            before('Setup users for testing PUT /admin/user/:userId route', async function () {
                const testUserRes = await agent.post('/register')
                    .send({ userName: 'testUser' + newUserName, email: 'testUser' + newEmail, password: newPassword });
                testUserId = testUserRes.body.userId;
                const testAdminRes = await agent.post('/register')
                    .send({ userName: 'testAdmin' + newUserName, email: 'testAdmin' + newEmail, password: newPassword });
                testAdminId = testAdminRes.body.userId;
            });

            beforeEach('Make sure the test users are in a consistent state before each test', async function () {
                let testUser = await User.findById(testUserId);
                testUser.admin = false;
                testUser.bio = "Red";
                testUser.publishEmail = true;
                await testUser.save();
                let testAdmin = await User.findById(testAdminId);
                testAdmin.admin = true;
                await testAdmin.save();
            });

            after('Teardown test users', async function () {
                await User.findByIdAndDelete(testUserId);
                await User.findByIdAndDelete(testAdminId);
            })

            describe('Happy paths', function () {
                describe('Login as admin and PUT { admin: true }', function () {
                    it('should return a 200 status and user.privateProfile() and set the user\'s admin field to true', async function () {
                        await agent.post('/login').send(adminLogin);

                        const res = await agent.put('/admin/user/' + testUserId).send({ admin: true });
                        const user = JSON.parse(JSON.stringify(await User.findByIdAndPopulate(testUserId)));
                        delete user.passwordHash;

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal(user);
                        expect(user.admin).to.be.true;
                    });
                });

                describe('Login as admin and PUT { admin: false }', function () {
                    it('should return a 200 status and user.privateProfile() and set the user\'s admin field to false', async function () {
                        await agent.post('/login').send(adminLogin);

                        const res = await agent.put('/admin/user/' + testAdminId).send({ admin: false });
                        const user = JSON.parse(JSON.stringify(await User.findByIdAndPopulate(testAdminId)));
                        delete user.passwordHash;

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal(user);
                        expect(user.admin).to.be.false;
                    });
                });

                describe('Login as admin and PUT { bio: "Blue" }', function () {
                    it('should return a 200 status and user.privateProfile() and set the user\'s bio to "Blue"', async function () {
                        await agent.post('/login').send(adminLogin);

                        const res = await agent.put('/admin/user/' + testUserId).send({ bio: "Blue" });
                        const user = JSON.parse(JSON.stringify(await User.findByIdAndPopulate(testUserId)));
                        delete user.passwordHash;

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal(user);
                        expect(user.bio).to.deep.equal("Blue");
                    });
                });

                describe('Login as admin and PUT { publishEmail: false }', function () {
                    it('should return a 200 status and user.privateProfile() and set the user\'s publishEmail to false', async function () {
                        await agent.post('/login').send(adminLogin);

                        const res = await agent.put('/admin/user/' + testUserId).send({ publishEmail: false });
                        const user = JSON.parse(JSON.stringify(await User.findByIdAndPopulate(testUserId)));
                        delete user.passwordHash;

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal(user);
                        expect(user.publishEmail).to.be.false;
                    });
                });
            });

            describe('Sad paths', function () {
                describe('Logout and PUT /admin/user/:userId with { admin: true }', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/logout');

                        const res = await agent.put('/admin/user/' + testUserId).send({ admin: true });

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                    });
                });

                describe('Login as non-admin and PUT /admin/user/:userId with { admin: true }', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/login').send(testUserLogin);

                        const res = await agent.put('/admin/user/' + testUserId).send({ admin: true });

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                    });
                });

                describe('Login as admin and PUT /admin/user/:userId with { admin: "true" }', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/login').send(adminLogin);

                        const res = await agent.put('/admin/user/' + testUserId).send({ admin: "true" });

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Invalid request." });
                    });
                });
            });
        });
    });

    describe('Test the keyword modification routes', function () {
        let story;

        beforeEach('Setup entry for keyword testing', async function () {
            await agent.post('/login').send(testUserLogin);
            const storyRes = await agent.post('/entry').send(testStory);
            story = storyRes.body;
        });

        afterEach('Teardown entry for keyword testing', async function () {
            await Entry.findByIdAndDelete(story.entryId);
        });

        describe('Test the PUT /admin/entry/:entryId/keyword route', function () {
            describe('Happy paths', function () {
                describe('Login as admin and add a keyword', function () {
                    it('should return a 200 status and a success message, and add the keyword to the entry in the database.', async function () {
                        await agent.post('/login').send(adminLogin);

                        const res = await agent.put('/admin/entry/' + story.entryId + '/keyword').send(["silly"]);
                        const entry = await Entry.findById(story.entryId);

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal({ message: "Keywords successfully added." });
                        expect(entry.keywords).to.be.an('array');
                        expect(entry.keywords).to.include("silly");
                    });
                });
            });

            describe('Sad paths', function () {
                describe('Login as a non-admin and add a keyword', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/login').send(testUserLogin);

                        const res = await agent.put('/admin/entry/' + story.entryId + '/keyword').send(["silly"]);

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                    });
                });

                describe('Logout and add a keyword', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/logout');

                        const res = await agent.put('/admin/entry/' + story.entryId + '/keyword').send(["silly"]);

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                    });
                });

                describe('Login as admin and do a PUT with a non-array', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/login').send(adminLogin);

                        const res = await agent.put('/admin/entry/' + story.entryId + '/keyword').send("silly");

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Request body must be an array of strings." });
                    });
                });

                describe('Login as admin and add an invalid keyword', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/login').send(adminLogin);

                        const res = await agent.put('/admin/entry/' + story.entryId + '/keyword').send(["silly?"]);

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Request body must be an array of strings." });
                    });
                });
            });
        });

        describe('Test the DELETE /admin/entry/:entryId/keyword route', function () {
            describe('Happy paths', function () {
                describe('Login as admin and delete a keyword', function () {
                    it('should return a 200 status and a success message, and remove the keyword from the entry', async function () {
                        await agent.post('/login').send(adminLogin);

                        const res = await agent.delete('/admin/entry/' + story.entryId + '/keyword/' + story.keywords[2]);
                        const entry = await Entry.findById(story.entryId);

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal({ message: "Keyword successfully deleted." });
                        expect(entry.keywords).to.not.include(story.keywords[2]);
                    });
                });
            });

            describe('Sad paths', function () {
                describe('Login as a non-admin and delete a keyword', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/login').send(testUserLogin);

                        const res = await agent.delete('/admin/entry/' + story.entryId + '/keyword/' + story.keywords[2]);

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                    });
                });

                describe('Logout and delete a keyword', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/logout');

                        const res = await agent.delete('/admin/entry/' + story.entryId + '/keyword/' + story.keywords[2]);

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                    });
                });

                describe('Login as admin and DELETE with an invalid keyword', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/login').send(adminLogin);

                        const res = await agent.delete('/admin/entry/' + story.entryId + '/keyword/silly!');

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "That is not a valid keyword." });
                    });
                });

                describe('Login as admin and DELETE with a keyword that the entry doesn\'t have', function () {
                    it('should return a 404 status and an error message', async function () {
                        await agent.post('/login').send(adminLogin);

                        const res = await agent.delete('/admin/entry/' + story.entryId + '/keyword/silly');

                        expect(res).to.have.status(404);
                        expect(res.body).to.deep.equal({ error: "Keyword not found in entry." });
                    });
                });
            });
        });
    });
});