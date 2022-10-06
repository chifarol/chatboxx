const mongoose = require("mongoose");
require("dotenv").config();

// mongoose
//   .connect(process.env.DB_URL, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   })
//   .then(() => console.log("MongoDB Cluster connection Up and Running !!!"))
//   .catch((err) => console.log("MongoDB Cluster connection error", err));
mongoose
  .connect("mongodb://0.0.0.0:27017/ChatAppDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Local MongoDB connection Up and Running !!!"))
  .catch((err) => console.log("Local MongoDB Error - ", err));
