'use strict';

var utils = require('../utils/writer.js');
var Flag = require('../service/FlagService');

module.exports.flag_comment = function flag_comment (req, res, next, entryID, commentID) {
  Flag.flag_comment(entryID, commentID)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
