'use strict';


/**
 * Get a list of defined keywords
 * Get a list of all used keywords, sorted alphabetically or by use count. If a query string is used, return only matching keywords.
 *
 * no response value expected for this operation
 **/
exports.get_keyword_list = function() {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Get a list of entries selected and sorted by query string.
 * Get a list of entries selected and sorted by query string. Default to all entries sorted by newest first.
 *
 * no response value expected for this operation
 **/
exports.get_search_results = function() {
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

