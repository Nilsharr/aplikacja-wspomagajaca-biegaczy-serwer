var db = require("../../database/DatabaseService");

exports.getUsers = (req, res) => {
    db.instance.User.findAsync({}).then(function (users) {
        if (users !== undefined) {
            res.status(200).json({ Users: users });
        }
        else {
            res.send(404);
        }

    }).catch(function (err) {
        res.status(500);
        console.log(err);
    })
};

exports.getMe = (req, res) => {

}

exports.getUser = (req, res) => {
    if (req.params.login === undefined) {
        res.send(400);
    }
    db.instance.User.findOneAsync({ login: req.params.login }).then(function (user) {
        console.log(user);
        if (user !== undefined) {
            console.log(user.login + ', ' + user.email);
            res.status(200).json({ User: user });
        }
        else {
            res.send(404);
        }

    }).catch(function (err) {
        res.status(500);
        console.log(err);
    })
};

// need to validate password here i guess
exports.createUser = async (req, res) => {
    if (req.body === {}) {
        res.send(400);
    }
    console.log(req.body);
    var user = new db.instance.User({
        login: req.body.User.login,
        email: req.body.User.email,
        password: req.body.User.password
    });

    const token = await user.generateAuthToken();

    user.save(function (err) {
        if (err) {
            console.log(err);
            res.send(422);
            return;
        }

        res.location('/api/users/' + user.login).status(201).send({ user, token });
        console.log("saved");
    });

    console.log(user.password);
    console.log(user.login);
};


exports.login = async (req, res) => {

    const { email, password } = req.body;
    const user = await db.instance.User.findByCredentials(email, password);
    console.log(user);
    res.sendStatus(200);
}

exports.logout = (req, res) => {

}

exports.updateUser = (req, res) => {
    if (req.params.login === undefined) {
        res.send(400);
    }
    res.sendStatus(200);
};

exports.deleteUser = (req, res) => {
    if (req.params.login === undefined) {
        res.send(400);
    }
    res.sendStatus(200);
};