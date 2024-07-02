"use strict";
const jwt = require("jsonwebtoken");
const process = require('process');
require("dotenv").config();

function jwtAuth(req, res, next)  {
  const token = req.cookies.token;
  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    req.user = user;
    next();
  } catch {
    res.clearCookie("token");
    return res.redirect("/login");
  }
};

module.exports.jwtAuth = jwtAuth;