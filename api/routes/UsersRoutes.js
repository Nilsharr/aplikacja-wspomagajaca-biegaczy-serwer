const auth = require('../middleware/Authentication');
const users = require('../controllers/UsersController');

module.exports = (app) => {
    // test only
    app.route('/users').get(users.getUsers);
    app.route('/test').get(users.getTest);

    app.route('/users/me').get(auth, users.getMe);

    app.route('/users').post(users.createUser);

    app.route('/users/login').post(users.login);

    app.route('/users/change-password').patch(auth, users.changePassword);

    app.route('/users/forgot-password').post(users.forgotPassword);

    app.route('/users/reset-password/:code').post(users.resetPassword);
};
