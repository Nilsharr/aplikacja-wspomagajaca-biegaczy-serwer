const _ = require("lodash");
const User = require("../models/User");
const Email = require("../../mails/Email");

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
        return res.status(422).send({ errorMessages });
    }
};

exports.changePassword = async (req, res) => {
    const { password, confirmPassword } = req.body;
    if (!password || !confirmPassword) {
        return res.status(400).send({ error: "Invalid data" });
    }
    const errorMessages = User.validatePassword(password, confirmPassword);
    if (_.isEmpty(errorMessages)) {
        const user = req.user;
        user.password = password;
        await user.save();
        return res.sendStatus(200);
    } else {
        return res.status(422).send({ errorMessages });
    }
}

exports.forgotPassword = async (req, res) => {
    const email = req.body.email;
    if (!email) {
        return res.status(400).send({ error: "Invalid data" });
    }
    const user = await User.findOne({ email });
    if (!user) {
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
    return res.sendStatus(200);
}

exports.resetPassword = async (req, res) => {
    const code = req.params.code;
    if (!code) {
        return res.status(400).send({ error: "Invalid data" });
    }
    const user = await User.findOne({ resetPasswordCode: code, resetPasswordExpires: { $gt: new Date() } });
    if (!user) {
        return res.status(422).send({ error: "Invalid or expired code" });
    }
    const token = await user.generateTempAuthToken();
    return res.status(200).send(token);
}
