const _ = require("lodash");
const mongoose = require("mongoose");
const route = require("../models/Route");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const validator = require("validator");

const GENDER = ["male", "female", "other"];
const maxAge = 100;
const maxHeight = 250;
const maxWeight = 250;

const statistics = new mongoose.Schema({
  totalTime: { type: Number, required: true },
  distance: { type: Number, required: true },
  caloriesBurned: { type: Number, required: true },
  averageSpeed: { type: Number, required: true },
  route: { type: [route], required: true },
  date: { type: Date, default: new Date() }
});

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
  admin: { type: Boolean, default: false },
  gender: {
    type: String,
    lowercase: true,
    trim: true,
    enum: GENDER
  },
  age: { type: Number, min: 0, max: maxAge },
  height: { type: Number, min: 0, max: maxHeight },
  weight: { type: Number, min: 0, max: maxWeight },
  avatar: { data: Buffer, contentType: String },
  statistics: [statistics],

  events: [mongoose.Types.ObjectId],
  resetPasswordCode: String,
  resetPasswordExpires: Date
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

userSchema.methods.generateTempAuthToken = async function () {
  const token = jwt.sign({ _id: this._id }, process.env.JWT_KEY, { expiresIn: '1h' });
  return token;
};

userSchema.methods.generatePasswordResetCode = async function () {
  const expires = new Date();
  expires.setHours(expires.getHours() + process.env.RESET_PASSWORD_CODE_EXPIRATION_HOURS);
  // generate 6 digit code
  this.resetPasswordCode = Math.floor(Math.random() * (999999 - 100000) + 100000);
  this.resetPasswordExpires = expires;
  await this.save();
};

userSchema.statics.findByCredentials = async (login, email, password) => {
  const user = await User.findOne({ $or: [{ login }, { email }] });
  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw new Error({ error: "Invalid login credentials" });
  }
  return user;
};

userSchema.statics.validatePassword = (password, confirmPassword) => {
  const passErrors = {};
  if (password.length < 6) {
    passErrors.passTooShort =
      "Your password must have at least 6 characters";
  }
  if (password !== confirmPassword) {
    passErrors.passDontMatch = "Passwords must match!";
  }
  return passErrors;
}

// User validation
userSchema.statics.createValidation = async (
  login,
  email,
  password,
  confirmPassword
) => {

  const passErrors = User.validatePassword(password, confirmPassword);
  const errorMessages = { ...passErrors };

  // Is the login unique
  const loginFailure = await User.findOne({ login });
  if (loginFailure) {
    errorMessages.loginExists = "Such login already exists";
  }

  // Is the email unique
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

// Login validation
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
    // User doesn't exist
    errorMessages.loginInvalid = "Invalid login credentials";
  } else {
    const match = await bcrypt.compare(password, user.password);
    // Passwords doesn't match
    if (!match) {
      errorMessages.passwordInvalid = "Invalid login credentials";
    }
  }
  return { user, errorMessages };
};

userSchema.statics.validatePersonalInfo = (gender, age, height, weight) => {
  const errorMessages = {};

  if (!GENDER.includes(gender.toLowerCase())) {
    errorMessages.invalidGender = "Invalid option for gender. Valid options are: male, female, other";
  }
  if (!_.isNumber(age)) {
    errorMessages.invalidAge = "Age must be a number!";
  }
  else if (age < 0 || age > maxAge) {
    errorMessages.invalidAge = `Age must be between 0 and ${maxAge}!`;
  }

  if (!_.isNumber(height)) {
    errorMessages.invalidHeight = "Height must be a number!";
  }
  else if (height < 0 || height > maxHeight) {
    errorMessages.invalidHeight = `Height must be between 0 and ${maxHeight}!`;
  }

  if (!_.isNumber(weight)) {
    errorMessages.invalidWeight = "Weight must be a number!";
  }
  else if (weight < 0 || weight > maxWeight) {
    errorMessages.invalidWeight = `Weight must be between 0 and ${maxWeight}!`;
  }
  return errorMessages;
}

const User = mongoose.model("User", userSchema);

module.exports = User;
