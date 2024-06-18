'use strict';

var utils = require('../utils/writer.js');
var Comment = require('../service/CommentService');

module.exports.delete a comment. = function delete a comment. (req, res, next, entryID, commentID) {
  Comment.delete a comment.(entryID, commentID)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.edit_comment = function edit_comment (req, res, next, entryID, commentID) {
  Comment.edit_comment(entryID, commentID)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.flag_comment = function flag_comment (req, res, next, entryID, commentID) {
  Comment.flag_comment(entryID, commentID)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.get_comments = function get_comments (req, res, next, entryID) {
  Comment.get_comments(entryID)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.post_comment = function post_comment (req, res, next, entryID) {
  Comment.post_comment(entryID)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
