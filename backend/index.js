const express = require("express");
const app = express();
const path = require("path");
const ejsMate = require("ejs-mate");
const http = require("http");
const session = require("express-session");
const helmet = require("helmet");
// for logging requests
const morgan = require("morgan");
// for environment variables
require("dotenv").config();
// for serving routes that are not for the "api"
const { normalRoutes } = require("./normal-routes");
// router for /api/....
const { apiRoutes } = require("./api-routes");
const { updateDMActivity, updateRoomActivity } = require("./utils");
const { CLOUDINARY_NAME, PORT, PORT_IO } = process.env;
const port = PORT || 4000;
const { User } = require("./models.js");
require("./connection");
const { Server } = require("socket.io");

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: port,
    methods: ["GET", "POST"],
  },
});
// object for tracking users that are online
let connectUsers = {};
// object for tracking if a user is reading chats with a target user
let currentScreen = {};

io.on("connection", (socket) => {
  socket.on("join_rooms", (data) => {
    data.rooms.forEach((room) => {
      socket.join(room[0]);
    });
  });
  socket.on("error", function (err) {
    if (err.description) console.log(err.description);
    else console.log(err);
  });
  // register user's current screen i.e if he's reading chats with a target user
  socket.on("currentScreen", (data) => {
    currentScreen[data.username] = data.target;
  });
  // emits user's current screen to front end
  socket.on("isTargetReading", ({ username, target }) => {
    if (!currentScreen[username]) {
      socket.emit("targetIsReading", false);
    } else if (currentScreen[target] === username) {
      socket.emit("targetIsReading", true);
    } else {
      socket.emit("targetIsReading", false);
    }
  });
  // checks user is online when frontend emits
  socket.on("online", (data) => {
    connectUsers[data.username] = socket.id;
    socket.username = data.username;
  });
  // emit ->true<-- if user is in connectUsers object
  socket.on("isOnline", (data) => {
    if (connectUsers[data.target]) {
      socket.emit("isOnlineResult", true);
    } else {
      socket.emit("isOnlineResult", false);
    }
  });
  // update user's last seen
  socket.on("lastSeen", async (data) => {
    const { isRoom, targetUsernameOrId, mainUsername } = data;
    let mainUserObj = await User.findOne({ username: mainUsername });
    // if the object in question is not a room
    if (!isRoom) {
      let targetUserObj = await User.findOne({ username: targetUsernameOrId });
      if (mainUserObj && targetUserObj) {
        updateDMActivity(mainUserObj, targetUserObj, false);
      }
    }
    // if the object in question is a room
    else {
      if (mainUserObj) {
        updateRoomActivity(mainUserObj, targetUsernameOrId);
      }
    }
  });
  // remove username from connectUsers when going offline
  socket.on("offline", (data) => {
    delete connectUsers[data.username];
  });
  // broadcst message between two parties (not toom message)
  socket.on("send_message", (data) => {
    const target_username = data.target;
    if (target_username) {
      socket
        .to([connectUsers[target_username], socket.id])
        .emit("receive_message", data.message);
    }
  });
  // broadcst message to all room members
  socket.on("msg_room", (data) => {
    socket.to(data.room_id).emit("receive_room_message", data);
  });
  socket.on("disconnect", (reason) => {
    console.log("disconnect in server", reason);
  });
});

server.listen(PORT_IO, () => {
  console.log("socket IO SERVER IS RUNNING");
});

app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// helmet's content-security policy settings/tweaking
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
  `http://localhost:${PORT_IO}`,
  `https://chatboxx.onrender.com:${PORT_IO}`,
  `ws://localhost:${PORT_IO}`,
  `ws://chatboxx.onrender.com:${PORT_IO}`,
  `wss://chatboxx.onrender.com:${PORT_IO}`,
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
// for logging http requests
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

// for APIs routes
app.use("/api", apiRoutes);
// for none API routes
app.use("", normalRoutes);

app.listen(port, "localhost", () => {
  console.log("Listening on port ", port);
});
