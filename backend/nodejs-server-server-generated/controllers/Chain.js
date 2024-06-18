'use strict';

var utils = require('../utils/writer.js');
var Chain = require('../service/ChainService');

module.exports.get_chain = function get_chain (req, res, next, entryID) {
  Chain.get_chain(entryID)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
