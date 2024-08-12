"use strict";

import * as globals from './globals.mjs';
const {
    // resources
    expect,
    //  mongoose,
    agent,
    // constants
    constants,
    testString,
    newUserName,
    newEmail,
    newPassword,
    testUserLogin,
    // adminLogin,
    // testStory,
    // testEntry,
    newUserPrivateProfile,
    newUserPublicInfo,
    // newUserBasicInfo,
    // summaryKeys,
    // models
    User,
    // Entry,
    Follow,
    // Message,
    // Like,
    // Flag,
    // Bookmark,
    // functions
    // populateUserInfo,
    expectMongoObjectId,
} = globals;


describe('Test the user handling routes', function () {
    this.slow(1000);

    describe('Test the POST /register route', function () {
        describe('Happy paths', function () {
            describe('POST /register with unique userName, unique email, and password', function () {
                it('should return 201 created and the new user\'s privateProfile()', async function () {
                    const res = await agent.post('/register').send({ userName: 'test' + newUserName, email: 'test' + newEmail, password: newPassword });

                    expect(res).to.have.status(201);
                    expect(res.body.userName).to.equal('test' + newUserName);
                    expect(res.body.email).to.equal('test' + newEmail);
                    expectMongoObjectId(res.body.userId);
                    expect(res.body.bio).to.equal("I haven't decided what to put in my bio yet.");
                    expect(res.body.publishEmail).to.equal(false);
                    expect(res.body.darkMode).to.equal(false);
                    expect(res.body.publishedEntries).to.be.an('array').with.lengthOf(0);

                    await User.findByIdAndDelete(res.userId);
                });
            });
        });

        describe('Sad paths', function () {
            describe('Register a user with a duplicate userName', function () {
                it('should return a 409 conflict status code', async function () {
                    const res = await agent.post('/register').send({ userName: newUserName, email: 'notAdupe@example.com', password: "notAsecret" });

                    expect(res).to.have.status(409);
                    expect(res.body).to.deep.equal({ error: "Username already in use." })
                })
            })

            describe('Register a user with a duplicate email', function () {
                it('should return a 409 conflict status code', async function () {
                    const res = await agent.post('/register').send({ userName: 'notAdupe', email: newEmail, password: "notAsecret" });

                    expect(res).to.have.status(409);
                    expect(res.body).to.deep.equal({ error: "Email already in use." });
                })
            })

            describe('Register a user with no userName', function () {
                it('should return a 400 bad request status code', async function () {
                    const res = await agent.post('/register').send({ email: 'notAdupe@example.com', password: "notAsecret" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Missing userName." });
                })
            })

            describe('Register a user with no email', function () {
                it('should return a 400 bad request status code', async function () {
                    const res = await agent.post('/register').send({ userName: 'notAdupe', password: "notAsecret" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Missing email." });
                })
            })

            describe('Register a user with no password', function () {
                it('should return a 400 bad request status code', async function () {
                    const res = await agent.post('/register').send({ userName: 'notAdupe', email: "notAdupe@example.com" });

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
                    const res = await agent.post('/login').send(testUserLogin);

                    expect(res).to.have.status(200);
                    expect(res).to.have.cookie('connect.sid');
                    expect(res).to.have.cookie('token');
                    
                    console.log('\n   Debug: ', newUserPrivateProfile());
                    expect(res.body).to.deep.equal(newUserPrivateProfile());
                })
            })

            describe('login by email', function () {
                it('should return a 200 ok and return a user.privateProfile() with the given email', async function () {
                    const res = await agent.post('/login').send({ name: newEmail, password: newPassword });

                    expect(res).to.have.status(200);
                    expect(res).to.have.cookie('connect.sid');
                    expect(res).to.have.cookie('token');
                    expect(res.body).to.deep.equal(newUserPrivateProfile());
                })
            })
        });

        describe('Sad paths', function () {
            describe('login with nonexistant userName/email', function () {
                it('should return a 401 unauthorized and an error message', async function () {
                    const res = await agent.post('/login').send({ name: newEmail + "blahblahblah" + testString, password: newPassword });

                    expect(res).to.have.status(401);
                    expect(res.body).to.deep.equal({ error: "Incorrect name or password." });
                })
            })

            describe('login with bad password', function () {
                it('should return a 401 unauthorized and an error message', async function () {
                    const res = await agent.post('/login').send({ name: newUserName, password: newPassword + '!' });

                    expect(res).to.have.status(401);
                    expect(res.body).to.deep.equal({ error: "Incorrect name or password." });
                })
            })

            describe('login with missing name', function () {
                it('should return a 400 bad request and an error message', async function () {
                    const res = await agent.post('/login').send({ password: newPassword });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Missing name." });
                })
            })

            describe('login with missing password', function () {
                it('should return a 400 bad request and an error message', async function () {
                    const res = await agent.post('/login').send({ name: newUserName });

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
                    const res = await agent.get('/user');

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
                    const res = await agent.get('/user').query({ regex: 'F' });

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
                    const res = await agent.get('/user').query({ regex: 'f', i: 1 });

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
                    const res = await agent.get('/user').query({ page: 2 });

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
                    const res = await agent.get('/user').query({ regex: newUserName + newUserName });

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
                    const res = await agent.get('/user/' + newUserPrivateProfile().userId);

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal(newUserPublicInfo());
                })
            })
        });

        describe('Sad paths', function () {
            describe('get user by nonexistant userId', function () {
                it('should return a 404 not found and an error message', async function () {
                    const res = await agent.get('/user/000000000000000000000000');

                    expect(res).to.have.status(404);
                    expect(res.body).to.deep.equal({ error: "There is no user with that userId." });
                })
            })

            describe('get user by badly formed userId', function () {
                it('should return a 400 bad request and an error message', async function () {
                    const res = await agent.get('/user/notANidSTRING');

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
                    const loginRes = await agent.post('/login').send(testUserLogin);

                    const res = await agent.post('/user/668490250029a28118a8d1be/follow');
                    const follow = await Follow.findOne({ follower: loginRes.body.userId });

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal({ message: "Follow successful." });

                    await Follow.findByIdAndDelete(follow._id);
                });
            });
        });

        describe('Sad paths', function () {
            describe('Logout and POST /user/668490250029a28118a8d1be/follow', function () {
                it('should redirect to /login', async function () {
                    await agent.post('/logout');

                    const res = await agent.post('/user/668490250029a28118a8d1be/follow');

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                });
            });

            describe('Login and POST /user/blarg/follow', function () {
                it('should return a 400 status and an error message', async function () {
                    await agent.post('/login').send(testUserLogin);

                    const res = await agent.post('/user/blarg/follow');

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "That is not a properly formatted userId." });
                });
            });

            describe('Login and POST /user/000000000000000000000000/follow', function () {
                it('should return a 404 status and an error message', async function () {
                    await agent.post('/login').send(testUserLogin);

                    const res = await agent.post('/user/000000000000000000000000/follow');

                    expect(res).to.have.status(404);
                    expect(res.body).to.deep.equal({ error: "There is no user with that userId." })
                });
            });

            describe('Login and POST /user/{ownUserId}/follow', function () {
                it('should return a 409 status and an error message', async function () {
                    const loginRes = await agent.post('/login').send(testUserLogin);

                    const res = await agent.post('/user/' + loginRes.body.userId + '/follow');

                    expect(res).to.have.status(409);
                    expect(res.body).to.deep.equal({ error: "Following yourself means you're going around in circles." });
                });
            });

            describe('Login and POST /user/668490250029a28118a8d1be/follow again', function () {
                it('should return a 409 status and an error message', async function () {
                    const loginRes = await agent.post('/login').send(testUserLogin);

                    await agent.post('/user/668490250029a28118a8d1be/follow');
                    const res = await agent.post('/user/668490250029a28118a8d1be/follow');

                    expect(res).to.have.status(409);
                    expect(res.body).to.deep.equal({ error: "You are already following that user." });

                    await Follow.findOneAndDelete({ follower: loginRes.body.userId });
                });
            });
        });
    });

    describe('Test the DELETE /user/:userId/follow rout', function () {
        describe('Happy paths', function () {
            describe('Login, follow a user, and unfollow the user', function () {
                it('should return a 200 status and return a success message.', async function () {
                    await agent.post('/login').send(testUserLogin);
                    await agent.post('/user/668ee23ce1dcd980cf0739f9/follow');

                    const res = await agent.delete('/user/668ee23ce1dcd980cf0739f9/follow');

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal({ message: "Author successfully unfollowed." });
                });
            });
        });

        describe('Sad paths', function () {
            describe('Logout and unfollow', function () {
                it('should redirect to /login', async function () {
                    await agent.post('/logout');

                    const res = await agent.delete('/user/668490250029a28118a8d1be/follow');

                    expect(res).to.redirectTo(constants.mochaTestingUrl + '/login');
                });
            });

            describe('Login and unfollow someone not followed', function () {
                it('should return a 404 status and an error message', async function () {
                    await agent.post('/login').send(testUserLogin);

                    const res = await agent.delete('/user/668ee24be1dcd980cf0739fe/follow');

                    expect(res).to.have.status(404);
                    expect(res.body).to.deep.equal({ error: 'No follow to remove.' })
                });
            });

            describe('Login and unfollow with nonexistant userId', function () {
                it('should return a 404 status and an error message', async function () {
                    await agent.post('/login').send(testUserLogin);

                    const res = await agent.delete('/user/000000000000000000000000/follow');

                    expect(res).to.have.status(404);
                    expect(res.body).to.deep.equal({ error: "There is no user with that userId." })
                });
            });

            describe('Login and unfollow with bad userId', function () {
                it('should return a 400 status and an error message', async function () {
                    await agent.post('/login').send(testUserLogin);

                    const res = await agent.delete('/user/blarg/follow');

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "That is not a properly formatted userId." })
                });
            });
        });
    });

    describe('Test POST /logout path', function () {
        it('should return a 200 ok and a response message', async function () {
            const res = await agent.post('/logout');

            expect(res).to.have.status(200);
            expect(res.body).to.deep.equal({ message: "Logout successful." });
        })
    })

    describe('Test GET /profile path', function () {
        describe('Happy paths', function () {
            describe('login and get profile', function () {
                it('should return 200 OK and logged in users.privateProfile()', async function () {
                    await agent.post('/login').send(testUserLogin);

                    const res = await agent.get('/profile');

                    expect(res).to.have.status(200);
                    expect(res.body.publishedEntries).to.be.an('array');
                    expect(res.body.followedAuthors).to.be.an('array');
                    expect(res.body.likedEntries).to.be.an('array');
                    res.body.publishedEntries = [];
                    res.body.followedAuthors = [];
                    res.body.likedEntries = [];
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
                it('should return 200 OK and logged in users.privateProfile()', async function () {
                    await agent.post('/login').send(testUserLogin);

                    const res = await agent.put('/profile').send({ darkMode: true });
                    const tempNewUserPrivateProfile = newUserPrivateProfile();
                    tempNewUserPrivateProfile.darkMode = !tempNewUserPrivateProfile.darkMode;

                    expect(res).to.have.status(200);
                    expect(res.body).to.deep.equal(tempNewUserPrivateProfile);

                    await agent.put('/profile').send({ darkMode: false });
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
                    await agent.post('/login').send(testUserLogin);

                    const res = await agent.put('/profile').send({ darkMode: "notAboolean" });

                    expect(res).to.have.status(400);
                    expect(res.body).to.deep.equal({ error: "Invalid request." });
                });
            });
        });
    });
});
