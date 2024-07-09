"use strict";

import { expect, use } from 'chai';  // Creates local variables `expect` and `use`; useful for plugin use
import chaiHttp from "chai-http";
const chai = use(chaiHttp);

const constants = (await import('../helpers/constants.js')).default;
const mongoose = (await import("mongoose")).default;
const User = (await import('../models/user.js')).default;

const newUser = "test-" + Math.random();
const newEmail = newUser + "@example.com";
const newPassword = Math.random() + "-" + Math.random();

before(async function () {
    mongoose.connect(constants.databaseURI, { dbName: constants.dbName })
        .then(() => console.log('Database Connected'))
        .catch(() => console.log("Database not conected"))

})

after(async function () {
    // const newUserEntry = await User.findOne({ userName: newUser });
    await User.deleteOne({ userName: newUser });
    mongoose.disconnect();
})

describe('Register a new randomly generated user', function () {
    it('should return a 201 created and a user.privateProfile() with the given userName and email', function (done) {
        chai.request.execute(constants.mochaTestingUrl)
            .post('/register')
            .send({ userName: newUser, email: newEmail, password: newPassword })
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(201);
                expect(res.body).to.be.an('object');
                expect(res.body.userName).to.equal(newUser);
                expect(res.body.email).to.equal(newEmail);
                expect(res.body.userID).to.be.a('string');
                expect(res.body.userID).to.have.lengthOf(24);
                expect(res.body.bio).to.equal("I haven't decided what to put in my bio yet.");
                expect(res.body.publishEmail).to.equal(false);
                expect(res.body.darkMode).to.equal(false);
                expect(res.body.publishedEntries).to.be.an('array');
                expect(res.body.publishedEntries).to.have.lengthOf(0);
                done();
            });
    })
})

describe('Register a user with a duplicate userName', function () {
    it('should return a 409 conflict status code', function (done) {
        chai.request.execute(constants.mochaTestingUrl)
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
        chai.request.execute(constants.mochaTestingUrl)
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
        chai.request.execute(constants.mochaTestingUrl)
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
        chai.request.execute(constants.mochaTestingUrl)
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
        chai.request.execute(constants.mochaTestingUrl)
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
        chai.request.execute(constants.mochaTestingUrl)
            .post('/login')
            .send({ name: 'Freddy', password: "s33krit!" })
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                expect(res.body).to.be.an('object');
                expect(res.body.userName).to.equal('Freddy');
                expect(res.body.email).to.equal('Freddy@example.com');
                expect(res.body.userID).to.equal('668490250029a28118a8d1be');
                expect(res.body.bio).to.equal('I HAVE decided what to put in my bio yet.');
                expect(res.body.publishEmail).to.equal(true);
                expect(res.body.darkMode).to.equal(false);
                expect(res.body.publishedEntries).to.be.an('array');
                done();
            })
    })
})

describe('login by email', function () {
    it('should return a 200 ok and return a user.privateProfile() with the given email', function (done) {
        chai.request.execute(constants.mochaTestingUrl)
            .post('/login')
            .send({ name: 'Freddy@example.com', password: "s33krit!" })
            .end(function (err, res) {
                expect(err).to.be.null;
                expect(res).to.have.status(200);
                expect(res.body).to.be.an('object');
                expect(res.body.userName).to.equal('Freddy');
                expect(res.body.email).to.equal('Freddy@example.com');
                expect(res.body.userID).to.equal('668490250029a28118a8d1be');
                expect(res.body.bio).to.equal('I HAVE decided what to put in my bio yet.');
                expect(res.body.publishEmail).to.equal(true);
                expect(res.body.darkMode).to.equal(false);
                expect(res.body.publishedEntries).to.be.an('array');
                done();
            })
    })
})

describe('login with nonexistant userName/email', function () {
    it('should return a 401 unauthorized and an error message', function (done) {
        chai.request.execute(constants.mochaTestingUrl)
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
        chai.request.execute(constants.mochaTestingUrl)
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
        chai.request.execute(constants.mochaTestingUrl)
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
        chai.request.execute(constants.mochaTestingUrl)
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

