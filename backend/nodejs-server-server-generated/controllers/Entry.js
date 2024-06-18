'use strict';

var utils = require('../utils/writer.js');
var Entry = require('../service/EntryService');

module.exports.delete a comment. = function delete a comment. (req, res, next, entryID, commentID) {
  Entry.delete a comment.(entryID, commentID)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.delete_entry = function delete_entry (req, res, next, entryID) {
  Entry.delete_entry(entryID)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.delete_keywords = function delete_keywords (req, res, next, entryID, keyword) {
  Entry.delete_keywords(entryID, keyword)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.edit_comment = function edit_comment (req, res, next, entryID, commentID) {
  Entry.edit_comment(entryID, commentID)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.edit_entry = function edit_entry (req, res, next, entryID) {
  Entry.edit_entry(entryID)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.flag_comment = function flag_comment (req, res, next, entryID, commentID) {
  Entry.flag_comment(entryID, commentID)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.flag_entry = function flag_entry (req, res, next, entryID) {
  Entry.flag_entry(entryID)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.get_comments = function get_comments (req, res, next, entryID) {
  Entry.get_comments(entryID)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.get_entry_by_id = function get_entry_by_id (req, res, next, entryID) {
  Entry.get_entry_by_id(entryID)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.get_entry_list = function get_entry_list (req, res, next) {
  Entry.get_entry_list()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.get_keywords = function get_keywords (req, res, next, entryID, keyword) {
  Entry.get_keywords(entryID, keyword)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.get_new_entry_page = function get_new_entry_page (req, res, next) {
  Entry.get_new_entry_page()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.get_new_story_page = function get_new_story_page (req, res, next) {
  Entry.get_new_story_page()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.get_search_results = function get_search_results (req, res, next) {
  Entry.get_search_results()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.post_comment = function post_comment (req, res, next, entryID) {
  Entry.post_comment(entryID)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.post_entry = function post_entry (req, res, next, entryID) {
  Entry.post_entry(entryID)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.post_new_keywords = function post_new_keywords (req, res, next, entryID, keyword) {
  Entry.post_new_keywords(entryID, keyword)
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};

module.exports.post_story = function post_story (req, res, next) {
  Entry.post_story()
    .then(function (response) {
      utils.writeJson(res, response);
    })
    .catch(function (response) {
      utils.writeJson(res, response);
    });
};
