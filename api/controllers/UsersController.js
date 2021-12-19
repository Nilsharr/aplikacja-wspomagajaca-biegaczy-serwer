const _ = require("lodash");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Email = require("../../mails/Email");

// 1 MB
const MAX_FILE_SIZE = 1048576;
// maybe save on disk instead of storing in memory?
const multer = require('multer');
const uploadFile = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_SIZE } }).single('avatar');

// for tests
exports.getUsers = async (req, res) => {
    const users = await User.find();
    return res.status(200).json(users);
};

exports.getTest = (req, res) => {
    var user = new User({
        login: "uelston2",
        email: "gbravey2@quantcast.com",
        password: "Jzv9slTf",
    });

    return res.status(200).json([user, user]);
};

exports.getMe = (req, res) => {
    return res.status(200).send({ user: req.user });
};

exports.createUser = async (req, res) => {
    // Destructuring props and initializing errorMessages
    const { login, email, password, confirmPassword } = req.body;
    if (_.isNil(login) || _.isNil(email) || _.isNil(password) || _.isNil(confirmPassword)) {
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

    if (_.isNil(login) || _.isNil(password)) {
        return res.status(400).send({ error: "Invalid data" });
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
        return res.status(401).send({ errorMessages });
    }
};

exports.adminLogin = async (req, res) => {
    const { login, password } = req.body;

    if (_.isNil(login) || _.isNil(password)) {
        return res.status(400).send({ error: "Invalid data" });
    }

    const { user, errorMessages } = await User.validateLogin(login, password);

    if (_.isEmpty(errorMessages)) {
        try {
            if (!user.admin) {
                return res.status(403).send({ errorMessages: { insufficientPrivileges: "You don't have required credentials" } });
            }
            const token = await user.generateAuthToken();
            return res.status(200).send({ user, token });
        } catch (err) {
            console.log(err);
            return res.status(500).send({ error: "Something went wrong" });
        }
    } else {
        return res.status(401).send({ errorMessages });
    }
};

exports.verifyToken = async (req, res) => {
    const { token } = req.body;
    if (_.isNil(token)) {
        return res.status(400).send({ error: "Invalid data" });
    }
    try {
        jwt.verify(token, process.env.JWT_KEY, error => {
            if (error) {
                return res.status(200).send({ isValid: false });
            } else {
                return res.status(200).send({ isValid: true });
            }
        });
    } catch (err) {
        console.log(err);
        return res.status(500).send({ error: "Something went wrong" });
    }
}

exports.authenticateAndChangePassword = async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (_.isNil(currentPassword) || _.isNil(newPassword) || _.isNil(confirmPassword)) {
        return res.status(400).send({ error: "Invalid data" });
    }
    const user = req.user;
    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
        return res.status(401).send({ errorMessages: { passIncorrect: "Entered password is incorrect" } });
    }
    const errorMessages = User.validatePassword(newPassword, confirmPassword);
    if (_.isEmpty(errorMessages)) {
        user.password = newPassword;
        await user.save();
        return res.sendStatus(204);
    } else {
        return res.status(422).send({ errorMessages });
    }
}

exports.changePassword = async (req, res) => {
    const { password, confirmPassword } = req.body;
    if (_.isNil(password) || _.isNil(confirmPassword)) {
        return res.status(400).send({ error: "Invalid data" });
    }
    const errorMessages = User.validatePassword(password, confirmPassword);
    if (_.isEmpty(errorMessages)) {
        const user = req.user;
        user.password = password;
        await user.save();
        return res.sendStatus(204);
    } else {
        return res.status(422).send({ errorMessages });
    }
}

exports.forgotPassword = async (req, res) => {
    const email = req.body.email;
    if (_.isNil(email)) {
        return res.status(400).send({ error: "Invalid data" });
    }
    const user = await User.findOne({ email });
    if (_.isNil(user)) {
        return res.status(404).send({ error: "User with given email doesn't exist" });
    }
    await user.generatePasswordResetCode();
    try {
        const locals = {
            code: user.resetPasswordCode,
            expirationTime: process.env.RESET_PASSWORD_CODE_EXPIRATION_HOURS
        };
        Email.send('resetPassword', user.email, locals);
    } catch (err) {
        console.log(err);
        return res.sendStatus(500);
    }
    return res.sendStatus(204);
}

exports.resetPassword = async (req, res) => {
    const email = req.body.email;
    const code = req.params.code;
    if (_.isNil(code) || _.isNil(email)) {
        return res.status(400).send({ error: "Invalid data" });
    }
    const user = await User.findOne({ email: email, resetPasswordCode: code, resetPasswordExpires: { $gt: new Date() } });
    if (_.isNil(user)) {
        return res.status(422).send({ error: "Invalid or expired code" });
    }
    const token = await user.generateTempAuthToken();
    return res.status(200).send({ token });
}

exports.editPersonalInfo = async (req, res) => {
    const { gender, age, height, weight } = req.body;
    if (_.isNil(gender) || _.isNil(age) || _.isNil(height) || _.isNil(weight)) {
        return res.status(400).send({ error: "Invalid data" });
    }
    const errorMessages = User.validatePersonalInfo(gender, age, height, weight);
    if (_.isEmpty(errorMessages)) {
        try {
            const user = req.user;
            user.gender = gender;
            user.age = age;
            user.height = height;
            user.weight = weight;
            await user.save();
            return res.sendStatus(204);
        } catch (err) {
            console.log(err);
            return res.status(500).send({ error: "Something went wrong" });
        }
    } else {
        return res.status(422).send({ errorMessages });
    }
}

exports.editAvatar = async (req, res) => {
    uploadFile(req, res, async (err) => {
        if (err) {
            if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
                console.log(err);
                return res.status(413).send({ error: "File too large" });
            }
            console.log(err);
            return res.status(500).send({ error: "Something went wrong" });
        }
        else {
            if (_.isNil(req.file)) {
                return res.status(400).send({ error: "Invalid data" });
            }
            try {
                const user = req.user;
                user.avatar = { data: req.file.buffer, contentType: req.file.mimetype };
                await user.save();
                return res.sendStatus(201);
            }
            catch (err) {
                console.log(err);
                return res.status(500).send({ error: "Something went wrong" });
            }
        }
    });
}

exports.deleteAvatar = async (req, res) => {
    const user = req.user;
    user.avatar.data = undefined;
    user.avatar.contentType = undefined;
    await user.save();
    return res.sendStatus(200);
}

//validate typeof number
exports.addStatistics = async (req, res) => {
    const { totalTime, distance, caloriesBurned, averageSpeed, route } = req.body;
    if (_.isNil(totalTime) || !_.isNumber(totalTime) || _.isNil(distance) || !_.isNumber(distance)
        || _.isNil(caloriesBurned) || !_.isNumber(caloriesBurned)
        || _.isNil(averageSpeed) || !_.isNumber(averageSpeed) || _.isNil(route)) {
        return res.status(400).send({ error: "Invalid data" });
    }
    try {
        const user = req.user;
        user.statistics.push({ totalTime, distance, caloriesBurned, averageSpeed, route });
        await user.save();
        return res.sendStatus(201);
    } catch (err) {
        console.log(err);
        return res.status(500).send({ error: "Something went wrong" });
    }
}
