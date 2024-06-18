'use strict';

var utils = require('../utils/writer.js');
var Search = require('../service/SearchService');

module.exports.get_keyword_list = function get_keyword_list (req, res, next) {
  Search.get_keyword_list()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.get_search_results = function get_search_results (req, res, next) {
  Search.get_search_results()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.get_users = function get_users (req, res, next) {
  Search.get_users()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
