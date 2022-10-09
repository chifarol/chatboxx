const { model, DirectMSG, RoomMSG, Room, User } = require("./models.js");
//
const { Router } = require("express");
const bcrypt = require("bcrypt");
const slugify = require("slugify");
const jwt = require("jsonwebtoken");
const apiRoutes = Router();
const mongoose = require("mongoose");
const auth = require("./middleware");
const { updateDMActivity, updateRoomActivity } = require("./utils");
require("dotenv").config();
const {
  ACCESS_TOKEN_SECRET,
  CLOUDINARY_NAME,
  CLOUDINARY_SECRET,
  CLOUDINARY_KEY,
} = process.env;
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: CLOUDINARY_NAME,
  api_key: CLOUDINARY_KEY,
  api_secret: CLOUDINARY_SECRET,
});

apiRoutes.post("/register/", (req, res) => {
  const credentials = req.body;
  credentials.username = slugify(credentials.username, "_");
  credentials.password = bcrypt.hashSync(credentials.password, 10);
  let newUser = new User({
    ...credentials,
  });
  newUser
    .save()
    .then((save_res) => {
      console.log("sign-up successful, user: ", save_res.username);
      res.json({ status: true });
    })
    .catch((e) => {
      console.log(e.message);
      res.json({ status: false, error: e.message });
    });
});
// login user
apiRoutes.post("/login/", async (req, res) => {
  const { usernameOrEmail, password } = req.body;
  let user = await User.findByCredentials(usernameOrEmail, password);

  if (user instanceof Error) {
    return res.status(401).json({ status: false });
  } else {
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
});

// set session for every request
apiRoutes.use("", (req, res, next) => {
  const token = req.headers["auth"];
  try {
    decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.session.username = decoded.username;
    next();
  } catch (e) {
    res.status(403).json({ error: "A token is required for authentication" });
  }
});
// check token validity
apiRoutes.get("/check-auth", (req, res) => {
  const token = req.headers["auth"];
  try {
    decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    res.json({ status: true });
  } catch (e) {
    res
      .status(403)
      .json({ status: false, error: "A token is required for authentication" });
  }
});

// get user
apiRoutes.get("/user", auth, async (req, res) => {
  const { username } = req.query;
  const userObj = await User.findOne({ username });
  if (userObj) {
    res.json({ user: userObj });
  } else {
    res.status(401).json({ status: "couldn't find user" });
  }
});
// update users
apiRoutes.post("/user", auth, async (req, res) => {
  const details = req.body;
  const userObjs = await User.findOneAndUpdate(
    {
      username: req.session.username,
    },
    { ...details },
    { new: true }
  );
  if (userObjs) {
    res.json({ user: userObjs });
  } else {
    res.status(401).json({ status: "couldnt update user" });
  }
});
// search users
apiRoutes.get("/users", auth, async (req, res) => {
  const { username } = req.query;
  const userObjs = await User.find({
    username: { $regex: username, $options: "i" },
  });
  if (userObjs) {
    res.json({ users: userObjs });
  } else {
    res.status(401).json({ status: "no username matches the string" });
  }
});
// send dm to target user
apiRoutes.post("/dm", auth, async (req, res) => {
  const { target: target_username, body } = req.body;
  const mainUsername = req.session.username;
  if (mainUsername === target_username) {
    return res
      .status(401)
      .json({ status: "why will you be messaging your self?, kolo?" });
  }
  const mainUserObj = await User.findOne({ username: mainUsername });
  const targetUserObj = await User.findOne({ username: target_username });
  let newDM = new DirectMSG({
    from: mainUsername,
    to: target_username,
    body: body,
    date: Date.now(),
  });
  newDM
    .save()
    .then((save_res) => {
      updateDMActivity(mainUserObj, targetUserObj);
      res.json({ DmMsg: save_res });
    })
    .catch((e) => {
      console.log(e.message);
      res.status(401).json({ status: false, error: e.message });
    });
});

// get direct messages to target user
apiRoutes.get("/dm", auth, async (req, res) => {
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
});
// delete direct messages to target user
apiRoutes.post("/delete_dm", auth, async (req, res) => {
  const { msg_id } = req.body;
  const mainUsername = req.session.username;
  let targetMsg = await DirectMSG.findById(msg_id);
  if (targetMsg.from === mainUsername) {
    targetMsg.active = false;
    targetMsg.save();
    return res.json({
      targetMsg,
    });
  } else {
    return res.status(401).json({
      status: "only message author can delete message",
    });
  }
});

// create room
apiRoutes.post("/create_room/", auth, async (req, res) => {
  const { name, topics, description, picture } = req.body;
  const hostUsername = req.session.username;
  const hostObj = await User.findOne({ username: hostUsername });
  let newRoom = new Room({
    name,
    topics,
    description,
    picture,
    host: hostObj,
    members: [hostObj],
  });
  newRoom
    .save()
    .then((save_res) => {
      updateRoomActivity(hostObj, save_res.id);
      return res.json({
        newRoom: save_res,
      });
    })
    .catch((e) => {
      console.log(e.message);
      return res.status(401).json({ status: false, error: e.message });
    });
});
// get room
apiRoutes.get("/room", auth, async (req, res) => {
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
// post msg in room
apiRoutes.post("/room", auth, async (req, res) => {
  const { room_id, body } = req.body;
  const authorObj = await User.findOne({ username: req.session.username });
  const room = await Room.findById(room_id);
  if (
    room &&
    authorObj &&
    room.members.some((e) => e.username === req.session.username)
  ) {
    let newRoomMSG = new RoomMSG({
      author: authorObj,
      body,
      date: Date.now(),
    });
    Room.updateOne(
      { _id: room_id },
      {
        $push: {
          msgs: newRoomMSG,
        },
      },
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
});
// delete messages
apiRoutes.post("/delete_room_message", auth, async (req, res) => {
  const { msg_id, room_id } = req.body;
  const mainUsername = req.session.username;
  Room.updateOne(
    { _id: room_id, "msgs._id": msg_id, "msg.author.username": mainUsername },
    {
      $set: {
        "msgs.$.active": false,
      },
    },
    { new: true }
  )
    .then((save_res) => {
      console.log("newRoom ", save_res);
      return res.json({
        status: save_res.acknowledged,
      });
    })
    .catch((err) => console.log(err));
});

// search fetch rooms
apiRoutes.get("/fetch_rooms", auth, async (req, res) => {
  const { criteria = "" } = req.query;
  if (criteria === "<all>") {
    const allRooms = await Room.find({});
    return res.json({ Rooms: allRooms });
  } else if (criteria === "<top>") {
    const topRooms = await Room.find({}).sort({ members: "desc" }).limit(10);
    return res.json({ Rooms: topRooms });
  } else {
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
apiRoutes.get("/add_member", auth, async (req, res) => {
  let { room_id, username: target_username } = req.query;
  const targetRoom = await Room.findById(room_id);
  const targetObj = await User.findOne({ username: target_username });
  if (targetRoom && targetObj) {
    if (!targetRoom.members.some((e) => e.username === target_username)) {
      if (!targetRoom.left_voluntarily.includes(target_username)) {
        targetRoom.members.push(targetObj);
        targetRoom.removed = targetRoom.removed.filter(
          (e) => e !== target_username
        );
        let newRoomMsg = RoomMSG({
          author: targetRoom.host,
          body: `${req.session.username} added ${target_username}`,
          type: "info",
          date: Date.now(),
        });
        targetRoom.msgs.push(newRoomMsg);
        updateRoomActivity(targetObj, targetRoom._id);
        targetRoom.save();

        return res.json({
          status: `${target_username} has been added to room: ${targetRoom.name}`,
        });
      } else {
        return res.status(401).json({
          status: "cannot add a user after they have left the room voluntarily",
        });
      }
    } else {
      return res.status(401).json({ status: "already a member" });
    }
  } else {
    return res.status(401).json({ status: "couldn't find or user" });
  }
});
// join a room
apiRoutes.get("/join_room", auth, async (req, res) => {
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
    if (targetRoom.members.some((e) => e.username === targetUsername)) {
      let newMembers = targetRoom.members.filter(
        (e) => e && e.username !== targetUsername
      );
      targetRoom.members = newMembers;
      // add to left_voluntarily list
      targetRoom.left_voluntarily.push(targetUsername);
      let newRoomMsg = RoomMSG({
        author: targetRoom.host,
        body: `${targetUsername} left`,
        type: "info",
        date: Date.now(),
      });
      targetRoom.msgs.push(newRoomMsg);
      if (targetRoom.members.length > 0) {
        targetRoom.save();
        return res.json({
          status: "left",
        });
      } else {
        targetRoom.delete();
        return res.json({ status: "no members, group deleted" });
      }
    } else if (targetRoom.removed.includes(targetUsername)) {
      return res.json({
        status: "you are blacklisted from this group",
      });
    } else {
      targetRoom.members.push(hostObj);
      targetRoom.left_voluntarily = targetRoom.left_voluntarily.filter(
        (e) => e !== targetUsername
      );
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
// remove member
apiRoutes.get("/remove_member", auth, async (req, res) => {
  let { username: target_username, room_id } = req.query;
  let mainUsername = req.session.username;
  const targetRoom = await Room.findById(room_id);
  if (targetRoom) {
    if (mainUsername === target_username) {
      return res.status(401).json({
        status: `Hosts cannot remove leave or be removed from room except room is deleted`,
      });
    }
    if (targetRoom.host.username === mainUsername) {
      if (targetRoom.members.some((e) => e.username === target_username)) {
        let newMembers = targetRoom.members.filter(
          (e) => e.username !== target_username
        );
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
        } else {
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
});
// update room
apiRoutes.post("/update_room", auth, async (req, res) => {
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
});
// delete room
apiRoutes.delete("/room", auth, async (req, res) => {
  let { id } = req.query;
  const targetRoom = await Room.findById(id);
  if (targetRoom && targetRoom.host.username === req.session.username) {
    targetRoom.delete();
    res.json({ status: true });
  } else {
    res.status(401).json({ status: false });
  }
});

apiRoutes.post("/cloudinary_signature/", auth, async (req, res) => {
  const { params } = req.body;

  let timestamp = +new Date();
  console.log("params", { ...params });
  let signature = cloudinary.utils.api_sign_request(
    { ...params, timestamp },
    CLOUDINARY_SECRET
  );
  return res.json({ signature: signature, timestamp: timestamp });
});

module.exports = { apiRoutes };
