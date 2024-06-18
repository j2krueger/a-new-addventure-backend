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

