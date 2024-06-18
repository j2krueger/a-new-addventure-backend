'use strict';

var utils = require('../utils/writer.js');
var User = require('../service/UserService');

module.exports.get_login_page = function get_login_page (req, res, next) {
  User.get_login_page()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.get_profile_page = function get_profile_page (req, res, next) {
  User.get_profile_page()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.get_public_profile = function get_public_profile (req, res, next, userID) {
  User.get_public_profile(userID)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.get_registration_page = function get_registration_page (req, res, next) {
  User.get_registration_page()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.get_users = function get_users (req, res, next) {
  User.get_users()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.login_user = function login_user (req, res, next, body) {
  User.login_user(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.logout_user = function logout_user (req, res, next) {
  User.logout_user()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.put_profile = function put_profile (req, res, next) {
  User.put_profile()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.register_user = function register_user (req, res, next, body) {
  User.register_user(body)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
