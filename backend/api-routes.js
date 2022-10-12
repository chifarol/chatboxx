const { model, DirectMSG, RoomMSG, Room, User } = require("./models.js");
//
const { Router } = require("express");
const bcrypt = require("bcrypt");
const slugify = require("slugify");
const jwt = require("jsonwebtoken");
const apiRoutes = Router();
const mongoose = require("mongoose");
const { body, param, header, query } = require("express-validator");
const auth = require("./middleware");
const { updateDMActivity, updateRoomActivity } = require("./utils");
require("dotenv").config();
// get env variables
const {
  ACCESS_TOKEN_SECRET,
  CLOUDINARY_NAME,
  CLOUDINARY_SECRET,
  CLOUDINARY_KEY,
} = process.env;
const cloudinary = require("cloudinary").v2;

// configure cloudinary
cloudinary.config({
  cloud_name: CLOUDINARY_NAME,
  api_key: CLOUDINARY_KEY,
  api_secret: CLOUDINARY_SECRET,
});

// function to hide password from user objects
// function hidePassword(userObject) {
//   userObject.password = false;
//   return userObject;
// }
// register user
apiRoutes.post(
  "/register/",
  // sanitise payload
  body("email").escape().isEmail().normalizeEmail(),
  body("username").trim().notEmpty().escape(),
  body("password").trim().notEmpty().escape(),
  async (req, res) => {
    const credentials = req.body;
    // convert username string to slug
    credentials.username = slugify(credentials.username, "_");
    // encrypt plain password
    credentials.password = bcrypt.hashSync(credentials.password, 10);
    // create new user object
    let newUser = new User({
      ...credentials,
    });
    //save to database
    newUser
      .save()
      .then(async (save_res) => {
        const targetRoom = await Room.findOne({
          name: "Welcome Channel",
          "host.username": "chifarol",
        });
        const targetUsername = credentials.username;
        const hostObj = await User.findOne({ username: targetUsername });
        // join room - add user object to room members
        targetRoom.members.push(hostObj);
        // remove user from list of people that left voluntarily
        targetRoom.left_voluntarily = targetRoom.left_voluntarily.filter(
          (e) => e !== targetUsername
        );
        // create new room info message
        let newRoomMsg = RoomMSG({
          author: targetRoom.host,
          body: `${targetUsername} joined`,
          type: "info",
          date: Date.now(),
        });
        targetRoom.msgs.push(newRoomMsg);
        targetRoom.save();
        updateRoomActivity(hostObj, targetRoom._id);
        res.json({ status: true });
      })
      .catch((e) => {
        res.json({ status: false, error: e.message });
      });
  }
);
// login user
apiRoutes.post(
  "/login/", // sanitise payload
  body("usernameOrEmail").trim().notEmpty().escape(),
  body("password").trim().notEmpty().escape(),
  async (req, res) => {
    const { usernameOrEmail, password } = req.body;
    // find user object
    let user = await User.findByCredentials(usernameOrEmail, password);
    // if there's no user (Invalid credentials Error)
    if (user instanceof Error) {
      return res.status(401).json({ status: false });
    }
    // if user credentials are valid (Error)
    else {
      // generate and sign new JWT token unique to the username and id
      const token = jwt.sign(
        { user_id: user._id, username: user.username },
        ACCESS_TOKEN_SECRET,
        {
          expiresIn: "6h",
        }
      );
      // const newUser = user.toJSON();
      req.session.user = user;
      return res.json({
        user,
        token,
      });
    }
  }
);

// middleware - set session for every request
apiRoutes.use(
  "",
  header("auth").trim().notEmpty().escape(),
  (req, res, next) => {
    const token = req.headers["auth"];
    try {
      // decode the username to which the JWT token was assigned
      decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
      // register the decoded username in session
      req.session.username = decoded.username;
      next();
    } catch (e) {
      // throw error if username couldn't be decoded
      res.status(403).json({ error: "A token is required for authentication" });
    }
  }
);
// check token validity/expiration
apiRoutes.get(
  "/check-auth",
  header("auth").trim().notEmpty().escape(),
  (req, res) => {
    // get auth property in header (JWT token)
    const token = req.headers["auth"];
    // decode the username to which the JWT token was assigned
    try {
      decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
      res.json({ status: true });
    } catch (e) {
      // throw error if username couldn't be decoded
      res.status(403).json({
        status: false,
        error: "A token is required for authentication",
      });
    }
  }
);

// get user object from database
apiRoutes.get(
  "/user",
  query("username").trim().notEmpty().escape(),
  auth,
  async (req, res) => {
    const { username } = req.query;
    const userObj = await User.findOne({ username });
    if (userObj) {
      res.json({ user: userObj });
    } else {
      res.status(401).json({ status: "couldn't find user" });
    }
  }
);
// update user object in database
apiRoutes.post("/user", body("bio").trim().escape(), auth, async (req, res) => {
  const details = req.body;
  const userObjs = await User.findOneAndUpdate(
    {
      username: req.session.username,
    },
    { ...details },
    // return newly modified object not the old one
    { new: true }
  );
  if (userObjs) {
    res.json({ user: userObjs });
  } else {
    res.status(401).json({ status: "couldnt update user" });
  }
});
// search users
apiRoutes.get(
  "/users",
  query("username").trim().notEmpty().escape(),
  auth,
  async (req, res) => {
    const { username } = req.query;
    const userObjs = await User.find({
      // if any username "contains" the search term, case insensitive
      username: { $regex: username, $options: "i" },
    });
    // if user object array is not empty
    if (userObjs) {
      res.json({ users: userObjs });
    }
    // if user object array is empty
    else {
      res.status(401).json({ status: "no username matches the string" });
    }
  }
);
// send direct message to target user/recipient
apiRoutes.post(
  "/dm",
  body("body").trim().notEmpty().escape(),
  body("target").trim().notEmpty().escape(),
  auth,
  async (req, res) => {
    const { target: target_username, body } = req.body;
    const mainUsername = req.session.username;
    // if message sender is same as the recipient
    if (mainUsername === target_username) {
      return res
        .status(401)
        .json({ status: "why will you be messaging your self?, kolo?" });
    }
    // get corresponding user objects
    const mainUserObj = await User.findOne({ username: mainUsername });
    const targetUserObj = await User.findOne({ username: target_username });
    // create new direct message object
    let newDM = new DirectMSG({
      from: mainUsername,
      to: target_username,
      body: body,
      date: Date.now(),
    });
    // save to database
    newDM
      .save()
      .then((save_res) => {
        // fxn to update dm activity array of both users (last seen)
        updateDMActivity(mainUserObj, targetUserObj);
        res.json({ DmMsg: save_res });
      })
      .catch((e) => {
        console.log(e.message);
        res.status(401).json({ status: false, error: e.message });
      });
  }
);

// get direct messages between main and target user
apiRoutes.get(
  "/dm",
  query("target").trim().notEmpty().escape(),
  auth,
  async (req, res) => {
    const { target: target_username } = req.query;
    const mainUsername = req.session.username;
    const targetUserObj = await User.findOne({ username: target_username });
    if (targetUserObj) {
      let DmMsgs = await DirectMSG.find(
        {
          $or: [
            { from: mainUsername, to: target_username },
            { from: target_username, to: mainUsername },
          ],
        },
        null,
        { sort: { date: "asc" } }
      );
      res.json({
        DmMsgs,
        targetUserObj,
      });
    } else {
      res.status(404).json({
        status: "user not found",
      });
    }
  }
);
// delete direct messages to target user
apiRoutes.post(
  "/delete_dm",
  body("msg_id").trim().notEmpty().escape(),
  auth,
  async (req, res) => {
    const { msg_id } = req.body;
    const mainUsername = req.session.username;
    let targetMsg = await DirectMSG.findById(msg_id);
    // if the user(main) asking to delete message is really the author
    if (targetMsg.from === mainUsername) {
      targetMsg.active = false;
      targetMsg.save();
      return res.json({
        targetMsg,
      });
    }
    // if the user(main) asking to delete message is not the author
    else {
      return res.status(401).json({
        status: "only message author can delete message",
      });
    }
  }
);

// create new room
apiRoutes.post(
  "/create_room/",
  body("name").trim().notEmpty().escape(),
  body("topics").toArray().notEmpty(),
  body("description").trim().notEmpty().escape(),
  auth,
  async (req, res) => {
    const { name, topics, description, picture } = req.body;
    const hostUsername = req.session.username;
    const hostObj = await User.findOne({ username: hostUsername });
    // create new room object
    let newRoom = new Room({
      name,
      topics,
      description,
      picture,
      host: hostObj,
      members: [hostObj],
    });
    //save new room to database
    newRoom
      .save()
      .then((save_res) => {
        // update room activity of user (last seen)
        updateRoomActivity(hostObj, save_res.id);
        return res.json({
          newRoom: save_res,
        });
      })
      .catch((e) => {
        console.log(e.message);
        return res.status(401).json({ status: false, error: e.message });
      });
  }
);
// get room object
apiRoutes.get("/room", query("id").escape(), auth, async (req, res) => {
  const { id } = req.query;
  if (id.length !== 24) {
    return res.status(401).json({ status: "invalid room id" });
  }
  const room = await Room.findById(id);
  if (room) {
    return res.json({ room: room });
  } else {
    return res.status(404).json({ status: "couldn't find room" });
  }
});
// post message in room
apiRoutes.post(
  "/room",
  body("room_id").escape(),
  body("body").escape(),
  auth,
  async (req, res) => {
    const { room_id, body } = req.body;
    // find user object of the author
    const authorObj = await User.findOne({ username: req.session.username });
    const room = await Room.findById(room_id);
    if (
      room &&
      authorObj &&
      room.members.some((e) => e.username === req.session.username) // if author is really a member of the room
    ) {
      let newRoomMSG = new RoomMSG({
        author: authorObj,
        body,
        date: Date.now(),
      });
      Room.updateOne(
        { _id: room_id },
        {
          // push new message object to {room.msgs} array
          $push: {
            msgs: newRoomMSG,
          },
        },
        // return newly modified object not the old one
        { new: true }
      )
        .then((save_res) => {
          console.log("newRoom ", save_res);
          return res.json({
            status: save_res.acknowledged,
            newRoomMSG,
          });
        })
        .catch((err) => console.log(err));
    } else {
      return res.status(401).json({ status: "could not find room/author" });
    }
  }
);
// delete messages
apiRoutes.post(
  "/delete_room_message",
  body("msg_id").escape(),
  body("room_id").escape(),
  auth,
  async (req, res) => {
    const { msg_id, room_id } = req.body;
    const mainUsername = req.session.username;
    Room.updateOne(
      //if user is the author
      { _id: room_id, "msgs._id": msg_id, "msg.author.username": mainUsername },
      {
        $set: {
          "msgs.$.active": false,
        },
      },
      // return newly modified object not the old one
      { new: true }
    )
      .then((save_res) => {
        console.log("newRoom ", save_res);
        return res.json({
          status: save_res.acknowledged,
        });
      })
      .catch((err) => console.log(err));
  }
);

// search/fetch rooms according to some criteria
apiRoutes.get("/fetch_rooms", auth, async (req, res) => {
  const { criteria = "" } = req.query;
  // fetch all rooms
  if (criteria === "<all>") {
    const allRooms = await Room.find({});
    return res.json({ Rooms: allRooms });
  }
  // fetch rooms and order by number of members i.e "top rooms"
  else if (criteria === "<top>") {
    const topRooms = await Room.find({}).sort({ members: "desc" }).limit(10);
    return res.json({ Rooms: topRooms });
  }
  // fetch by other criteria
  else {
    const Rooms = await Room.find({
      $or: [
        { name: { $regex: criteria, $options: "i" } },
        { description: { $regex: criteria, $options: "i" } },
        { topics: { $regex: criteria, $options: "i" } },
      ],
    });
    return res.json({ Rooms: Rooms });
  }
});

// add user to a room
apiRoutes.get(
  "/add_member",
  query("room_id").escape(),
  query("username").escape(),
  auth,
  async (req, res) => {
    let { room_id, username: target_username } = req.query;
    const targetRoom = await Room.findById(room_id);
    const targetObj = await User.findOne({ username: target_username });
    // if both target room and user object to be added are not empty
    if (targetRoom && targetObj) {
      // if the user is not a member already
      if (!targetRoom.members.some((e) => e.username === target_username)) {
        // if user to be added did not voluntarily leave the room (cannot be added unless he joins back himself)
        if (!targetRoom.left_voluntarily.includes(target_username)) {
          // add user object to members array
          targetRoom.members.push(targetObj);
          // remove user from rooms blacklist (incase he was formerly removed/blacklisted)
          targetRoom.removed = targetRoom.removed.filter(
            (e) => e !== target_username
          );
          // create new room message for of type="info"
          let newRoomMsg = RoomMSG({
            author: targetRoom.host,
            body: `${req.session.username} added ${target_username}`,
            type: "info",
            date: Date.now(),
          });
          // add new info message to room messages array
          targetRoom.msgs.push(newRoomMsg);
          updateRoomActivity(targetObj, targetRoom._id);
          // save changes to database
          targetRoom.save();

          return res.json({
            status: `${target_username} has been added to room: ${targetRoom.name}`,
          });
        }
        // if user to be added voluntarily left the room (cannot be added unless he joins back himself)
        else {
          return res.status(401).json({
            status:
              "cannot add a user after they have left the room voluntarily",
          });
        }
      }
      // if user to be added is already a member
      else {
        return res.status(401).json({ status: "already a member" });
      }
    } else {
      return res.status(401).json({ status: "couldn't find or user" });
    }
  }
);
// join a room
apiRoutes.get("/join_room", query("id").escape(), auth, async (req, res) => {
  let { id } = req.query;
  const targetRoom = await Room.findById(id);
  const targetUsername = req.session.username;
  const hostObj = await User.findOne({ username: targetUsername });
  if (targetUsername === targetRoom.host.username) {
    return res.status(401).json({
      status: `Hosts cannot remove leave or be removed from room except room is deleted`,
    });
  }
  if (targetRoom) {
    // if user is already a member then leave
    if (targetRoom.members.some((e) => e.username === targetUsername)) {
      // new member array excludding user
      let newMembers = targetRoom.members.filter(
        (e) => e && e.username !== targetUsername
      );
      targetRoom.members = newMembers;
      // add user to the room's list of users who voluntarily left
      targetRoom.left_voluntarily.push(targetUsername);
      // create new room info message
      let newRoomMsg = RoomMSG({
        author: targetRoom.host,
        body: `${targetUsername} left`,
        type: "info",
        date: Date.now(),
      });
      updateRoomActivity(hostObj, targetRoom._id, true);
      // add to room msgs array
      targetRoom.msgs.push(newRoomMsg);
      // if user that is leaving is not the only member left
      if (targetRoom.members.length > 0) {
        targetRoom.save();
        return res.json({
          status: "left",
        });
      }
      // if user that is leaving is the only member left - delete the room
      else {
        targetRoom.delete();
        return res.json({ status: "no members, group deleted" });
      }
    }
    // if user is not a member already but was removed before e.g(by the host) - blacklisted
    else if (targetRoom.removed.includes(targetUsername)) {
      return res.json({
        status: "you are blacklisted from this group",
      });
    }
    // if user is not a member already
    else {
      // join room - add user object to room members
      targetRoom.members.push(hostObj);
      // remove user from list of people that left voluntarily
      targetRoom.left_voluntarily = targetRoom.left_voluntarily.filter(
        (e) => e !== targetUsername
      );
      // create new room info message
      let newRoomMsg = RoomMSG({
        author: targetRoom.host,
        body: `${targetUsername} joined`,
        type: "info",
        date: Date.now(),
      });
      targetRoom.msgs.push(newRoomMsg);
      targetRoom.save();
      updateRoomActivity(hostObj, targetRoom._id);
      return res.json({
        status: "joined",
      });
    }
  } else {
    return res.status(401).json({ status: "couldn't find room" });
  }
});
// remove member (for hosts only)
apiRoutes.get(
  "/remove_member",
  query("username").escape(),
  query("room_id").escape(),
  auth,
  async (req, res) => {
    let { username: target_username, room_id } = req.query;
    let mainUsername = req.session.username;
    const targetRoom = await Room.findById(room_id);
    if (targetRoom) {
      if (mainUsername === target_username) {
        return res.status(401).json({
          status: `Hosts cannot remove leave or be removed from room except room is deleted`,
        });
      }
      // if main user is the room host
      if (targetRoom.host.username === mainUsername) {
        // if the target user is a member of thr room
        if (targetRoom.members.some((e) => e.username === target_username)) {
          // new members array excluding target user
          let newMembers = targetRoom.members.filter(
            (e) => e.username !== target_username
          );
          // add target's username to room blacklist array
          targetRoom.removed.push(target_username);
          targetRoom.members = newMembers;
          let newRoomMsg = RoomMSG({
            room_id: room_id,
            author: targetRoom.host,
            body: `${targetRoom.host.username} removed ${target_username}`,
            type: "info",
            date: Date.now(),
          });
          targetRoom.msgs.push(newRoomMsg);
          if (targetRoom.members.length > 0) {
            targetRoom.save();
            return res.json({
              status: `removed ${target_username}`,
            });
          }
          // if target user is the only member remaining
          else {
            targetRoom.delete();
            return res.json({ status: "no members, group deleted" });
          }
        } else {
          return res.status(401).json({
            status: `${target_username} is not even a member`,
          });
        }
      } else {
        return res
          .status(401)
          .json({ status: "only room hosts can remove members," });
      }
    } else {
      return res.status(401).json({ status: "couldn't find room" });
    }
  }
);
// update room
apiRoutes.post(
  "/update_room",
  body("room_id").escape(),
  body("payload.name").escape(),
  body("payload.topics").escape(),
  body("payload.description").escape(),
  auth,
  async (req, res) => {
    const { room_id, payload } = req.body;
    let mainUsername = req.session.username;
    const targetRoom = await Room.findById(room_id);
    if (targetRoom) {
      if (targetRoom.host.username === mainUsername) {
        if (payload.name) targetRoom.name = payload.name;
        if (payload.topics) targetRoom.topics = payload.topics;
        if (payload.description) targetRoom.description = payload.description;
        if (payload.picture) targetRoom.picture = payload.picture;
        targetRoom.save();
        return res.json({ newRoom: targetRoom });
      } else {
        return res
          .status(401)
          .json({ status: "only room hosts can modify room" });
      }
    } else {
      return res.status(401).json({ status: "couldn't find room" });
    }
  }
);
// delete room
apiRoutes.delete("/room", query("id").escape(), auth, async (req, res) => {
  let { id } = req.query;
  const targetRoom = await Room.findById(id);
  if (targetRoom && targetRoom.host.username === req.session.username) {
    targetRoom.delete();
    res.json({ status: true });
  } else {
    res.status(401).json({ status: false });
  }
});

// generate cloudinary signature for media uploads
apiRoutes.post("/cloudinary_signature/", auth, async (req, res) => {
  const { params } = req.body;

  let timestamp = +new Date();
  let signature = cloudinary.utils.api_sign_request(
    { ...params, timestamp },
    CLOUDINARY_SECRET
  );
  console.log("params n signature", { ...params, signature });
  return res.json({ signature: signature, timestamp: timestamp });
});

module.exports = { apiRoutes };
