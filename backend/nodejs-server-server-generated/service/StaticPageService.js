'use strict';


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

