'use strict';

var utils = require('../utils/writer.js');
var Story = require('../service/StoryService');

module.exports.get_new_story_page = function get_new_story_page (req, res, next) {
  Story.get_new_story_page()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.post_story = function post_story (req, res, next) {
  Story.post_story()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
