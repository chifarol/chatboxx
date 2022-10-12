const express = require("express");
const app = express();
const path = require("path");
const ejsMate = require("ejs-mate");
const session = require("cookie-session");
const helmet = require("helmet");
// for logging requests
const morgan = require("morgan");
// for environment variables
require("dotenv").config();
// for serving routes that are not for the "api"
const { normalRoutes } = require("./normal-routes");
// router for /api/....
const { apiRoutes } = require("./api-routes");
const { CLOUDINARY_NAME, PORT, SOCKET_HOST, SOCKET_HOST_WSS } = process.env;
const port = PORT || 4000;
-require("./connection");

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
  `${SOCKET_HOST}`,
  `${SOCKET_HOST_WSS}`,
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
