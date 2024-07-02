"use strict";

const constants = require('../helpers/constants');
const userAuth = require('../helpers/auth');
const express = require('express');
const router = express.Router();
const cors = require('cors');
const userControllers = require('../controllers/user');


router.use(cors({
    origin: constants.corsAllowURLs,
    credentials: true
}));

//Auth post routers
router.post('/register', userControllers.registerUser);
router.post('/login', userControllers.loginUser);
router.post('/logout', userControllers.logoutUser);
router.get('/user', userControllers.getUser);
router.param('userID', userControllers.paramUserID);
router.get('/user/:userID', userControllers.getUserInfoByID);
router.get('/profile', userAuth, userControllers.getProfile);
router.put('/profile', userAuth, userControllers.putProfile)

if(constants.localDeploy){
    router.get('/sessioncheck', function (req, res) {
        res.status(200).json(req.session);
    });
}


module.exports = router;