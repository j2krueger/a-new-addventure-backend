'use strict';

var utils = require('../utils/writer.js');
var Keyword = require('../service/KeywordService');

module.exports.delete_keywords = function delete_keywords (req, res, next, entryID, keyword) {
  Keyword.delete_keywords(entryID, keyword)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.get_keyword_list = function get_keyword_list (req, res, next) {
  Keyword.get_keyword_list()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.get_keywords = function get_keywords (req, res, next, entryID, keyword) {
  Keyword.get_keywords(entryID, keyword)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.post_new_keywords = function post_new_keywords (req, res, next, entryID, keyword) {
  Keyword.post_new_keywords(entryID, keyword)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
