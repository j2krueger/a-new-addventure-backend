'use strict';


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

