const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authentication = async (req, res, next) => {
    try {
        const token = req.header('Authorization').replace('Bearer ', '');
        const data = jwt.verify(token, process.env.JWT_KEY);
        //console.log(data._id);
        const user = await User.findOne({ _id: data._id });
        if (!user) {
            throw new Error();
        }
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        console.log(error);
        res.sendStatus(401);
    }
}

module.exports = authentication;