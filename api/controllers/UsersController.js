const db = require("../../database/DatabaseService");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// for tests
exports.getUsers = async (req, res) => {
    const users = await db.instance.User.findAsync({});

    if (users) {
        return res.status(200).json(users);
    }

    return res.send(404);
};

exports.getMe = async (req, res) => {
    return res.status(200).send(req.user);
};

// need to validate password here i guess
exports.createUser = async (req, res) => {
    if (Object.keys(req.body).length === 0) {
        return res.sendStatus(400);

    }
    if (req.body.password.length < 6) {
        return res.sendStatus(422);
    }

    const user = new db.instance.User(req.body);

    await user.saveAsync({ if_not_exist: true }, async (err) => {
        if (err) {
            console.log(err);
            return res.sendStatus(422);
        }
        // if user exists
        if (user.isModified()) {
            console.log("user exists");
            return res.sendStatus(409);
        }
        else {
            const token = await generateAuthToken(user);
            console.log("saved");
            return res.status(201).send({ user, token });
        }
    });
};


exports.login = async (req, res) => {
    if (Object.keys(req.body).length === 0) {
        return res.sendStatus(400);
    }

    const { email, password } = req.body;
    const user = await db.instance.User.findOneAsync({ email: email });
    if (user) {
        if (await bcrypt.compare(password, user.password)) {
            const token = await generateAuthToken(user);
            return res.status(200).json({ user, token });
        } else {
            return res.sendStatus(401);
        }
    }
    else {
        return res.sendStatus(401);
    }
}

exports.logout = (req, res) => {

}

async function generateAuthToken(instance) {
    if (!(instance instanceof db.instance.User)) {
        throw new Error("");
    }
    const token = jwt.sign({ _id: instance.email }, process.env.JWT_KEY);
    console.log(token);
    instance.tokens = !instance.tokens ? [token] : instance.tokens.concat(token);
    await instance.saveAsync();
    return token;
}