const mongoose = require("mongoose");
require("dotenv").config();
const { DB_URL, DB_URL_LOCAL } = process.env;
mongoose
  .connect(DB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("MongoDB connection Up and Running !!!"))
  .catch((err) => console.log("MongoDB Error - ", err));
