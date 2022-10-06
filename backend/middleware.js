const jwt = require("jsonwebtoken");

const { ACCESS_TOKEN_SECRET } = process.env;

const verifyToken = (req, res, next) => {
  const token = req.headers["auth"];

  if (!token) {
    return res
      .status(403)
      .redirect("/login/")
      .send("A token is required for authentication");
  }
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);
    req.user = decoded;
  } catch (err) {
    return res.status(401).redirect("/login/").send("Invalid Token");
  }
  return next();
};

module.exports = verifyToken;
