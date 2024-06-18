'use strict';


/**
 * Delete a comment.
 * Delete a comment. Admin/mod/comment creator only.
 *
 * entryID  the ID of the entry
 * commentID  the ID of the comment
 * no response value expected for this operation
 **/
exports.delete a comment. = function(entryID,commentID) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Delete an entry
 * Delete an entry entirely if there are no continuations, otherwise deletes choice text, entry title, deletable keywords, and entry text. Can only be done by admins, mods, and the creating user.
 *
 * entryID  the ID of the entry
 * no response value expected for this operation
 **/
exports.delete_entry = function(entryID) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


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
 * Edit a comment.
 * Edit a comment. Admin/mod/comment creator only.
 *
 * entryID  the ID of the entry
 * commentID  the ID of the comment
 * no response value expected for this operation
 **/
exports.edit_comment = function(entryID,commentID) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Edit an entry
 * Edit an entry's choice text, entry title, keywords, and entry text. Can only be done by admins, mods, and the user who created the entry.
 *
 * entryID  the ID of the entry
 * no response value expected for this operation
 **/
exports.edit_entry = function(entryID) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Post a flag for review on a comment
 * Post a flag for review on a comment, inserted into mod queue
 *
 * entryID  the ID of the entry
 * commentID  the ID of the comment
 * no response value expected for this operation
 **/
exports.flag_comment = function(entryID,commentID) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Flag an entry for review
 * Post a flag for review, to be entered into a moderation queue. Must include reason for flagging.
 *
 * entryID  the ID of the entry
 * no response value expected for this operation
 **/
exports.flag_entry = function(entryID) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Get comments posted to an entry
 * Get a list of the comments that have been posted to an entry. Each comment entry will have the username of the user who posted it attatched.
 *
 * entryID  the ID of the entry
 * no response value expected for this operation
 **/
exports.get_comments = function(entryID) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * GET the page showing a particular entry
 * Gets the entry title, author, keywords, date, text, and choice texts, formatted in HTML.
 *
 * entryID  the ID of the entry
 * no response value expected for this operation
 **/
exports.get_entry_by_id = function(entryID) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * GET a list of recent entries
 * Gets a list of recent entries, showing story title, entry title, author, and date for each one.
 *
 * no response value expected for this operation
 **/
exports.get_entry_list = function() {
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
 * GET the page for entering a new entry
 * Gets the page presented to the user for entering a continuation of an existing entry. Requested from, is inserted into, and posts to, /entry/{entryID}. Has textboxes for choice text, entry title, keywords, and entry text.
 *
 * no response value expected for this operation
 **/
exports.get_new_entry_page = function() {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * GET the page for entering a new story
 * Gets the static page presented to the user for entering a new story with text boxes for story title, entry title, keywords, and story text. Result POSTs to /entry.
 *
 * no response value expected for this operation
 **/
exports.get_new_story_page = function() {
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
 * Post a new comment.
 * Post a new comment to an entry. Any logged in user.
 *
 * entryID  the ID of the entry
 * no response value expected for this operation
 **/
exports.post_comment = function(entryID) {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}


/**
 * Post a continuation of entry {entryID}
 * Post a new entry continuing entry {entryID} including choice text, entry title, keywords, and entry text.
 *
 * entryID  the ID of the entry
 * no response value expected for this operation
 **/
exports.post_entry = function(entryID) {
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


/**
 * Post a new story
 * Post the title, author, keywords, and text of an entry to start a new story.
 *
 * no response value expected for this operation
 **/
exports.post_story = function() {
  return new Promise(function(resolve, reject) {
    resolve();
  });
}

