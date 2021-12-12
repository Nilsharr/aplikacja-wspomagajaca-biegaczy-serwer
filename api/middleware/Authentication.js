const _ = require("lodash");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const authentication = async (req, res, next) => {
  const { authorization } = req.headers;

  // Auth is not provided
  if (_.isUndefined(authorization)) {
    return res.status(401).send({ error: "You must be logged in!" });
  }

  const token = authorization.replace("Bearer ", "");
  jwt.verify(token, process.env.JWT_KEY, async (error, payload) => {
    // Verification failed
    if (error) {
      return res.status(401).send({ error: "You must be logged in!" });
    }

    // Accessing decoded _id
    const { _id } = payload;
    const user = await User.findById(_id);
    if (_.isUndefined(user)) {
      return res.status(401).send({ error: "You must be logged in!" });
    }
    req.user = user;
    next();
  });
};

module.exports = authentication;
