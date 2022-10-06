const { model, Post, Comment, User } = require("./models.js");
//
const { Router } = require("express");
const normalRoutes = Router();

normalRoutes.all("*", async (req, res) => {
  res.render("index");
});

module.exports = { normalRoutes };
