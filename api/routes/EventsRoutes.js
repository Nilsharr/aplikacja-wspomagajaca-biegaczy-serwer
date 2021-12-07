const auth = require('../middleware/Authentication');
const events = require('../controllers/EventsController');

module.exports = (app) => {
    app.route('/events').post(auth, events.addEvent);

    app.route('/events/:id').put(auth, events.editEvent);

    app.route('/events/:id').delete(auth, events.deleteEvent);

    app.route('/events').get(auth, events.getEvents);

    app.route('/events/user').get(auth, events.getUserEvents);

    app.route('/events/:id/join').post(auth, events.joinEvent);

    app.route('/events/:id/leave').delete(auth, events.leaveEvent);
};
