var db = require("../../database/DatabaseService");
const bcrypt = require('bcryptjs');

// for tests
exports.getUsers = async (req, res) => {
    const users = await db.instance.User.findAsync({});

    if (users) {
        res.status(200).json(users);
    }
    else {
        res.send(404);
    }
};

// need to validate password here i guess
exports.createUser = async (req, res) => {
    if (Object.keys(req.body).length === 0) {
        res.sendStatus(400);
        return;
    }
    var user = new db.instance.User(req.body);

    const token = await user.generateAuthToken();

    user.save(function (err) {
        if (err) {
            console.log(err);
            res.sendStatus(422);
            return;
        }
        res.status(201).send({ user, token });
        console.log("saved");
    });
};


exports.login = async (req, res) => {
    const { email, password } = req.body;
    const user = db.instance.User.findOneAsync({ email: email });
    if (user) {
        console.log(user.login + ', ' + user.email);
        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            res.send(401);
        }
        res.status(200).json({ User: user });
    }
    else {
        res.send(404);
    }
}

exports.logout = (req, res) => {

}
