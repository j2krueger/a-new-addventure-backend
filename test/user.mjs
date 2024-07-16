"use strict";

import * as globals from './globals.mjs';
const { expect,
    // mongoose,
    agent,
    constants,
    newUserName,
    newEmail,
    newPassword,
    newUserPrivateProfile,
    newUserPublicInfo,
    // User,
    expectMongoObjectID,
} = globals;


describe('Test the user handling routes', function () {

    describe('Register a user with a duplicate userName', function () {
        it('should return a 409 conflict status code', async function () {
            const res = await agent
                .post('/register')
                .send({ userName: 'Freddy', email: 'notAdupe@example.com', password: "notAsecret" });

            expect(res).to.have.status(409);
            expect(res.body).to.deep.equal({ error: "Username already in use." })
        })
    })

    describe('Register a user with a duplicate email', function () {
        it('should return a 409 conflict status code', async function () {
            const res = await agent
                .post('/register')
                .send({ userName: 'notAdupe', email: 'Freddy@example.com', password: "notAsecret" });

            expect(res).to.have.status(409);
            expect(res.body).to.deep.equal({ error: "Email already in use." });
        })
    })

    describe('Register a user with no userName', function () {
        it('should return a 400 bad request status code', async function () {
            const res = await agent
                .post('/register')
                .send({ email: 'notAdupe@example.com', password: "notAsecret" });

            expect(res).to.have.status(400);
            expect(res.body).to.deep.equal({ error: "Missing userName." });
        })
    })

    describe('Register a user with no email', function () {
        it('should return a 400 bad request status code', async function () {
            const res = await agent
                .post('/register')
                .send({ userName: 'notAdupe', password: "notAsecret" });

            expect(res).to.have.status(400);
            expect(res.body).to.deep.equal({ error: "Missing email." });
        })
    })

    describe('Register a user with no password', function () {
        it('should return a 400 bad request status code', async function () {
            const res = await agent
                .post('/register')
                .send({ userName: 'notAdupe', email: "notAdupe@example.com" });

            expect(res).to.have.status(400);
            expect(res.body).to.deep.equal({ error: "Missing password." });
        })
    })

    describe('login by userName', function () {
        it('should return a 200 ok and return a user.privateProfile() with the given userName', async function () {
            const res = await agent
                .post('/login')
                .send({ name: newUserName, password: newPassword });

            expect(res).to.have.status(200);
            expect(res).to.have.cookie('connect.sid');
            expect(res).to.have.cookie('token');
            expect(res.body).to.deep.equal(newUserPrivateProfile());
        })
    })

    describe('login by email', function () {
        it('should return a 200 ok and return a user.privateProfile() with the given email', async function () {
            const res = await agent
                .post('/login')
                .send({ name: newEmail, password: newPassword });

            expect(res).to.have.status(200);
            expect(res.body).to.deep.equal(newUserPrivateProfile());
        })
    })

    describe('login with nonexistant userName/email', function () {
        it('should return a 401 unauthorized and an error message', async function () {
            const res = await agent
                .post('/login')
                .send({ name: 'Fredddy@example.com', password: "s33krit!" });

            expect(res).to.have.status(401);
            expect(res.body).to.deep.equal({ error: "Incorrect name or password." });
        })
    })

    describe('login with bad password', function () {
        it('should return a 401 unauthorized and an error message', async function () {
            const res = await agent
                .post('/login')
                .send({ name: 'Freddy@example.com', password: "s333krit!" });

            expect(res).to.have.status(401);
            expect(res.body).to.deep.equal({ error: "Incorrect name or password." });
        })
    })

    describe('login with missing name', function () {
        it('should return a 400 bad request and an error message', async function () {
            const res = await agent
                .post('/login')
                .send({ password: "s33krit!" });

            expect(res).to.have.status(400);
            expect(res.body).to.deep.equal({ error: "Missing name." });
        })
    })

    describe('login with missing password', function () {
        it('should return a 400 bad request and an error message', async function () {
            const res = await agent
                .post('/login')
                .send({ name: "Freddy" });

            expect(res).to.have.status(400);
            expect(res.body).to.deep.equal({ error: "Missing password." });
        })
    })

    describe('get users', function () {
        it('should return a 200 OK and an array of users.publicInfo() with no more than constants.entriesPerPage entries', async function () {
            const res = await agent
                .get('/user');

            expect(res).to.have.status(200);
            expect(res.body).to.be.an('array').which.has.lengthOf.at.most(constants.entriesPerPage);
            for (const user of res.body) {
                expectMongoObjectID(user.userID);
                expect(user.userName).to.be.a('string');
                expect(user.email).to.be.a('string');
                expect(user.bio).to.be.a('string');
                expect(user.publishedEntries).to.be.an('array')
            }
        })
    })

    describe('get users with query string {regex: f}', function () {
        it('should return a 200 OK and an array of users.publicInfo() with each userName including an f', async function () {
            const res = await agent
                .get('/user')
                .query({ regex: 'f' });

            expect(res).to.have.status(200);
            expect(res.body).to.be.an('array');
            for (const user of res.body) {
                expectMongoObjectID(user.userID);
                expect(user.userName).to.be.a('string').which.matches('f');
                expect(user.email).to.be.a('string');
                expect(user.bio).to.be.a('string');
                expect(user.publishedEntries).to.be.an('array')
            }
        })
    })

    describe('get users with query string {regex: f, i:1}', function () {
        it('should return a 200 OK and an array of users.publicInfo() with each userName including an F or an f', async function () {
            const res = await agent
                .get('/user')
                .query({ regex: 'f', i: 1 });

            expect(res).to.have.status(200);
            expect(res.body).to.be.an('array');
            for (const user of res.body) {
                expectMongoObjectID(user.userID);
                expect(user.userName).to.be.a('string').which.matches(/f/i);
                expect(user.email).to.be.a('string');
                expect(user.bio).to.be.a('string');
                expect(user.publishedEntries).to.be.an('array')
            }
        })
    })

    describe('get users with query string {page: 2}', function () {
        it('should return a 200 OK and an array of users.publicInfo() corresponding to page 2 of the results', async function () {
            const res = await agent
                .get('/user')
                .query({ page: 2 });

            expect(res).to.have.status(200);
            expect(res.body).to.be.an('array');
            for (const user of res.body) {
                expectMongoObjectID(user.userID);
                expect(user.userName).to.be.a('string');
                expect(user.email).to.be.a('string');
                expect(user.bio).to.be.a('string');
                expect(user.publishedEntries).to.be.an('array')
            }
        })
    })

    describe('get user by userID', function () {
        it('should return a 200 OK and the user.publicInfo()', async function () {
            const res = await agent
                .get('/user/' + newUserPrivateProfile().userID);

            expect(res).to.have.status(200);
            expect(res.body).to.deep.equal(newUserPublicInfo());
        })
    })

    describe('get user by nonexistant userID', function () {
        it('should return a 404 not found and an error message', async function () {
            const res = await agent
                .get('/user/000000000000000000000000');

            expect(res).to.have.status(404);
            expect(res.body).to.deep.equal({ error: "There is no user with that user ID." });
        })
    })

    describe('get user by badly formed userID', function () {
        it('should return a 400 bad request and an error message', async function () {
            const res = await agent
                .get('/user/notANidSTRING');

            expect(res).to.have.status(400);
            expect(res.body).to.deep.equal({ error: "That is not a properly formatted userID." });
        })
    })

    describe('post logout', function () {
        it('should return a 200 ok and a response message', async function () {
            const res = await agent
                .post('/logout');

            expect(res).to.have.status(200);
            expect(res.body).to.deep.equal({ message: "Logout successful." });
        })
    })

    describe('login and get profile', function () {
        it('should return 200 OK and logged in users.privateProfile()', async function () {
            const res = await agent
                .post('/login')
                .send({ name: newUserName, password: newPassword });

            expect(res).to.have.status(200);

            const res2 = await agent
                .get('/profile');

            expect(res2).to.have.status(200);
            expect(res2.body).to.deep.equal(newUserPrivateProfile());
        });
    });

    describe('logout and get profile', function () {
        it('should return 200 OK and logged in users.privateProfile()', async function () {
            const res = await agent
                .post('/logout');

            expect(res).to.have.status(200);
            const res2 = await agent
                .get('/profile');

            expect(res2).to.redirectTo(constants.mochaTestingUrl + '/login');
        });
    });

    describe('login and put profile', function () {
        it('should return 200 OK and logged in users.privateProfile()', async function () {
            const res = await agent
                .post('/login')
                .send({ name: newUserName, password: newPassword });

            expect(res).to.have.status(200);
            const res2 = await agent
                .put('/profile')
                .send({ darkMode: !newUserPrivateProfile.darkMode });

            expect(res2).to.have.status(200);
            const tempNewUserPrivateProfile = newUserPrivateProfile();
            tempNewUserPrivateProfile.darkMode = !tempNewUserPrivateProfile.darkMode;
            expect(res2.body).to.deep.equal(tempNewUserPrivateProfile);
            globals.populateUserInfo(tempNewUserPrivateProfile);
        });
    });

    describe('logout and put profile', function () {
        it('should return 200 OK and logged in users.privateProfile()', async function () {
            const res = await agent
                .post('/logout');

            expect(res).to.have.status(200);
            const res2 = await agent
                .put('/profile')
                .send({ darkMode: true });

            expect(res2).to.redirectTo(constants.mochaTestingUrl + '/login');
        });
    });

    describe('login and do a bad put on profile', function () {
        it('should return 400 OK and an error message', async function () {
            const res = await agent
                .post('/login')
                .send({ name: newUserName, password: newPassword });

            expect(res).to.have.status(200);
            const res2 = await agent
                .put('/profile')
                .send({ darkMode: "true" });

            expect(res2).to.have.status(400);
            expect(res2.body).to.deep.equal({ error: "Invalid request." });
        });
    });

});
