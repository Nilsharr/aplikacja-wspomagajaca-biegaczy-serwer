const auth = require('../middleware/Authentication');
const users = require('../controllers/UsersController');

module.exports = (app) => {
    app.route('/users').post(users.createUser);

    app.route('/users/me').get(auth, users.getMe);

    app.route('/users').get(auth, users.getUsers);

    app.route('/users/verify-token').post(users.verifyToken);

    app.route('/users/login-admin').post(users.adminLogin);

    app.route('/users/login').post(users.login);

    app.route('/users/change-password-authenticated').patch(auth, users.authenticateAndChangePassword);

    app.route('/users/change-password').patch(auth, users.changePassword);

    app.route('/users/forgot-password').post(users.forgotPassword);

    app.route('/users/reset-password/:code').post(users.resetPassword);

    app.route('/users/personal').patch(auth, users.editPersonalInfo);

    app.route('/users/avatar').patch(auth, users.editAvatar);

    app.route('/users/avatar').delete(auth, users.deleteAvatar);

    app.route('/users/events').get(auth, users.getUserEvents);

    app.route('/users/:id/events').get(auth, users.getUserEventsById);

    app.route('/users/statistics').post(auth, users.addStatistics);
};
