"use strict";

const { escape, unescape } = require('validator');

// keywords must contain at least one character, and may only contain letters, digits, and the punctuation characters "_", "-", and "."
const keywordRe = /^[\w.-]+$/;

function isValidKeyword(keyword) {
    return typeof keyword == 'string' && keywordRe.test(keyword);
}

function isValidKeywordArray(keywordArray) {
    return Array.isArray(keywordArray) && keywordArray.every(isValidKeyword);
}

module.exports = {
    isValidKeyword,
    isValidKeywordArray,
    escapeHTML: escape,
    unescapeHTML: unescape,
}