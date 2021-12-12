const administrator = async (req, res, next) => {
    if (_.isUndefined(req.user.admin)) {
        return res.status(403).send({ error: "You don't have required credentials" });
    }
    next();
};

module.exports = administrator;