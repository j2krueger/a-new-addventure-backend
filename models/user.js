"use strict";

const constants = require('../helpers/constants');
const { mongoose } = constants;
const { Schema } = mongoose;
const { randomBytes } = require('crypto');
const { sendVerificationEmailHelper } = require('../helpers/mail');

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
  locked: {
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
  emailVerified: {
    type: Boolean,
    default: false,
  },
  emailVerificationKey: {
    type: String,
  },
  resetPasswordKey: {
    type: String,
  },
  resetPasswordTime: {
    type: Date,
  },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

userSchema.virtual('publishedChapters', {
  ref: 'Chapter',
  localField: 'userName',
  foreignField: 'authorName'
});

userSchema.virtual('followedAuthors', {
  ref: 'Follow',
  localField: '_id',
  foreignField: 'follower',
});

userSchema.virtual('likedChapters', {
  ref: 'Like',
  localField: '_id',
  foreignField: 'user'
});

userSchema.virtual('bookmarkedChapters', {
  ref: 'Bookmark',
  localField: '_id',
  foreignField: 'user'
});

userSchema.statics.findByIdAndPopulate = async function findByIdAndPopulate(id) {
  const result = await User.findById(id)
    .populate({
      path: 'followedAuthors',
      populate: { path: 'following' },
      transform: follow => {
        if (follow?.following?.userName) {
          return { userName: follow.following.userName, userId: follow.following._id };
        } else {
          return null;
        }
      },
    })
    .populate({
      path: 'publishedChapters',
      limit: constants.resultsPerPage,
      options: { sort: { createDate: -1 } },
      populate: 'likes',
      transform: chapter => chapter.summary(),
    })
    .populate({
      path: 'likedChapters',
      populate: { path: 'chapter', populate: { path: 'authorId' } },
      transform: like => {
        if (like?.chapter) {
          const summary = like.chapter?.summary(); summary.authorId = summary?.authorId?._id; return summary;
        } else {
          return null;
        }
      }
    })
    .populate({
      path: 'bookmarkedChapters',
      populate: { path: 'chapter', populate: { path: 'authorId' } },
      transform: bookmark => {
        if (bookmark?.chapter) {
          const summary = bookmark.chapter.summary(); summary.authorId = summary.authorId._id; return summary;
        } else {
          return null;
        }
      }
    });
  if (result) {
    result.followedAuthors.sort((a, b) => {
      const al = a.userName.toLowerCase(), bl = b.userName.toLowerCase();
      return (al < bl) ? -1 : (al > bl) ? 1 : 0;
    });
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
      path: 'publishedChapters',
      limit: constants.resultsPerPage,
      options: { sort: { createDate: -1 } },
      transform: chapter => chapter.summary(),
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
    locked: this.locked,
    emailVerified: this.emailVerified,
    publishedChapters: this.publishedChapters || [],
    followedAuthors: this.followedAuthors || [],
    likedChapters: this.likedChapters || [],
    bookmarkedChapters: this.bookmarkedChapters || [],
  };
}

userSchema.methods.publicInfo = function publicInfo() {
  return {
    userId: this._id,
    userName: this.userName,
    email: this.publishEmail && this.emailVerified ? this.email : "",
    bio: this.bio,
    publishedChapters: this.publishedChapters || [],
  };
}

userSchema.methods.basicInfo = function basicInfo() {
  return { userId: this._id, userName: this.userName };
}

const userSettable = {
  email: "string",
  bio: "string",
  publishEmail: "boolean",
  darkMode: "boolean",
}

userSchema.methods.unverifyEmail = async function unverifyEmail() {
  this.emailVerified = false;
  this.emailVerificationKey = randomBytes(10).toString('hex');
  await sendVerificationEmailHelper(this);
}

userSchema.methods.applySettings = async function applySettings(settings) {
  console.log(`Settings: set to ${JSON.stringify(settings, null, 4)}`);
  for (const key in settings) {
    if (!(key in userSettable && typeof settings[key] == userSettable[key])) {
      const error = new Error("Invalid request.");
      error.code = 400;
      throw error;
    }
  }
  if (settings.email) {
    if (settings.email == this.email) {
      delete settings.email;
    } else {
      const result = await User.findOne({ email: settings.email });
      if (result) {
        const error = new Error("Invalid request: That email is already in use.");
        error.code = 409;
        throw error;
      }
    }
  }
  for (const key in settings) {
    this[key] = settings[key];
  }
  if (settings.email) {
    this.unverifyEmail();
  }
  return (await this.save());
}

const adminSettable = {
  admin: "boolean",
  moderator: "boolean",
  bio: "string",
  publishEmail: "boolean",
  emailVerified: "boolean",
}

userSchema.methods.adminApplySettings = async function adminApplySettings(settings) {
  for (const key in settings) {
    if (!(key in adminSettable && typeof settings[key] == adminSettable[key])) {
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