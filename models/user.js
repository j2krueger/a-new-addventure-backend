"use strict";

const mongoose = require('mongoose')
const { Schema } = mongoose

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
  }
});

userSchema.methods.privateProfile = function privateProfile() {
  return { userID: this._id, userName: this.userName, email: this.email, bio: this.bio, publishEmail: this.publishEmail };
}

userSchema.methods.publicInfo = function publicInfo() {
  return { userID: this._id, userName: this.userName, email: this.publishEmail ? this.email : "", bio: this.bio };
}

userSchema.methods.basicInfo = function basicInfo() {
  return { userID: this._id, userName: this.userName };
}

/* userSchema.methods.applySettings = function applySettings(settings){

}
 */
const User = mongoose.model("User", userSchema)

module.exports = User