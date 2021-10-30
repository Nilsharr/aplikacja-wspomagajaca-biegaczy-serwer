const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");

const userSchema = mongoose.Schema({
  login: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
  },
});

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

userSchema.methods.generateAuthToken = async function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_KEY);
  return token;
};

userSchema.statics.findByCredentials = async (login, email, password) => {
  const user = await User.findOne({ $or: [{ login }, { email }] });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error({ error: "Invalid login credentials" });
  }
  return user;
};

// CREATE USER VALIDATION METHOD
userSchema.statics.createValidation = async (
  login,
  email,
  password,
  confirmPassword
) => {
  const errorMessages = {};

  // Password validation
  if (password.length < 6) {
    errorMessages.passTooShort =
      "Your password must have at least 6 characters";
  }
  if (password !== confirmPassword) {
    errorMessages.passDontMatch = "Passwords must match!";
  }

  // Does login is unique
  const loginFailure = await User.findOne({ login });
  if (loginFailure) {
    errorMessages.loginExists = "Such login already exists";
  }

  // Does email is unique
  const emailFailure = await User.findOne({ email });
  if (emailFailure) {
    errorMessages.emailExists = "Such email already exists";
  }

  // Email validation
  if (!validator.isEmail(email)) {
    errorMessages.emailInvalid = "Invalid email";
  }

  return errorMessages;
};

// LOGIN VALIDATION METHOD
userSchema.statics.validateLogin = async (login, password) => {
  const errorMessages = {};
  let user = null;

  if (!login.includes("@")) {
    // Username
    user = await User.findOne({ login });
  } else {
    // Email as a login
    user = await User.findOne({ email: login });
  }

  if (!user) {
    // User doesnt exist
    errorMessages.loginInvalid = "Invalid login credentials";
  } else {
    const match = await bcrypt.compare(password, user.password);
    // Passwords doesnt match
    if (!match) {
      errorMessages.passwordInvalid = "Invalid password";
    }
  }

  return { user, errorMessages };
};

const User = mongoose.model("User", userSchema);

module.exports = User;
