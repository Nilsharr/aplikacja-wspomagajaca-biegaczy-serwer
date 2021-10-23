const User = require("../models/User");

// for tests
exports.getUsers = async (req, res) => {
    const users = await User.find();
    return res.status(200).json(users);
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
        await user.save();
        const token = await user.generateAuthToken();
        return res.status(201).send({ user, token });
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
};

exports.login = async (req, res) => {
    if (Object.keys(req.body).length === 0) {
        return res.sendStatus(400);
    }

    try {
        const { email, password } = req.body;
        const user = await User.findByCredentials(email, password);
        if (!user) {
            return res.status(401).send({ error: "Authentication failed" });
        }
        const token = await user.generateAuthToken();
        return res.status(200).send({ user, token });
    }
    catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
}

exports.logout = async (req, res) => {
    try {
        req.user.tokens = req.user.tokens.filter(token => {
            return token.token !== req.token;
        });
        await req.user.save();
        return res.sendStatus(200);
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
}

exports.logoutAll = async (req, res) => {
    try {
        req.user.tokens = [];
        await req.user.save();
        return res.sendStatus(200);
    } catch (error) {
        console.log(error);
        return res.sendStatus(500);
    }
}