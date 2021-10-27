const auth = require('../middleware/Authentication')

module.exports = (app) => {
    const users = require('../controllers/UsersController');

    // test only
    app.route('/users').get(users.getUsers);
    app.route('/test').get(users.getTest);

    app.route('/users/me').get(auth, users.getMe);

    app.route('/users').post(users.createUser);

    app.route('/users/login').post(users.login);

    app.route('/users/me/logout').post(auth, users.logout);

    app.route('/users/me/logoutall').post(auth, users.logoutAll);
};