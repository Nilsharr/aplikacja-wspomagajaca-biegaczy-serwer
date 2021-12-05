const _ = require("lodash");
const Event = require("../models/Event");

exports.addEvent = async (req, res) => {
    if (!req.user.admin) {
        return res.status(403).send({ error: "You don't have required credentials" });
    }
    const { name, details, address, date, maxParticipants } = req.body;
    if (!name || !address || !date || (!maxParticipants && maxParticipants != 0)) {
        return res.status(400).send({ error: "Invalid data" });
    }
    const errorMessages = Event.validateEvent(address, date, maxParticipants);
    if (_.isEmpty(errorMessages)) {
        try {
            console.log("hmm")
            const event = new Event({ name, details, address, date, maxParticipants });
            await event.save();
            return res.sendStatus(200);
        } catch (err) {
            return res.status(500).send({ error: "Something went wrong" });
        }
    } else {
        return res.status(422).send({ errorMessages });
    }
};


exports.editEvent = async (req, res) => {
    if (!req.user.admin) {
        return res.status(403).send({ error: "You don't have required credentials" });
    }
    const event = req.body.event;
    try {
        await Event.updateOne({ _id: event._id }, event, { upsert: true, new: true, setDefaultsOnInsert: true });
        return res.sendStatus(200);
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ error: "Something went wrong" });
    }
};

exports.deleteEvent = async (req, res) => {
    if (!req.user.admin) {
        return res.status(403).send({ error: "You don't have required credentials" });
    }
    const eventId = req.params.id;
    if (!eventId) {
        return res.status(400).send({ error: "Invalid data" });
    }
    try {
        await Event.deleteOne({ _id: eventId });
        return res.sendStatus(200);
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ error: "Something went wrong" });
    }
};

exports.getEvents = async (req, res) => {
    const { page = 1, limit = 10, name, country, city } = req.query;
    let { sortBy = "date", dateStart, dateEnd } = req.query;
    sortBy = sortBy === "country" ? "address.country" : sortBy;
    sortBy = sortBy === "city" ? "address.city" : sortBy;

    const query = {};
    if (name) {
        query.name = { $regex: name, $options: 'i' };
    }
    if (country) {

        query["address.country"] = { $in: country };
    }
    if (city) {
        query["address.city"] = { $in: city };
    }
    if (dateStart && dateEnd) {
        dateStart = new Date(dateStart);
        dateEnd = new Date(dateEnd);
        console.log(dateStart)
        console.log(dateEnd)

        if (dateStart instanceof Date && !isNaN(dateStart) && dateEnd instanceof Date && !isNaN(dateEnd)) {
            query.date = { $gt: dateStart, $lt: dateEnd }
        }
    }

    try {
        const events = await Event.find(query)
            .limit(limit)
            .sort(sortBy)
            .skip((page - 1) * limit)
            .exec();
        return res.status(200).json(events);
    } catch (err) {
        console.log(err);
        return res.status(500).send({ error: "Something went wrong" });
    }
};

exports.joinEvent = async (req, res) => {
    const eventId = req.params.id;
    const user = req.user;
    if (!eventId) {
        return res.status(400).send({ error: "Invalid data" });
    }
    const event = await Event.findOne({ _id: req.params.id });
    if (!event) {
        return res.status(400).send({ error: "Event doesn't exist" });
    }
    try {
        if (event.participants.length < event.maxParticipants) {
            event.participants.push(user._id);
            await event.save();
            user.events.push(eventId);
            await user.save();
            return res.sendStatus(200);
        } else {
            return res.status(422).send({ error: "Unable to join because event has maximum number of participants" });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).send({ error: "Something went wrong" });
    }
};

exports.leaveEvent = async (req, res) => {
    const eventId = req.params.id;
    const user = req.user;
    if (!eventId) {
        return res.status(400).send({ error: "Invalid data" });
    }
    const event = await Event.findOne({ _id: req.params.id });
    if (!event) {
        return res.status(400).send({ error: "Event doesn't exist" });
    }
    try {
        event.participants = _.remove(event.participants, x => x === user._id);
        await event.save();
        user.events = _.remove(user.events, x => x === eventId);
        await user.save();
        return res.sendStatus(200);
    } catch (err) {
        console.log(err);
        return res.status(500).send({ error: "Something went wrong" });
    }
};
// user get joined events