"use strict";

import { expect, use } from 'chai';  // Creates local variables `expect` and `use`; useful for plugin use
import chaiHttp from "chai-http";
const chai = use(chaiHttp);


const constants = (await import('../helpers/constants.js')).default;
const mongoose = (await import("mongoose")).default;
const User = (await import('../models/user.js')).default;

const newUserName = "test-" + Math.random();
const newEmail = newUserName + "@example.com";
const newPassword = Math.random() + "-" + Math.random();
let newUserPrivateProfile;
let newUserPublicInfo;
let newUserBasicInfo;

const agent = chai.request.agent(constants.mochaTestingUrl);

before(async function () {
    mongoose.connect(constants.databaseURI, { dbName: constants.dbName })
        .then(() => console.log('Database Connected'))
        .catch(() => console.log("Database not conected"))

})

after(async function () {
    // await User.deleteOne({ userName: newUserName }); // accumulate a few for pagination testing
    mongoose.disconnect();
})

describe('Register a new randomly generated user', function () {
    it('should return a 201 created and a user.privateProfile() with the given userName and email', function (done) {
        agent
            .post('/register')
            .send({ userName: newUserName, email: newEmail, password: newPassword })
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(201);
                expect(res.body).to.be.an('object');
                expect(res.body.userName).to.equal(newUserName);
                expect(res.body.email).to.equal(newEmail);
                expect(res.body.userID).to.be.a('string').with.lengthOf(24);
                expect(res.body.bio).to.equal("I haven't decided what to put in my bio yet.");
                expect(res.body.publishEmail).to.equal(false);
                expect(res.body.darkMode).to.equal(false);
                expect(res.body.publishedEntries).to.be.an('array');
                expect(res.body.publishedEntries).to.have.lengthOf(0);
                newUserPrivateProfile = res.body;
                {
                    const { userID, userName, email, publishEmail, bio, publishedEntries } = newUserPrivateProfile;
                    newUserPublicInfo = { userID, userName, email: publishEmail ? email : "", bio, publishedEntries };
                    newUserBasicInfo = { userID, userName };
                }
                done();
            });
    })
})

describe('Register a user with a duplicate userName', function () {
    it('should return a 409 conflict status code', function (done) {
        agent
            .post('/register')
            .send({ userName: 'Freddy', email: 'notAdupe@example.com', password: "notAsecret" })
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(409);
                expect(res.body).to.deep.equal({ error: "Username already in use." })
                done()
            })
    })
})

describe('Register a user with a duplicate email', function () {
    it('should return a 409 conflict status code', function (done) {
        agent
            .post('/register')
            .send({ userName: 'notAdupe', email: 'Freddy@example.com', password: "notAsecret" })
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(409);
                expect(res.body).to.deep.equal({ error: "Email already in use." });
                done();
            })
    })
})

describe('Register a user with no userName', function () {
    it('should return a 400 bad request status code', function (done) {
        agent
            .post('/register')
            .send({ email: 'notAdupe@example.com', password: "notAsecret" })
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                expect(res.body).to.deep.equal({ error: "Missing userName." });
                done();
            })
    })
})

describe('Register a user with no email', function () {
    it('should return a 400 bad request status code', function (done) {
        agent
            .post('/register')
            .send({ userName: 'notAdupe', password: "notAsecret" })
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                expect(res.body).to.deep.equal({ error: "Missing email." });
                done();
            })
    })
})

describe('Register a user with no password', function () {
    it('should return a 400 bad request status code', function (done) {
        agent
            .post('/register')
            .send({ userName: 'notAdupe', email: "notAdupe@example.com" })
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                expect(res.body).to.deep.equal({ error: "Missing password." });
                done();
            })
    })
})

describe('login by userName', function () {
    it('should return a 200 ok and return a user.privateProfile() with the given userName', function (done) {
        agent
            .post('/login')
            .send({ name: newUserName, password: newPassword })
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                expect(res).to.have.cookie('connect.sid');
                expect(res).to.have.cookie('token');
                expect(res.body).to.deep.equal(newUserPrivateProfile);
                done();
            })
    })
})

describe('login by email', function () {
    it('should return a 200 ok and return a user.privateProfile() with the given email', function (done) {
        agent
            .post('/login')
            .send({ name: newEmail, password: newPassword })
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                expect(res.body).to.deep.equal(newUserPrivateProfile);
                done();
            })
    })
})

describe('login with nonexistant userName/email', function () {
    it('should return a 401 unauthorized and an error message', function (done) {
        agent
            .post('/login')
            .send({ name: 'Fredddy@example.com', password: "s33krit!" })
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(401);
                expect(res.body).to.deep.equal({ error: "Incorrect name or password." });
                done();
            })
    })
})

describe('login with bad password', function () {
    it('should return a 401 unauthorized and an error message', function (done) {
        agent
            .post('/login')
            .send({ name: 'Freddy@example.com', password: "s333krit!" })
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(401);
                expect(res.body).to.deep.equal({ error: "Incorrect name or password." });
                done();
            })
    })
})

describe('login with missing name', function () {
    it('should return a 400 bad request and an error message', function (done) {
        agent
            .post('/login')
            .send({ password: "s33krit!" })
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                expect(res.body).to.deep.equal({ error: "Missing name." });
                done();
            })
    })
})

describe('login with missing password', function () {
    it('should return a 400 bad request and an error message', function (done) {
        agent
            .post('/login')
            .send({ name: "Freddy" })
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                expect(res.body).to.deep.equal({ error: "Missing password." });
                done();
            })
    })
})

describe('get users', function () {
    it('should return a 200 OK and an array of users.basicInfo()', function (done) {
        agent
            .get('/user')
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                expect(res.body).to.be.an('array');
                for (const user of res.body) {
                    expect(user.userID).to.be.a('string').with.lengthOf(24);
                    expect(user.userName).to.be.a('string');
                }
                done();
            })
    })
})

describe('get user by userID', function () {
    it('should return a 200 OK and the user.publicInfo()', function (done) {
        agent
            .get('/user/' + newUserPrivateProfile.userID)
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                expect(res.body).to.deep.equal(newUserPublicInfo);
                done()
            })
    })
})

describe('get user by nonexistant userID', function () {
    it('should return a 404 not found and an error message', function (done) {
        agent
            .get('/user/000000000000000000000000')
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(404);
                expect(res.body).to.deep.equal({ error: "There is no user with that user ID." });
                done()
            })
    })
})

describe('get user by badly formed userID', function () {
    it('should return a 400 bad request and an error message', function (done) {
        agent
            .get('/user/notANidSTRING')
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(400);
                expect(res.body).to.deep.equal({ error: "That is not a properly formatted userID." });
                done();
            })
    })
})

describe('post logout', function () {
    it('should return a 200 ok and a response message', function (done) {
        agent
            .post('/logout')
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                expect(res.body).to.deep.equal({ message: "Logout successful." });
                done();
            })
    })
})

describe('login and get profile', function () {
    it('should return 200 OK and logged in users.privateProfile()', function (done) {
        agent
            .post('/login')
            .send({ name: newUserName, password: newPassword })
            .end(function (err, res) {
                expect(err).to.be.null;
                agent
                    .get('/profile')
                    .end(function (err, res) {
                        expect(err).to.be.null;
                        expect(res).to.have.status(200);
                        expect(res.body).to.deep.equal(newUserPrivateProfile);
                        done();
                    })
            });
    });
});

describe('logout and get profile', function () {
    it('should return 200 OK and logged in users.privateProfile()', function (done) {
        agent
            .post('/logout')
            .end(function (err, res) {
                expect(err).to.be.null;
                agent
                    .get('/profile')
                    .end(function (err, res) {
                        expect(err).to.be.null;
                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                        done();
                    })
            });
    });
});

describe('login and put profile', function () {
    it('should return 200 OK and logged in users.privateProfile()', function (done) {
        agent
            .post('/login')
            .send({ name: newUserName, password: newPassword })
            .end(function (err, res) {
                expect(err).to.be.null;
                agent
                    .put('/profile')
                    .send({ darkMode: !newUserPrivateProfile.darkMode })
                    .end(function (err, res) {
                        expect(err).to.be.null;
                        expect(res).to.have.status(200);
                        newUserPrivateProfile.darkMode = !newUserPrivateProfile.darkMode;
                        expect(res.body).to.deep.equal(newUserPrivateProfile);
                        done();
                    })
            });
    });
});

describe('logout and put profile', function () {
    it('should return 200 OK and logged in users.privateProfile()', function (done) {
        agent
            .post('/logout')
            .end(function (err, res) {
                expect(err).to.be.null;
                agent
                    .put('/profile')
                    .send({ darkMode: true })
                    .end(function (err, res) {
                        expect(err).to.be.null;
                        expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                        done();
                    })
            });
    });
});

describe('login and do a bad put on profile', function () {
    it('should return 400 OK and an error message', function (done) {
        agent
            .post('/login')
            .send({ name: newUserName, password: newPassword })
            .end(function (err, res) {
                expect(err).to.be.null;
                agent
                    .put('/profile')
                    .send({ darkMode: "true" })
                    .end(function (err, res) {
                        expect(err).to.be.null;
                        expect(res).to.have.status(400);
                        expect(res.body).to.deep.equal({error: "Invalid request."});
                        done();
                    })
            });
    });
});

