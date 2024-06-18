'use strict';


/**
 * Delete keywords from an entry.
 * If given keywords are not inherited, admins, mods, and the entry creator get the keyword deleted immediately, anyone else gets keyword deletion request submitted to mod queue.
 *
 * entryID  the ID of the entry
 * keyword  a keyword
 * no response value expected for this operation
 **/
exports.delete_keywords = function(entryID,keyword) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


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
 * Get list of keywords on entry.
 * Gets a list of the keywords applied to the entry. Special keywords first, then non-special inherited keywords, then non-special non-inherited keywords.
 *
 * entryID  the ID of the entry
 * keyword  a keyword
 * no response value expected for this operation
 **/
exports.get_keywords = function(entryID,keyword) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Post new keywords to an entry
 * Posts one or more keywords to be applied to an existing entry. Admins, mods, and creating author get their new keywords automatically applied, anyone else gets their keywords submitted to a mod queue.
 *
 * entryID  the ID of the entry
 * keyword  a keyword
 * no response value expected for this operation
 **/
exports.post_new_keywords = function(entryID,keyword) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}

