const express = require("express");
const app = express();
const path = require("path");
const ejsMate = require("ejs-mate");
const http = require("http");
const mongoose = require("mongoose");
const session = require("express-session");
const helmet = require("helmet");
const morgan = require("morgan");
const { normalRoutes } = require("./normal-routes");
const { apiRoutes } = require("./api-routes");
const { updateDMActivity, updateRoomActivity } = require("./utils");
const { CLOUDINARY_NAME } = process.env;
const { model, DirectMSG, RoomMSG, Room, User } = require("./models.js");
require("./connection");
require("dotenv").config();
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:4000",
    methods: ["GET", "POST"],
  },
});

let connectUsers = {};
let currentScreen = {};

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);
  socket.on("join_rooms", (data) => {
    data.rooms.forEach((room) => {
      socket.join(room[0]);
      console.log("joined room with id", room[0]);
    });
  });
  socket.on("error", function (err) {
    if (err.description) console.log(err.description);
    else console.log(err); // Or whatever you want to do
  });
  socket.on("currentScreen", (data) => {
    currentScreen[data.username] = data.target;
  });
  socket.on("isTargetReading", ({ username, target }) => {
    console.log(
      `currentScreen[username] of ${username} is ${currentScreen[username]}`
    );
    if (!currentScreen[username]) {
      socket.emit("targetIsReading", false);
    } else if (currentScreen[target] === username) {
      socket.emit("targetIsReading", true);
    } else {
      socket.emit("targetIsReading", false);
    }
  });
  socket.on("online", (data) => {
    connectUsers[data.username] = socket.id;
    socket.username = data.username;
    console.log(`${data.username} just came online or reconnected`);
    console.log(`connectUsers`);
    console.log(connectUsers);
  });
  socket.on("isOnline", (data) => {
    if (connectUsers[data.target]) {
      console.log(`${data.target} is online`);
      socket.emit("isOnlineResult", true);
    } else {
      console.log(`${data.target} is offline`);
      socket.emit("isOnlineResult", false);
    }
  });
  socket.on("lastSeen", async (data) => {
    const { isRoom, targetUsernameOrId, mainUsername } = data;
    let mainUserObj = await User.findOne({ username: mainUsername });
    if (!isRoom) {
      console.log(
        `${mainUsername} with id ${connectUsers[mainUsername]} lastSeen with ${targetUsernameOrId}`
      );
      let targetUserObj = await User.findOne({ username: targetUsernameOrId });
      if (mainUserObj && targetUserObj) {
        updateDMActivity(mainUserObj, targetUserObj, false);
      }
    } else {
      console.log(
        `${mainUsername} with id ${connectUsers[mainUsername]} lastSeen in room ${targetUsernameOrId}`
      );
      if (mainUserObj) {
        updateRoomActivity(mainUserObj, targetUsernameOrId);
      }
    }
  });

  socket.on("offline", (data) => {
    console.log(`disconnecting`, data.username, connectUsers[data.username]);
    delete connectUsers[data.username];
    console.log(`disconnecting`, data.username, connectUsers[data.username]);
  });

  socket.on("send_message", (data) => {
    const target_username = data.target;
    if (target_username) {
      console.log(
        `new message ${data.message.body} to ${target_username} with id ${connectUsers[target_username]}`
      );
      socket
        .to([connectUsers[target_username], socket.id])
        .emit("receive_message", data.message);
    }
  });
  socket.on("msg_room", (data) => {
    console.log("msg room", data);
    socket.to(data.room_id).emit("receive_room_message", data);
  });
  socket.on("disconnect", (reason) => {
    console.log("disconnect in server", reason);
  });
});

server.listen(4001, () => {
  console.log("socket IO SERVER IS RUNNING");
});

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const CSP = { ...helmet.contentSecurityPolicy.getDefaultDirectives() };
CSP["img-src"] = [
  "'self'",
  "blob:",
  `https://res.cloudinary.com/${CLOUDINARY_NAME}/`,
];
CSP["script-src"] = ["'self'", "'unsafe-inline'", "'unsafe-eval'"];
CSP["connect-src"] = [
  "'self'",
  `https://api.cloudinary.com/v1_1/${CLOUDINARY_NAME}/image/upload`,
  `http://localhost:4001`,
  `ws://localhost:4001`,
];
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...CSP,
      },
    },
  })
);
app.use(morgan("combined"));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "mysecret",
    resave: true,
    saveUninitialized: true,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/api", apiRoutes);
app.use("", normalRoutes);

app.listen(4000, "localhost", () => {
  console.log("Listening on port 4000");
});
