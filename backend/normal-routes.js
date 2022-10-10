const { model, Post, Comment, User } = require("./models.js");
//
const { Router } = require("express");
const normalRoutes = Router();

// for non API routes
normalRoutes.all("*", async (req, res) => {
  res.render("index");
});

module.exports = { normalRoutes };
