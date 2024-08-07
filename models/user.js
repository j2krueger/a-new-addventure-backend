"use strict";

const mongoose = require('mongoose')
const { Schema } = mongoose
const constants = require('../helpers/constants');

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
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

userSchema.virtual('publishedEntries', {
  ref: 'Entry',
  localField: 'userName',
  foreignField: 'authorName'
})

userSchema.virtual('followedAuthors', {
  ref: 'Follow',
  localField: '_id',
  foreignField: 'follower',
})

userSchema.virtual('likedEntries', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'user'
})

userSchema.statics.findByIdAndPopulate = async function findByIdAndPopulate(id) {
  const result = await User.findById(id)
    .populate({
      path: 'followedAuthors',
      populate: { path: 'following' },
      transform: follow => { return { userName: follow.following.userName, userId: follow.following._id } },
    })
    .populate({
      path: 'publishedEntries',
      limit: constants.entriesPerPage,
      options: { sort: { createDate: -1 } },
      transform: entry => entry.summary(),
    })
    .populate({
      path: 'likedEntries',
      populate: { path: 'entry', populate: { path: 'authorId' } },
      transform: like => {
        if (like?.entry) {
          const summary = like.entry?.summary(); summary.authorId = summary?.authorId?._id; return summary;
        } else {
          return null;
        }
      }
    });
  if (result) {
    result.followedAuthors.sort((a, b) => {
      const al = a.userName.toLowerCase(), bl = b.userName.toLowerCase();
      return (al < bl) ? -1 : (al > bl) ? 1 : 0;
    })
  }
  return result;
}

userSchema.statics.findOneAndPopulate = async function findOneAndPopulate(query) {
  const result = await User.findOne(query)
    .populate({
      path: 'followedAuthors',
      populate: { path: 'following' },
      transform: follow => { return { userName: follow.following.userName, userId: follow.following._id } },
    })
    .populate({
      path: 'publishedEntries',
      limit: constants.entriesPerPage,
      options: { sort: { createDate: -1 } },
      transform: entry => entry.summary(),
    });
  if (result) {
    result.followedAuthors.sort((a, b) => {
      const al = a.userName.toLowerCase(), bl = b.userName.toLowerCase();
      return (al < bl) ? -1 : (al > bl) ? 1 : 0;
    })
  }
  return result;
}
userSchema.statics.findAndPopulate = async function findAndPopulate(query, skip, limit) {
  const result = await User.find(query)
    .collation({ locale: "en" })
    .sort({ userName: 1 })
    .skip(skip)
    .limit(limit)
    .populate({
      path: 'publishedEntries',
      limit: constants.entriesPerPage,
      options: { sort: { createDate: -1 } },
      transform: entry => entry.summary(),
    });
  return result;
}

userSchema.methods.privateProfile = function privateProfile() {
  return {
    userId: this._id,
    userName: this.userName,
    email: this.email,
    admin: this.admin,
    moderator: this.moderator,
    bio: this.bio,
    publishEmail: this.publishEmail,
    darkMode: this.darkMode,
    publishedEntries: this.publishedEntries || [],
    followedAuthors: this.followedAuthors || [],
    likedEntries: this.likedEntries || [],
  };
}

userSchema.methods.publicInfo = function publicInfo() {
  return {
    userId: this._id,
    userName: this.userName,
    email: this.publishEmail ? this.email : "",
    bio: this.bio,
    publishedEntries: this.publishedEntries || [],
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

const User = mongoose.model("User", userSchema);

module.exports = User;