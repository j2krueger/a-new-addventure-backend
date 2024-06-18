'use strict';

var utils = require('../utils/writer.js');
var StaticPage = require('../service/StaticPageService');

module.exports.get_new_story_page = function get_new_story_page (req, res, next) {
  StaticPage.get_new_story_page()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
