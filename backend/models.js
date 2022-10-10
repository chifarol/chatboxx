const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const { isEmail } = require("validator");
const Schema = mongoose.Schema;

require("./connection");

// const DmActivitySchema = new mongoose.Schema([Number,String])
// const RoomActivitySchema = new mongoose.Schema([Number,String])
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Can't be blank"],
    unique: true,
  },
  email: {
    type: String,
    lowercase: true,
    unique: true,
    required: [true, "Can't be blank"],
    validate: [isEmail, "invalid email"],
  },
  bio: {
    type: String,
    default: "",
  },
  password: {
    type: String,
    required: [true, "Can't be blank"],
    select: false,
  },
  picture: {
    type: String,
    default:
      "https://res.cloudinary.com/chifarol/image/upload/v1664278102/ChatApp/user/person_FILL1_wght400_GRAD0_opsz48_bdhxq9.png",
  },
  rooms: {
    type: [[]],
    default: [],
  },
  dms: {
    type: [[]],
    default: [],
  },
  blocked: {
    type: [String],
    default: [],
  },
  online: {
    type: Boolean,
    default: false,
  },
});

// add static method to user Model for authenticating by email or username
UserSchema.statics.findByCredentials = async function (
  usernameOrEmail,
  password
) {
  let user = await User.findOne({ email: usernameOrEmail });
  if (!user) {
    user = await User.findOne({ username: usernameOrEmail });
    if (!user) {
      return new Error("invalid credentials");
    }
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return new Error("invalid credentials");
  return user;
};
const RoomMSGSchema = new Schema({
  author: {
    type: UserSchema,
    required: true,
  },
  date: {
    type: Number,
    default: Date.now(),
  },
  body: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  type: {
    type: String,
    default: "normal",
  },
});
const DirectMSGSchema = new Schema({
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  date: {
    type: Number,
    default: Date.now(),
  },
  body: {
    type: String,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  mark_read: {
    type: Boolean,
    default: false,
  },
});
const RoomSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  topics: {
    type: [String],
    required: true,
  },
  description: String,
  host: {
    type: UserSchema,
    required: true,
  },
  picture: {
    type: String,
    default:
      "https://res.cloudinary.com/chifarol/image/upload/v1664278309/ChatApp/room/groups_3_FILL1_wght400_GRAD0_opsz48_fxgipg.png",
  },
  members: {
    type: [UserSchema],
    default: [],
  },
  msgs: {
    type: [RoomMSGSchema],
    default: [],
  },
  removed: {
    type: [String],
    default: [],
  },
  left_voluntarily: {
    type: [String],
    default: [],
  },
});

const model = mongoose.model;
const DirectMSG = model("DirectMSG", DirectMSGSchema);
const RoomMSG = model("RoomMSG", RoomMSGSchema);
const Room = model("Room", RoomSchema);
const User = model("User", UserSchema);

module.exports = { model, DirectMSG, RoomMSG, Room, User };
