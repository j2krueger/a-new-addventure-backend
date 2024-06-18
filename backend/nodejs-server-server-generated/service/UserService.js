'use strict';


/**
 * Get statically served login page.
 * Get the statically served login page, with text boxes for username and password.
 *
 * no response value expected for this operation
 **/
exports.get_login_page = function() {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Get user's profile.
 * If a user is logged in, get that user's settings from the server, and show them on the page. If no user is logged in, check localStorage for basic settings (light/dark mode, blocked tags) otherwise use default basic settings. Can be used to change settings.
 *
 * no response value expected for this operation
 **/
exports.get_profile_page = function() {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Get a user's public profile.
 * Get a webpage showing the specified user's public profile, including username, bio, email if user has decided to make that public, links to entries and comments, etc.
 *
 * userID  the ID of the user
 * no response value expected for this operation
 **/
exports.get_public_profile = function(userID) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Get registration page.
 * Get the statically served registration page, with text boxes for username, email address, and password.
 *
 * no response value expected for this operation
 **/
exports.get_registration_page = function() {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Get a list of users, sorted alphabetically.
 * Get a list of users, sorted alphabetically. If there's a query string, only return the users whose usernames contain that query string. Each name should be linked to it's respective public profile.
 *
 * no response value expected for this operation
 **/
exports.get_users = function() {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Login user
 * Post the username and password, and if they match, log the user in.
 *
 * body Login Submit a request to login (optional)
 * no response value expected for this operation
 **/
exports.login_user = function(body) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Logout the logged in user.
 * Logout the logged in user. Posted by a button on the users profile page, or from the user menu.
 *
 * no response value expected for this operation
 **/
exports.logout_user = function() {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Post changes to user's profile.
 * If a user is logged in, put the changed settings to the server, otherwise store them in localStorage.
 *
 * no response value expected for this operation
 **/
exports.put_profile = function() {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Register a new user
 * Register a new user by posting a new username, an email address, and a password. Check for unique username, send verification email, and store password.
 *
 * body Register Submit a request to register a user (optional)
 * no response value expected for this operation
 **/
exports.register_user = function(body) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}

