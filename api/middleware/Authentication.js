const jwt = require('jsonwebtoken');
const db = require("../../database/DatabaseService");

const authentication = async (req, res, next) => {
    const token = req.header('Authorization').replace('Bearer ', '');
    const data = jwt.verify(token, process.env.JWT_KEY);

    try {
        console.log(data._id);
        console.log(token);
        const user = await db.instance.User.findOneAsync({ email: data._id, 'tokens.token': token });
        if (!user) {
            throw new Error();
        }
        req.user = user;
        req.token = token;
        next();
    } catch (error) {
        // console.log(error);
        res.sendStatus(401);
    }
}
module.exports = authentication;