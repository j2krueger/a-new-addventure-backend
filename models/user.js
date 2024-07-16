"use strict";

const mongoose = require('mongoose')
const { Schema } = mongoose
const Entry = require('./entry');

const userSchema = new Schema({
  userName: {
    type: String,
    required: [true, "Missing username"],
    unique: [true, "Username already in use"],
  },
  email: {
    type: String,
    required: [true, "Missing email."],
    unique: [true, "Email already in use"],
  },
  passwordHash: {
    type: String,
    required: [true, "Missing password."],
    unique: false,
  },
  admin: {
    type: Boolean,
    default: false,
  },
  moderator: {
    type: Boolean,
    default: false,
  },
  bio: {
    type: String,
    default: "I haven't decided what to put in my bio yet.",
  },
  publishEmail: {
    type: Boolean,
    default: false,
  },
  darkMode: {
    type: Boolean,
    default: false,
  },
});

userSchema.methods.privateProfile = async function privateProfile() {
  return {
    userId: this._id,
    userName: this.userName,
    email: this.email,
    bio: this.bio,
    publishEmail: this.publishEmail,
    darkMode: this.darkMode,
    publishedEntries: (await Entry.find({ authorName: this.userName })).map(entry => entry.summary()),
  };
}

userSchema.methods.publicInfo = async function publicInfo() {
  return {
    userId: this._id,
    userName: this.userName,
    email: this.publishEmail ? this.email : "",
    bio: this.bio,
    publishedEntries: (await Entry.find({ authorName: this.userName })).map(entry => entry.summary()),
  };
}

userSchema.methods.basicInfo = function basicInfo() {
  return { userId: this._id, userName: this.userName };
}


const userSetable = {
  bio: "string",
  publishEmail: "boolean",
  darkMode: "boolean",
}

userSchema.methods.applySettings = async function applySettings(settings) {
  for (const key in settings) {
    if (!(key in userSetable && typeof settings[key] == userSetable[key])) {
      throw new Error("Invalid request.");
    }
  }
  for (const key in settings) {
    this[key] = settings[key];
  }
  return (await this.save());
}

const User = mongoose.model("User", userSchema)

module.exports = User