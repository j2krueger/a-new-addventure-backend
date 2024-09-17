"use strict";

import * as globals from './globals.mjs';
import bcrypt from "bcrypt";
const {
    // resources
    expect,
    //  mongoose,
    agent,
    // constants
    constants,
    testString,
    newUser1Name,
    newUser1Email,
    // newUser2Name,
    newUser2Email,
    newPassword,
    testUser1Login,
    // adminLogin,
    // testStory,
    // testChapter,
    newUserPrivateProfile,
    newUserPublicInfo,
    // newUserBasicInfo,
    shouldSendEmail,
    // summaryKeys,
    // models
    User,
    // Chapter,
    Follow,
    // Message,
    // Like,
    // Flag,
    // Bookmark,
    // functions
    // populateUserInfo,
    expectMongoObjectId,
} = globals;
const { minimumPasswordLength, maximumUserNameLength } = constants;


describe('Test the user handling routes', function () {
    this.slow(1000);

    describe('Test the POST /register route', function () {
        describe('Happy paths', function () {
            describe('POST /register with unique userName, unique email, and password', function () {
                it('should return 201 status and the new user\'s privateProfile()', async function () {
                    const res = await agent.post('/register').send({ userName: 'test' + newUser1Name, email: 'test' + newUser1Email, password: newPassword });
                    shouldSendEmail();

                    expect(res).to.have.status(201);
                    expect(res.body.userName).to.equal('test' + newUser1Name);
                    expect(res.body.email).to.equal('test' + newUser1Email);
                    expectMongoObjectId(res.body.userId);
                    expect(res.body.bio).to.equal("I haven't decided what to put in my bio yet.");
                    expect(res.body.publishEmail).to.equal(false);
                    expect(res.body.darkMode).to.equal(false);
                    expect(res.body.publishedChapters).to.be.an('array').with.lengthOf(0);

                    await User.findByIdAndDelete(res.userId);
                });
            });
        });

        describe('Sad paths', function () {
            describe('Register a user with a duplicate userName', function () {
                it('should return a 409 conflict status code', async function () {
                    const res = await agent.post('/register').send({ userName: newUser1Name, email: 'notAdupe@example.com', password: "notAsecret" });

                    expect(res).to.have.status(409);
                    expect(res.body).to.deep.equal({ error: "Username already in use." });
                });
            });

            describe('Register a user with a duplicate email', function () {
                it('should return a 409 conflict status code', async function () {
                    const res = await agent.post('/register').send({ userName: 'notAdupe', email: newUser1Email, password: "notAsecret" });

                    expect(res).to.have.status(409);
                    expect(res.body).to.deep.equal({ error: "Email already in use." });
                });
            });

            describe('Register a user with no userName', function () {
                it('should return a 400 status and an error message', async function () {
                    const res = await agent.post('/register').send({ email: 'notAdupe@example.com', password: "notAsecret" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Missing userName." });
                });
            });

            describe('register a user with an empty userName', function () {
                it('should return a 400 status and an error message', async function () {
                    const res = await agent.post('/register').send({ userName: "", email: 'notAdupe@example.com', password: "notAsecret" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Missing userName." });
                });
            });

            describe('register a user with a userName longer than maximumUserNameLength', function () {
                it('should return a 400 status and an error message', async function () {
                    const res = await agent.post('/register').send({ userName: newUser1Name + 'x'.repeat(maximumUserNameLength + 1 - newUser1Name.length), email: 'notAdupe@example.com', password: "notAsecret" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Username may not be longer than " + maximumUserNameLength + " characters." });
                });
            });

            describe('Register a user with no email', function () {
                it('should return a 400 bad request status code', async function () {
                    const res = await agent.post('/register').send({ userName: 'notAdupe', password: "notAsecret" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Missing email." });
                });
            });

            describe('Register a user with no password', function () {
                it('should return a 400 status and an error message', async function () {
                    const res = await agent.post('/register').send({ userName: 'notAdupe', email: "notAdupe@example.com" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Missing password." });
                });
            });

            describe('Register a user with a password shorter than minimumPasswordLength characters', function () {
                it('should return a 400 status and an error message', async function () {
                    const res = await agent.post('/register').send({
                        userName: 'notAdupe' + testString,
                        email: 'notAdupe' + testString + '@example.com',
                        password: 'x'.repeat(minimumPasswordLength - 1),
                    });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: 'Password must be at least ' + minimumPasswordLength + ' characters long.' });
                });
            });
        });
    });

    describe('Test email verification', function () {
        describe('Happy paths', function () {
            describe('Register user and logout and POST /verify/:userId/:emailVerificationKey', function () {
                it('should return a 200 status and a success message, and set user\'s emailVerified field to true', async function () {
                    const userRes = await agent.post('/register').send({ userName: "vrfyEmail" + newUser1Name, email: "verifyEmail" + newUser1Email, password: newPassword });
                    shouldSendEmail();
                    await agent.post('/logout');

                    const user = await User.findById(userRes.body.userId);
                    const res = await agent.post('/verify/' + user._id + '/' + user.emailVerificationKey);
                    const reUser = await User.findById(userRes.body.userId);

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal({ message: "Email successfully verified." });
                    expect(reUser.emailVerified).to.be.true;
                    expect(reUser.emailVerificationKey).to.be.undefined;

                    await User.findByIdAndDelete(user._id);
                });
            });
        });

        describe('Sad paths', function () {
            describe('POST /verify/:userId/:emailVerificationKey with the wrong key', function () {
                it('should return a 403 status and an error message, and not set emailVerified to true', async function () {
                    const userRes = await agent.post('/register').send({ userName: "vrfyEmail" + newUser1Name, email: "verifyEmail" + newUser1Email, password: newPassword });
                    shouldSendEmail();
                    await agent.post('/logout');

                    const user = await User.findById(userRes.body.userId);
                    const res = await agent.post('/verify/' + user._id + '/00000000000000000000');
                    const reUser = await User.findById(userRes.body.userId);

                    expect(res).to.have.status(403);
                    expect(res.body).to.deep.equal({ error: "Bad email verification key." });
                    expect(reUser.emailVerified).to.be.false;

                    await User.findByIdAndDelete(user._id);
                });
            });

            describe('POST /verify/:userId/:emailVerificationKey with misformed key', function () {
                it('should return a 400 status and an error message, and not set emailVerified to true', async function () {
                    const userRes = await agent.post('/register').send({ userName: "vrfyEmail" + newUser1Name, email: "verifyEmail" + newUser1Email, password: newPassword });
                    shouldSendEmail();
                    await agent.post('/logout');

                    const user = await User.findById(userRes.body.userId);
                    const res = await agent.post('/verify/' + user._id + '/0');
                    const reUser = await User.findById(userRes.body.userId);

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "That is not a properly formatted email verification key." });
                    expect(reUser.emailVerified).to.be.false;

                    await User.findByIdAndDelete(user._id);
                });
            });

            describe('POST /verify/:userId/:emailVerificationKey with user whose email has already been verified', function () {
                it('should return a 409 status and an error message', async function () {
                    const userRes = await agent.post('/register').send({ userName: "vrfyEmail" + newUser1Name, email: "verifyEmail" + newUser1Email, password: newPassword });
                    shouldSendEmail();
                    await agent.post('/logout');

                    const user = await User.findById(userRes.body.userId);
                    await agent.post('/verify/' + user._id + '/' + user.emailVerificationKey);
                    const res = await agent.post('/verify/' + user._id + '/' + user.emailVerificationKey);
                    const reUser = await User.findById(userRes.body.userId);

                    expect(res).to.have.status(409);
                    expect(res.body).to.deep.equal({ error: "Email already verified." });
                    expect(reUser.emailVerified).to.be.true;

                    await User.findByIdAndDelete(user._id);
                });
            });
        });
    });

    describe('Test the POST /login route', function () {
        describe('Happy paths', function () {
            describe('login by userName', function () {
                it('should return a 200 ok and return a user.privateProfile() with the given userName', async function () {
                    const res = await agent.post('/login').send(testUser1Login);

                    expect(res).to.have.status(200);
                    expect(res).to.have.cookie('connect.sid');
                    expect(res).to.have.cookie('token');
                    expect(res.body).to.deep.equal(newUserPrivateProfile());
                });
            });

            describe('login by email', function () {
                it('should return a 200 ok and return a user.privateProfile() with the given email', async function () {
                    const res = await agent.post('/login').send({ name: newUser1Email, password: newPassword });

                    expect(res).to.have.status(200);
                    expect(res).to.have.cookie('connect.sid');
                    expect(res).to.have.cookie('token');
                    expect(res.body).to.deep.equal(newUserPrivateProfile());
                });
            });
        });

        describe('Sad paths', function () {
            describe('login with nonexistant userName/email', function () {
                it('should return a 401 unauthorized and an error message', async function () {
                    const res = await agent.post('/login').send({ name: newUser1Email + "blahblahblah" + testString, password: newPassword });

                    expect(res).to.have.status(401);
                    expect(res.body).to.deep.equal({ error: "Incorrect name or password." });
                });
            });

            describe('login with bad password', function () {
                it('should return a 401 unauthorized and an error message', async function () {
                    const res = await agent.post('/login').send({ name: newUser1Name, password: newPassword + '!' });

                    expect(res).to.have.status(401);
                    expect(res.body).to.deep.equal({ error: "Incorrect name or password." });
                });
            });

            describe('login with missing name', function () {
                it('should return a 400 bad request and an error message', async function () {
                    const res = await agent.post('/login').send({ password: newPassword });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Missing name." });
                });
            });

            describe('login with missing password', function () {
                it('should return a 400 bad request and an error message', async function () {
                    const res = await agent.post('/login').send({ name: newUser1Name });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Missing password." });
                });
            });
        });
    });

    describe('Test POST /logout path', function () {
        it('should return a 200 ok and a response message', async function () {
            const res = await agent.post('/logout');

            expect(res).to.have.status(200);
            expect(res.body).to.deep.equal({ message: "Logout successful." });
        });
    });

    describe('Test the GET /users route', function () {
        describe('Happy paths', function () {
            describe('get users', function () {
                it('should return a 200 OK and an array of users.publicInfo() with no more than constants.resultsPerPage chapters', async function () {
                    const res = await agent.get('/user');

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.resultsPerPage);
                    for (const user of res.body) {
                        expectMongoObjectId(user.userId);
                        expect(user.userName).to.be.a('string');
                        expect(user.email).to.be.a('string');
                        expect(user.bio).to.be.a('string');
                        expect(user.publishedChapters).to.be.an('array');
                    }
                });
            });

            describe('get users with query string {regex: F}', function () {
                it('should return a 200 OK and an array of users.publicInfo() with each userName including an F', async function () {
                    const res = await agent.get('/user').query({ regex: 'F' });

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array');
                    for (const user of res.body) {
                        expectMongoObjectId(user.userId);
                        expect(user.userName).to.be.a('string').that.matches(/F/);
                        expect(user.email).to.be.a('string');
                        expect(user.bio).to.be.a('string');
                        expect(user.publishedChapters).to.be.an('array');
                    }
                });
            });

            describe('get users with query string {regex: f, i:1}', function () {
                it('should return a 200 OK and an array of users.publicInfo() with each userName including an F or an f', async function () {
                    const res = await agent.get('/user').query({ regex: 'f', i: 1 });

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array');
                    for (const user of res.body) {
                        expectMongoObjectId(user.userId);
                        expect(user.userName).to.be.a('string').which.matches(/f/i);
                        expect(user.email).to.be.a('string');
                        expect(user.bio).to.be.a('string');
                        expect(user.publishedChapters).to.be.an('array');
                    }
                });
            });

            describe('get users with query string {page: 2}', function () {
                before('Set up users to test pagination', async function () {
                    for (let userCount = 0; userCount <= constants.resultsPerPage; userCount++) {
                        console.log('Generating user ' + userCount);
                        const thisRes = await agent.post('/register/').send({ userName: userCount + newUser1Name, email: userCount + newUser1Email, password: newPassword });
                        shouldSendEmail();
                        expect(thisRes).to.have.status(201);
                    }
                });

                after('Teardown users to test pagination', async function () {
                    for (let userCount = 0; userCount <= constants.resultsPerPage; userCount++) {
                        console.log('Deleting user ' + userCount);
                        await User.findOneAndDelete({ userName: userCount + newUser1Name });
                    }
                });

                it('should return a 200 OK and an array of users.publicInfo() corresponding to page 2 of the results', async function () {
                    const res = await agent.get('/user').query({ page: 2 });

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array');
                    for (const user of res.body) {
                        expectMongoObjectId(user.userId);
                        expect(user.userName).to.be.a('string');
                        expect(user.email).to.be.a('string');
                        expect(user.bio).to.be.a('string');
                        expect(user.publishedChapters).to.be.an('array');
                    }
                });
            });
        });

        describe('Sad paths', function () {
            describe('search for a nonexistant userName', function () {
                it('should return a 404 not found and an error message', async function () {
                    const res = await agent.get('/user').query({ regex: newUser1Name + newUser1Name });

                    expect(res).to.have.status(404);
                    expect(res.body).to.deep.equal({ error: "No matching users found." });
                });
            });
        });
    });

    describe('Test the :userId param middleware', function () {
        describe('Happy paths', function () {
            describe('GET /user/:userId with an existing userId', function () {
                it('should return a 200 status', async function () {
                    const res = await agent.get('/user/' + newUserPrivateProfile().userId);

                    expect(res).to.have.status(200);
                });
            });
        });

        describe('Sad paths', function () {
            describe('GET /user/:userId with a nonexistant userId', function () {
                it('should return a 404 status and an error message', async function () {
                    const res = await agent.get('/user/000000000000000000000000');

                    expect(res).to.have.status(404);
                    expect(res.body).to.deep.equal({ error: "There is no user with that userId." });
                });
            });

            describe('GET /user/:userId with a malformed userId', function () {
                it('should return a 400 status and an error message', async function () {
                    const res = await agent.get('/user/0');

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "That is not a properly formatted userId." });
                });
            });
        });
    });

    describe('Test the GET /user/:userId route', function () {
        describe('Happy paths', function () {
            describe('get user by userId', function () {
                it('should return a 200 OK and the user.publicInfo()', async function () {
                    const res = await agent.get('/user/' + newUserPrivateProfile().userId);

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal(newUserPublicInfo());
                });
            });
        });
    });

    describe('Test GET /profile path', function () {
        describe('Happy paths', function () {
            describe('login and get profile', function () {
                it('should return 200 OK and logged in users.privateProfile()', async function () {
                    await agent.post('/login').send(testUser1Login);

                    const res = await agent.get('/profile');

                    expect(res).to.have.status(200);
                    expect(res.body.publishedChapters).to.be.an('array');
                    expect(res.body.followedAuthors).to.be.an('array');
                    expect(res.body.likedChapters).to.be.an('array');
                    expect(res.body.bookmarkedChapters).to.be.an('array');
                    expect(res.body).to.deep.equal(newUserPrivateProfile());
                });
            });
        });

        describe('Sad paths', function () {
            describe('logout and get profile', function () {
                it('should return 200 OK and logged in users.privateProfile()', async function () {
                    await agent.post('/logout');

                    const res = await agent.get('/profile');

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                });
            });
        });
    });

    describe('Test PUT /profile path', function () {
        describe('Happy paths', function () {
            describe('login and put profile', function () {
                it('should return 200 OK and logged in user\'s privateProfile()', async function () {
                    await agent.post('/login').send(testUser1Login);

                    const res = await agent.put('/profile').send({ darkMode: true });
                    const tempNewUserPrivateProfile = newUserPrivateProfile();
                    tempNewUserPrivateProfile.darkMode = !tempNewUserPrivateProfile.darkMode;

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal(tempNewUserPrivateProfile);

                    await agent.put('/profile').send({ darkMode: false });
                });
            });

            describe('Login and put profile with a new email', function () {
                it('should return 200 status and logged in user\'s privateProfile(), and send a verification email, and set emailVerified to false, and set emailVerificationKey', async function () {
                    const userRes = await agent.post('/login').send(testUser1Login);
                    await User.findByIdAndUpdate(userRes.body.userId, { emailVerified: true });

                    const res = await agent.put('/profile').send({ email: "putProfile" + newUser1Email });
                    shouldSendEmail();
                    const user = await User.findById(res.body.userId);

                    expect(res).to.have.status(200);
                    expect(res.body.email).to.deep.equal("putProfile" + newUser1Email);
                    expect(res.body.emailVerified).to.be.false;
                    expect(user.emailVerificationKey).to.be.a('string').and.match(/^[0-9a-f]{20}$/);

                    await agent.put('/profile').send({ email: newUser1Email });
                    shouldSendEmail();
                });
            });
        });

        describe('Sad paths', function () {
            describe('logout and put profile', function () {
                it('should redirect to /login', async function () {
                    await agent.post('/logout');

                    const res = await agent.put('/profile').send({ darkMode: true });

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                });
            });

            describe('login and do a bad put on profile', function () {
                it('should return 400 OK and an error message', async function () {
                    await agent.post('/login').send(testUser1Login);

                    const res = await agent.put('/profile').send({ darkMode: "notAboolean" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Invalid request." });
                });
            });

            describe('Login and change the email to a duplicate of an existing email', function () {
                it('should return a 409 status and an error message', async function () {
                    await agent.post('/login').send(testUser1Login);

                    const res = await agent.put('/profile').send({ email: newUser2Email });

                    expect(res).to.have.status(409);
                    expect(res.body).to.deep.equal({ error: "Invalid request: That email is already in use." });
                });
            });
        });
    });

    describe('Test the POST /user/:userId/follow route', function () {
        let followedUserId;

        before('Set up user for follow testing', async function () {
            const res = await agent.post('/register')
                .send({ userName: 'followed-' + newUser1Name, email: 'followed-' + newUser1Email, password: newPassword });
            shouldSendEmail();
            expect(res).to.have.status(201);
            followedUserId = res.body.userId;
        });

        afterEach('Make sure all follows on followedUserId are deleted after each test', async function () {
            await Follow.deleteMany({ following: followedUserId });
        });

        after('Teardown user for follow testing', async function () {
            await User.findByIdAndDelete(followedUserId);
        });

        describe('Happy paths', function () {
            describe('Login and POST /user/:userId/follow', function () {
                it('should return 200 ok and a success message, and add a follow to the database', async function () {
                    await agent.post('/login').send(testUser1Login);

                    const res = await agent.post('/user/' + followedUserId + '/follow');
                    const follows = await Follow.find({ following: followedUserId });

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal({ message: "Follow successful." });
                    expect(follows).to.be.an('array').with.lengthOf(1);
                });
            });
        });

        describe('Sad paths', function () {
            describe('Logout and POST /user/:userId/follow', function () {
                it('should redirect to /login', async function () {
                    await agent.post('/logout');

                    const res = await agent.post('/user/' + followedUserId + '/follow');

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                });
            });

            describe('Login and POST /user/blarg/follow', function () {
                it('should return a 400 status and an error message', async function () {
                    await agent.post('/login').send(testUser1Login);

                    const res = await agent.post('/user/blarg/follow');

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "That is not a properly formatted userId." });
                });
            });

            describe('Login and POST /user/:userId/follow again', function () {
                it('should return a 409 status and an error message', async function () {
                    await agent.post('/login').send(testUser1Login);

                    await agent.post('/user/' + followedUserId + '/follow');
                    const res = await agent.post('/user/' + followedUserId + '/follow');

                    expect(res).to.have.status(409);
                    expect(res.body).to.deep.equal({ error: "You are already following that user." });
                });
            });

            describe('Login, follow a user, then delete the user from the database, then GET /profile', function () {
                it('should remove the broken follow from followedAuthors', async function () {
                    const userRes = await agent.post('/register').send({ userName: 'followDel-' + newUser1Name, email: 'followDel-' + newUser1Email, password: 'password' });
                    shouldSendEmail();
                    expect(userRes).to.have.status(201);
                    await agent.post('/login').send(testUser1Login);
                    await agent.post('/user/' + userRes.body.userId + '/follow');
                    await User.findByIdAndDelete(userRes.body.userId);

                    const res = await agent.get('/profile');

                    expect(res).to.have.status(200);
                    expect(res.body.followedAuthors).to.be.an('array').with.lengthOf(0);

                    await Follow.findOneAndDelete({ following: userRes.body.userId });
                });
            });
        });
    });

    describe('Test the DELETE /user/:userId/follow route', function () {
        let followedUserId;

        before('Setup userId for testing /user/:userId/follow route', async function () {
            const userRes = await agent.post('/register').send({ userName: 'followed-' + newUser1Name, email: 'followed-' + newUser1Email, password: newPassword });
            shouldSendEmail();
            expect(userRes).to.have.status(201);
            followedUserId = userRes.body.userId;
        });

        beforeEach('Setup follow for testing /user/:userId/follow route', async function () {
            await agent.post('/login').send(testUser1Login);

            await agent.post('/user/' + followedUserId + '/follow');
        });

        after('Teardown follow for testing /user/:userId/follow route', async function () {
            await agent.delete('/user/' + followedUserId + '/follow');
        });

        describe('Happy paths', function () {
            describe('Login, follow a user, and unfollow the user', function () {
                it('should return a 200 status and return a success message.', async function () {
                    await agent.post('/login').send(testUser1Login);

                    const res = await agent.delete('/user/' + followedUserId + '/follow');

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal({ message: "Author successfully unfollowed." });
                });
            });
        });

        describe('Sad paths', function () {
            describe('Logout and unfollow', function () {
                it('should redirect to /login', async function () {
                    await agent.post('/logout');

                    const res = await agent.delete('/user/' + followedUserId + '/follow');

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                });
            });

            describe('Login and unfollow someone not followed', function () {
                it('should return a 404 status and an error message', async function () {
                    await agent.post('/login').send(testUser1Login);

                    const res = await agent.delete('/user/' + newUserPrivateProfile().userId + '/follow');

                    expect(res).to.have.status(404);
                    expect(res.body).to.deep.equal({ error: 'No follow to remove.' });
                });
            });
        });
    });

    describe('Test the password changing routes', function () {
        describe('Test the POST /changepassword route', function () {
            let passwordTestUserId;

            before('Setup user for /changepassword testing', async function () {
                const res = await agent.post('/register')
                    .send({ userName: 'chPass' + newUser1Name, email: 'chPass' + newUser1Email, password: newPassword });
                shouldSendEmail();
                passwordTestUserId = res.body.userId;
            });

            beforeEach('Make sure the test user\'s password is the default before each test', async function () {
                await User.findByIdAndUpdate(passwordTestUserId, { passwordHash: await bcrypt.hash(newPassword, constants.saltRounds) });
            });

            after('Teardown user for /changepassword testing', async function () {
                await User.findByIdAndDelete(passwordTestUserId);
            });

            describe('Happy paths', function () {
                describe('Login and POST /changepassword with correct password and newPassword', function () {
                    it('should return a 200 status and a success message and change the passwordHash in the database', async function () {
                        await agent.post('/login').send({ name: 'chPass' + newUser1Name, password: newPassword });

                        const res = await agent.post('/changepassword').send({ password: newPassword, newPassword: "2x" + newPassword });
                        const user = await User.findById(passwordTestUserId);

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal({ message: "Password has been successfully changed." });
                        expect(await bcrypt.compare("2x" + newPassword, user.passwordHash)).to.be.true;
                    });
                });
            });

            describe('Sad paths', function () {
                describe('Logout and POST /changepassword', function () {
                    it('should redirect to /login', async function () {
                        await agent.post('/logout');

                        const res = await agent.post('/changepassword').send({ password: newPassword, newPassword: "2x" + newPassword });

                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                    });
                });

                describe('Login and POST /changepassword with incorrect password', function () {
                    it('should return a 403 status and an error message', async function () {
                        await agent.post('/login').send({ name: 'chPass' + newUser1Name, password: newPassword });

                        const res = await agent.post('/changepassword').send({ password: "5x" + newPassword, newPassword: "2x" + newPassword });

                        expect(res).to.have.status(403);
                        expect(res.body).to.deep.equal({ error: "Incorrect password." });
                    });
                });

                describe('Login and POST /changepassword with no password', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/login').send({ name: 'chPass' + newUser1Name, password: newPassword });

                        const res = await agent.post('/changepassword').send({ newPassword: "2x" + newPassword });

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Missing password." });
                    });
                });

                describe('Login and POST /changepassword to a password shorter than minimumPasswordLength characters.', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/login').send({ name: 'chPass' + newUser1Name, password: newPassword });

                        const res = await agent.post('/changepassword').send({ password: newPassword, newPassword: 'x'.repeat(minimumPasswordLength - 1) });

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: 'Password must be at least ' + minimumPasswordLength + ' characters long.' });
                    });
                });

                describe('Login and POST /changepassword with no newPassword', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/login').send({ name: 'chPass' + newUser1Name, password: newPassword });

                        const res = await agent.post('/changepassword').send({ password: newPassword });

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Missing newPassword." });
                    });
                });
            });
        });

        describe('Test the POST /resetpassword route', function () {
            let resetPasswordUserId;
            let resetPasswordUserEmail;
            let resetPasswordUserName;

            before('Setup user for /resetpassword tests', async function () {
                const res = await agent.post('/register')
                    .send({ userName: 'rstPass' + newUser1Name, email: 'rstPass' + newUser1Email, password: newPassword });
                shouldSendEmail();
                const user = await User.findById(res.body.userId);
                user.emailVerified = true;
                await user.save();
                resetPasswordUserId = user._id;
                resetPasswordUserName = user.userName;
                resetPasswordUserEmail = user.email;
            });

            after('Teardown user for /resetpassword tests', async function () {
                await User.findByIdAndDelete(resetPasswordUserId);
            });

            describe('Happy paths', function () {
                describe('Logout and POST /resetpassword with { name: email }', function () {
                    it('should return a 200 status + error message, send a reset password email, and set resetPasswordKey and resetPasswordTime', async function () {
                        await agent.post('/logout');

                        const before = new Date();
                        const res = await agent.post('/resetpassword').send({ name: resetPasswordUserEmail });
                        const after = new Date();
                        const user = await User.findById(resetPasswordUserId);

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal({ message: "Password reset email has been sent." });
                        expect(user.resetPasswordKey).to.be.a('string').and.match(/^[0-9a-f]{20}$/);
                        expect(user.resetPasswordTime).to.be.within(before, after);
                        shouldSendEmail();
                    });
                });

                describe('Logout and POST /resetpassword with { name: userName }', function () {
                    it('should return a 200 status + error message, send a reset password email, and set resetPasswordKey and resetPasswordTime', async function () {
                        await agent.post('/logout');

                        const before = new Date();
                        const res = await agent.post('/resetpassword').send({ name: resetPasswordUserName });
                        const after = new Date();
                        const user = await User.findById(resetPasswordUserId);

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal({ message: "Password reset email has been sent." });
                        expect(user.resetPasswordKey).to.be.a('string').and.match(/^[0-9a-f]{20}$/);
                        expect(user.resetPasswordTime).to.be.within(before, after);
                        shouldSendEmail();
                    });
                });
            });

            describe('Sad paths', function () {
                describe('Logout and POST /resetpassword with { name: unverifiedEmail }', function () {
                    it('should return a 403 status and an error message', async function () {
                        await agent.post('/logout');

                        const res = await agent.post('/resetpassword').send({ name: newUser1Name });

                        expect(res).to.have.status(403);
                        expect(res.body).to.deep.equal({ error: "That account does not have a verified email address." });
                    });
                });

                describe('Logout and POST /resetpassword with { name: unverifiedUserName }', function () {
                    it('should return a 403 status and an error message', async function () {
                        await agent.post('/logout');

                        const res = await agent.post('/resetpassword').send({ name: newUser1Email });

                        expect(res).to.have.status(403);
                        expect(res.body).to.deep.equal({ error: "That account does not have a verified email address." });
                    });
                });

                describe('Logout and POST /resetpassword with { name: notFound }', function () {
                    it('should return a 404 status and an error message', async function () {
                        await agent.post('/logout');

                        const res = await agent.post('/resetpassword').send({ name: "Thisshouldntbeinthedatabase" + testString });

                        expect(res).to.have.status(404);
                        expect(res.body).to.deep.equal({ error: "No account has that email or userName." });
                    });
                });

                describe('Logout and POST /resetpassword with { name: notAString }', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/logout');

                        const res = await agent.post('/resetpassword').send({ name: ["array"] });

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Bad request." });
                    });
                });
            });
        });

        describe('Test the POST /resetpassword/:userId/:resetPasswordKey', function () {
            let resetPasswordUserId;
            let resetPasswordUserName;
            let resetPasswordUserKey;

            before('Setup user for testing POST /resetpassword/:userId/:resetPasswordKey', async function () {
                const userRes = await agent.post('/register')
                    .send({ userName: "rstPass" + newUser1Name, email: "rstPass" + newUser1Email, password: newPassword });
                shouldSendEmail();
                resetPasswordUserId = userRes.body.userId;
                resetPasswordUserName = userRes.body.userName;
                const user = await User.findById(resetPasswordUserId);
                user.emailVerified = true;
                await user.save();
            });

            beforeEach('Make sure the test user is ready for the second stage of password recovery', async function () {
                await agent.post('/resetpassword').send({ name: resetPasswordUserName });
                const user = await User.findById(resetPasswordUserId);
                user.passwordHash = await bcrypt.hash(newPassword, constants.saltRounds);
                resetPasswordUserKey = user.resetPasswordKey;
                await user.save();
                shouldSendEmail();
            });

            after('Teardown user for testing POST /resetpassword/:userId/:resetPasswordKey', async function () {
                await User.findByIdAndDelete(resetPasswordUserId);
            });

            describe('Happy paths', function () {
                describe('Logout and POST /resetpassword/:userId/:resetPasswordKey with { newPassword: "newPassword" }', function () {
                    it('should return a 200 status and a success message and reset the password', async function () {
                        await agent.post('/logout');

                        const res = await agent.post('/resetpassword/' + resetPasswordUserId + '/' + resetPasswordUserKey).send({ password: "2x" + newPassword });
                        const reUser = await User.findById(resetPasswordUserId);

                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal({ message: "Password successfully reset." });
                        expect(await bcrypt.compare("2x" + newPassword, reUser.passwordHash)).to.be.true;
                        expect(reUser.resetPasswordKey).to.be.undefined;
                        expect(reUser.resetPasswordTime).to.be.undefined;
                    });
                });
            });

            describe('Sad paths', function () {
                describe('Logout and POST /resetpassword/:userId/:resetPasswordKey with { newPassword: "newPassword" } with user with no resetPasswordKey', function () {
                    it('should return a 403 status and an error message', async function () {
                        await agent.post('/logout');
                        const user = await User.findOne({ userName: newUser1Name });

                        const res = await agent.post('/resetpassword/' + user._id + '/' + resetPasswordUserKey).send({ password: "2x" + newPassword });

                        expect(res).to.have.status(403);
                        expect(res.body).to.deep.equal({ error: "No resetPasswordKey set for that user." });
                    });
                });

                describe('Logout and POST /resetpassword/:userId/:resetPasswordKey with password shorter than minimumPasswordLength characters.', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/logout');

                        const res = await agent.post('/resetpassword/' + resetPasswordUserId + '/' + resetPasswordUserKey).send({ password: 'x'.repeat(minimumPasswordLength - 1) });

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: 'Password must be at least ' + minimumPasswordLength + ' characters long.' });
                    });
                });

                describe('Logout and POST /resetpassword/:userId/:resetPasswordKey with { newPassword: "newPassword" } after resetPasswordKey expires', function () {
                    it('should return a 403 status and an error message', async function () {
                        await agent.post('/logout');
                        const user = await User.findById(resetPasswordUserId);
                        user.resetPasswordTime = new Date(new Date(user.resetPasswordTime) - (constants.passwordResetTime + 1));
                        user.save();

                        const res = await agent.post('/resetpassword/' + resetPasswordUserId + '/' + resetPasswordUserKey).send({ password: "2x" + newPassword });

                        expect(res).to.have.status(403);
                        expect(res.body).to.deep.equal({ error: "Reset password key has expired." });
                    });
                });

                describe('Logout and POST /resetpassword/:userId/:resetPasswordKey with { newPassword: "newPassword" } with an incorrect key', function () {
                    it('should return a 403 status and an error message', async function () {
                        await agent.post('/logout');

                        const res = await agent.post('/resetpassword/' + resetPasswordUserId + '/00000000000000000000').send({ password: "2x" + newPassword });

                        expect(res).to.have.status(403);
                        expect(res.body).to.deep.equal({ error: "Incorrect reset password key." });
                    });
                });

                describe('Logout and POST /resetpassword/:userId/:resetPasswordKey with { newPassword: "newPassword" } with a misformed key', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/logout');

                        const res = await agent.post('/resetpassword/' + resetPasswordUserId + '/0').send({ password: ["2x" + newPassword] });

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "That is not a properly formatted reset password key." });
                    });
                });

                describe('Logout and POST /resetpassword/:userId/:resetPasswordKey with { newPassword: ["newPassword"] }', function () {
                    it('should return a 400 status and an error message', async function () {
                        await agent.post('/logout');

                        const res = await agent.post('/resetpassword/' + resetPasswordUserId + '/' + resetPasswordUserKey).send({ password: ["2x" + newPassword] });

                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({ error: "Password must be a string." });
                    });
                });
            });
        });
    });
});
