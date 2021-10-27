const User = require("../models/User");

// for tests
exports.getUsers = async (req, res) => {
    const users = await User.find();
    return res.status(200).json(users);
};

exports.getTest = async (req, res) => {
    var user = new User({
        login: 'uelston2',
        email: 'gbravey2@quantcast.com',
        password: 'Jzv9slTf'
    });

    return res.status(200).json([user, user]);
};

exports.getMe = async (req, res) => {
    return res.status(200).send(req.user);
};

exports.createUser = async (req, res) => {
    if (Object.keys(req.body).length === 0) {
        return res.sendStatus(400);
    }

    try {
        const user = new User(req.body);
        if (user.password !== req.body.confirmPassword) {
            return res.status(422).send("Passwords doesn't match");
        }
        await user.save();
        const token = await user.generateAuthToken();
        return res.status(201).send({ user, token });
    } catch (error) {
        if (error.code === 11000) {
            console.log(error.code);
            return res.status(409).send("Email or login exists");
        }
        console.log(error);
        return res.sendStatus(500);
    }
};

exports.login = async (req, res) => {
    if (Object.keys(req.body).length === 0) {
        return res.sendStatus(400);
    }

    try {
        const { login, email, password } = req.body;
        console.log(login);
        console.log(email);
        console.log(password);
        const user = await User.findByCredentials(login, email, password);
        if (!user) {
            return res.status(401).send({ error: "Authentication failed" });
        }
        const token = await user.generateAuthToken();
        return res.status(200).send({ user, token });
    }
    catch (error) {
        console.log(error);
        return res.sendStatus(401);
    }
}