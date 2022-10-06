const express = require("express");
const app = express();
const path = require("path");
const ejsMate = require("ejs-mate");
const http = require("http");
const mongoose = require("mongoose");
const session = require("express-session");
const helmet = require("helmet");
const morgan = require("morgan");
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

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);
  socket.on("join_room", (data) => {
    socket.join(data);
  });
  socket.on("error", function (err) {
    if (err.description) console.log(err.description);
    else console.log(err); // Or whatever you want to do
  });
  socket.on("online", (data) => {
    connectUsers[data.username] = socket.id;
    socket.username = data.username;
    console.log(`${data.username} just came online or reconnected`);
    console.log(`connectUsers`);
    console.log(connectUsers);
    // socket
    //     .to(socket.id)
    //     .emit("online_suc", socket.id, data.message);
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
        .to(connectUsers[target_username])
        .emit("receive_message", data.message);
    }
  });
  socket.on("disconnect", (reason) => {
    console.log("disconnect in server", reason);
  });
});

server.listen(4001, () => {
  console.log("socket IO SERVER IS RUNNING");
});

const { normalRoutes } = require("./normal-routes");
const { apiRoutes } = require("./api-routes");
const { CLOUDINARY_NAME } = process.env;

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
