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
    expectMongoObjectId,
} = globals;


describe('Test the user handling routes', function () {
    this.slow(1000);

    describe('Test the POST /register route', function () {
        describe('Happy paths', function () {
            describe('POST /register with unique userName, unique email, and password', function () {
                it('should return 201 created and the new user\'s privateProfile()', async function () {
                    const res = await agent
                        .post('/register')
                        .send({ userName: 'test' + newUserName, email: 'test' + newEmail, password: newPassword });

                    expect(res).to.have.status(201);
                    expect(res.body).to.be.an('object');
                    expect(res.body.userName).to.equal('test' + newUserName);
                    expect(res.body.email).to.equal('test' + newEmail);
                    expectMongoObjectId(res.body.userId);
                    expect(res.body.bio).to.equal("I haven't decided what to put in my bio yet.");
                    expect(res.body.publishEmail).to.equal(false);
                    expect(res.body.darkMode).to.equal(false);
                    expect(res.body.publishedEntries).to.be.an('array').with.lengthOf(0);

                });;
            });;
        });

        describe('Sad paths', function () {
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
        });

    });

    describe('Test the POST /login route', function () {
        describe('Happy paths', function () {
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
        });

        describe('Sad paths', function () {
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
        });
    });

    describe('Test the GET /users route', function () {
        describe('Happy paths', function () {
            describe('get users', function () {
                it('should return a 200 OK and an array of users.publicInfo() with no more than constants.entriesPerPage entries', async function () {
                    const res = await agent
                        .get('/user');

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array').with.lengthOf.at.most(constants.entriesPerPage);
                    for (const user of res.body) {
                        expectMongoObjectId(user.userId);
                        expect(user.userName).to.be.a('string');
                        expect(user.email).to.be.a('string');
                        expect(user.bio).to.be.a('string');
                        expect(user.publishedEntries).to.be.an('array')
                    }
                })
            })

            describe('get users with query string {regex: F}', function () {
                it('should return a 200 OK and an array of users.publicInfo() with each userName including an F', async function () {
                    const res = await agent
                        .get('/user')
                        .query({ regex: 'F' });

                    expect(res).to.have.status(200);
                    expect(res.body).to.be.an('array');
                    for (const user of res.body) {
                        expectMongoObjectId(user.userId);
                        expect(user.userName).to.be.a('string').that.matches(/F/);
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
                        expectMongoObjectId(user.userId);
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
                        expectMongoObjectId(user.userId);
                        expect(user.userName).to.be.a('string');
                        expect(user.email).to.be.a('string');
                        expect(user.bio).to.be.a('string');
                        expect(user.publishedEntries).to.be.an('array')
                    }
                })
            })
        });

        describe('Sad paths', function () {
            describe('search for a nonexistant userName', function () {
                it('should return a 404 not found and an error message', async function () {
                    const res = await agent
                        .get('/user')
                        .query({ regex: "This is not a userName 1234567890" });

                    expect(res).to.have.status(404);
                    expect(res.body).to.deep.equal({ error: "No matching users found." });
                });
            });
        });
    });

    describe('Test the GET /user/:userId route', function () {
        describe('Happy paths', function () {
            describe('get user by userId', function () {
                it('should return a 200 OK and the user.publicInfo()', async function () {
                    const res = await agent
                        .get('/user/' + newUserPrivateProfile().userId);

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal(newUserPublicInfo());
                })
            })
        });

        describe('Sad paths', function () {
            describe('get user by nonexistant userId', function () {
                it('should return a 404 not found and an error message', async function () {
                    const res = await agent
                        .get('/user/000000000000000000000000');

                    expect(res).to.have.status(404);
                    expect(res.body).to.deep.equal({ error: "There is no user with that userId." });
                })
            })

            describe('get user by badly formed userId', function () {
                it('should return a 400 bad request and an error message', async function () {
                    const res = await agent
                        .get('/user/notANidSTRING');

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "That is not a properly formatted userId." });
                })
            })
        });
    });

    describe('Test the POST /user/:userId/follow route', function () {
        describe('Happy paths', function () {
            describe('Login and POST /user/668490250029a28118a8d1be/follow', function () {
                it('should return 200 ok and a success message', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .post('/user/668490250029a28118a8d1be/follow');

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal({ message: "Follow successful." });
                });
            });
        });

        describe('Sad paths', function () {
            describe('POST /user/668490250029a28118a8d1be/follow when not logged in', function () {
                it('should redirect to /login', async function () {
                    const logoutRes = await agent
                        .post('/logout');

                    expect(logoutRes).to.have.status(200);

                    const res = await agent
                        .post('/user/668490250029a28118a8d1be/follow');

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                });
            });

            describe('Login and POST /user/blarg/follow', function () {
                it('should return a 400 status and an error message', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .post('/user/blarg/follow');

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "That is not a properly formatted userId." });
                });
            });

            describe('Login and POST /user/000000000000000000000000/follow', function () {
                it('should return a 404 status and an error message', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .post('/user/000000000000000000000000/follow');

                    expect(res).to.have.status(404);
                    expect(res.body).to.deep.equal({ error: "There is no user with that userId." })
                });
            });

            describe('Login and POST /user/{ownUserId}/follow', function () {
                it('should return a 409 status and an error message', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .post('/user/' + loginRes.body.userId + '/follow');

                    expect(res).to.have.status(409);
                    expect(res.body).to.deep.equal({ error: "Following yourself means you're going around in circles." })
                });
            });

            describe('Login and POST /user/668490250029a28118a8d1be/follow again', function () {
                it('should return a 409 status and an error message', async function () {
                    const loginRes = await agent
                        .post('/login')
                        .send({ name: newUserName, password: newPassword });

                    expect(loginRes).to.have.status(200);

                    const res = await agent
                        .post('/user/668490250029a28118a8d1be/follow');

                    expect(res).to.have.status(409);
                    expect(res.body).to.deep.equal({ error: "You are already following that user." })
                });
            });
        });
    });

    describe('Test POST /logout path', function () {
        it('should return a 200 ok and a response message', async function () {
            const res = await agent
                .post('/logout');

            expect(res).to.have.status(200);
            expect(res.body).to.deep.equal({ message: "Logout successful." });
        })
    })

    describe('Test GET /profile path', function () {
        describe('Happy paths', function () {
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
        });

        describe('Sad paths', function () {
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
        });
    });

    describe('Test PUT /profile path', function () {
        describe('Happy paths', function () {
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
        });

        describe('Sad paths', function () {
            describe('logout and put profile', function () {
                it('should redirect to /login', async function () {
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
                        .send({ darkMode: "notAboolean" });

                    expect(res2).to.have.status(400);
                    expect(res2.body).to.deep.equal({ error: "Invalid request." });
                });
            });
        });
    });



});
