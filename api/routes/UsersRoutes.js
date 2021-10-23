module.exports = (app) => {
    const users = require('../controllers/UsersController');

    app.route('/users').get(users.getUsers);

    app.route('/users').post(users.createUser);

    app.route('/users/login').post(users.login);

    app.route('/users/logout').post(users.logout);
};

// sign in sign out