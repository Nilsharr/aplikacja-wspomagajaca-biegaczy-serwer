const _ = require("lodash");
const mongoose = require("mongoose");
const Event = require("../models/Event");

const genericError = "Something went wrong";
const invalidDataError = "Invalid data";

exports.addEvent = async (req, res) => {
    const { name, details, address, date, maxParticipants, route } = req.body;
    if (_.isNil(name) || _.isNil(address) || _.isNil(date)
        || _.isNil(maxParticipants) || _.isNil(route)) {
        return res.status(400).send({ error: invalidDataError });
    }
    const errorMessages = Event.validateEvent(address, date, maxParticipants);
    if (_.isEmpty(errorMessages)) {
        try {
            const event = new Event({ name, details, address, date, maxParticipants, route });
            await event.save();
            // maybe set location - res.location(`/events/${event._id}`);         
            return res.sendStatus(201);
        } catch (err) {
            return res.status(500).send({ error: genericError });
        }
    } else {
        return res.status(422).send({ errorMessages });
    }
};

exports.editEvent = async (req, res) => {
    const event = req.body.event;
    if (_.isNil(event)) {
        return res.status(400).send({ error: invalidDataError });
    }
    const errorMessages = Event.validateEvent(event.address, event.date, event.maxParticipants);
    if (_.isEmpty(errorMessages)) {
        try {
            await Event.updateOne({ _id: event._id }, event, { upsert: true, new: true, setDefaultsOnInsert: true });
            return res.sendStatus(204);
        }
        catch (err) {
            console.log(err);
            return res.status(500).send({ error: genericError });
        }
    } else {
        return res.status(422).send({ errorMessages });
    }
};

exports.deleteEvent = async (req, res) => {
    const eventId = req.params.id;
    if (_.isNil(eventId) || !mongoose.isValidObjectId(eventId)) {
        return res.status(400).send({ error: invalidDataError });
    }
    try {
        await Event.deleteOne({ _id: eventId });
        return res.sendStatus(204);
    }
    catch (err) {
        console.log(err);
        return res.status(500).send({ error: genericError });
    }
};

exports.getEvent = async (req, res) => {
    const eventId = req.params.id;
    if (_.isNil(eventId) || !mongoose.isValidObjectId(eventId)) {
        return res.status(400).send({ error: invalidDataError });
    }
    try {
        const event = await Event.findOne({ _id: eventId })
        if (_.isNil(event)) {
            return res.sendStatus(404);
        }
        return res.status(200).send(event);
    } catch (err) {
        console.log(err);
        return res.status(500).send({ error: genericError });
    }
};

exports.getEvents = async (req, res) => {
    const { page = 1, limit = 10, name, country, city } = req.query;
    let { sortBy = "name", dateStart, dateEnd } = req.query;
    sortBy = sortBy.toLowerCase();
    sortBy = sortBy === "country" ? "address.country" : sortBy;
    sortBy = sortBy === "city" ? "address.city" : sortBy;

    const query = {};
    if (name) {
        // search by name or city
        query["$or"] = [{ name: { $regex: name, $options: 'i' } }, { "address.city": { $regex: name, $options: 'i' } }];
        //query.name = { $regex: name, $options: 'i' };
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

        if (dateStart instanceof Date && !isNaN(dateStart) && dateEnd instanceof Date && !isNaN(dateEnd)) {
            query.date = { $gt: dateStart, $lt: dateEnd }
        }
    }

    try {
        const events = await Event.find(query)
            .limit(limit)
            .collation({ locale: 'en' })
            .sort(sortBy)
            .skip((page - 1) * limit)
            .exec();
        return res.status(200).send(events);
    } catch (err) {
        console.log(err);
        return res.status(500).send({ error: genericError });
    }
};

exports.joinEvent = async (req, res) => {
    const eventId = req.params.id;
    const user = req.user;
    if (_.isNil(eventId) || !mongoose.isValidObjectId(eventId)) {
        return res.status(400).send({ error: invalidDataError });
    }
    const event = await Event.findOne({ _id: req.params.id });
    if (_.isNil(event)) {
        return res.status(404).send({ error: "Event doesn't exist" });
    }
    try {
        if (event.participants.includes(user._id)) {
            return res.status(422).send({ error: "You already joined this event" });
        }
        if (event.participants.length < event.maxParticipants) {
            event.participants.addToSet(user._id);
            await event.save();
            user.events.addToSet(eventId);
            await user.save();
            return res.sendStatus(204);
        } else {
            return res.status(422).send({ error: "Unable to join because event has maximum number of participants" });
        }
    } catch (err) {
        console.log(err);
        return res.status(500).send({ error: genericError });
    }
};

exports.leaveEvent = async (req, res) => {
    const eventId = req.params.id;
    const user = req.user;
    if (_.isNil(eventId) || !mongoose.isValidObjectId(eventId)) {
        return res.status(400).send({ error: invalidDataError });
    }
    const event = await Event.findOne({ _id: req.params.id });
    if (_.isNil(event)) {
        return res.status(404).send({ error: "Event doesn't exist" });
    }
    try {
        event.participants = _.remove(event.participants, x => x === user._id);
        await event.save();
        user.events = _.remove(user.events, x => x === eventId);
        await user.save();
        return res.sendStatus(204);
    } catch (err) {
        console.log(err);
        return res.status(500).send({ error: genericError });
    }
};