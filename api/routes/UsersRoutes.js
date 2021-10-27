const auth = require('../middleware/Authentication')

module.exports = (app) => {
    const users = require('../controllers/UsersController');

    // test only
    app.route('/users').get(users.getUsers);
    app.route('/test').get(users.getTest);

    app.route('/users/me').get(auth, users.getMe);

    app.route('/users').post(users.createUser);

    app.route('/users/login').post(users.login);
};