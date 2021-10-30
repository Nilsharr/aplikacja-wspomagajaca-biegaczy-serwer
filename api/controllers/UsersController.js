const _ = require("lodash");
const validator = require("validator");
const User = require("../models/User");

// for tests
exports.getUsers = async (req, res) => {
  const users = await User.find();
  return res.status(200).json(users);
};

exports.getTest = async (req, res) => {
  var user = new User({
    login: "uelston2",
    email: "gbravey2@quantcast.com",
    password: "Jzv9slTf",
  });

  return res.status(200).json([user, user]);
};

exports.getMe = async (req, res) => {
  return res.status(200).send({ user: req.user });
};

exports.createUser = async (req, res) => {
  // Destructuring props and initializing errorMessages
  const { login, email, password, confirmPassword } = req.body;
  if (!login || !email || !password || !confirmPassword) {
    return res.status(400).send({ error: "Invalid data" });
  }

  // Validation
  const errorMessages = await User.createValidation(
    login,
    email,
    password,
    confirmPassword
  );

  if (_.isEmpty(errorMessages)) {
    try {
      const user = new User({ login, email, password, confirmPassword });
      await user.save();
      const token = await user.generateAuthToken();
      return res.status(201).send({ user, token });
    } catch (err) {
      return res.status(500).send({ error: "Something went wrong" });
    }
  } else {
    return res.status(422).send({ errorMessages });
  }
};

exports.login = async (req, res) => {
  const { login, password } = req.body;

  if (!login || !password) {
    res.status(400).send({ error: "Invalid data" });
  }

  const { user, errorMessages } = await User.validateLogin(login, password);

  if (_.isEmpty(errorMessages)) {
    try {
      const token = await user.generateAuthToken();
      return res.status(200).send({ user, token });
    } catch (err) {
      return res.status(500).send({ error: "Something went wrong" });
    }
  } else {
    res.status(422).send({ errorMessages });
  }
};
