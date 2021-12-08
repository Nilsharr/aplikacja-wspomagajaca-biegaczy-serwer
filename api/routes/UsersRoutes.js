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

    app.route('/users/personal').patch(auth, users.editPersonalInfo);

    app.route('/users/avatar').patch(auth, users.editAvatar);

    app.route('/users/avatar').delete(auth, users.deleteAvatar);

    //app.route('/users/avatar').get(auth, users.getAvatar);

    app.route('/users/statistics').post(auth, users.addStatistics);
};
