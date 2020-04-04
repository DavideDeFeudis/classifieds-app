require("dotenv").config();
const jwt = require("jsonwebtoken");

// this middleware never throws an error, it only sets isAuth and potentially userId
module.exports = (req, res, next) => {
  const header = req.get("Authorization");
  if (!header) {
    req.isAuth = false;
    return next();
  }
  const token = header.split(" ")[1];
  console.log("header:", header);
  if (!token) {
    req.isAuth = false;
    return next();
  }
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    req.isAuth = false;
    return next();
  }
  if (!decodedToken) {
    req.isAuth = false;
    return next();
  }
  req.isAuth = true;
  req.userId = decodedToken.userId;
  next();
};
