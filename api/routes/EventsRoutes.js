const auth = require('../middleware/Authentication');
const admin = require('../middleware/Administrator');
const events = require('../controllers/EventsController');

module.exports = (app) => {
    app.route('/events').post(auth, admin, events.addEvent);

    app.route('/events').get(auth, events.getEvents);

    app.route('/events/:id').get(auth, events.getEvent);

    app.route('/events/:id').put(auth, admin, events.editEvent);

    app.route('/events/:id').delete(auth, admin, events.deleteEvent);

    app.route('/events/:id/join').post(auth, events.joinEvent);

    app.route('/events/:id/leave').delete(auth, events.leaveEvent);
};
