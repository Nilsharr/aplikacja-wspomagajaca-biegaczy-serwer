const mongoose = require("mongoose");
const route = require("../models/Route");

Date.prototype.addDays = function (days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

const address = new mongoose.Schema({
    country: { type: String, required: true },
    city: { type: String, required: true },
    street: { type: String, required: true }
});

const eventSchema = mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },
    details: String,
    address: { type: address, required: true },
    date: { type: Date, required: true },
    maxParticipants: {
        type: Number,
        required: true,
        min: 1,
        max: 999999
    },
    participants: [mongoose.Types.ObjectId],
    route: { type: [route], required: true }
    /*expireAt: {
        type: Date,
        default: new Date().addDays(7)
    }*/
});

eventSchema.statics.validateEvent = (
    address,
    date,
    maxParticipants
) => {
    const errorMessages = {};
    const userDate = new Date(date);

    if (_.isUndefined(address.country)) {
        errorMessages.lacksCountry = "You must specify country";
    }
    if (_.isUndefined(address.city)) {
        errorMessages.lacksCity = "You must specify city";
    }
    if (_.isUndefined(address.street)) {
        errorMessages.lacksStreet = "You must specify street";
    }
    if (!(userDate instanceof Date && !isNaN(userDate))) {
        errorMessages.invalidDate = "Invalid date format";
    }
    if (userDate.toISOString().substring(0, 10) < new Date().addDays(1).toISOString().substring(0, 10)) {
        errorMessages.invalidDate = "The event can take place tomorrow at the earliest";
    }
    if (maxParticipants < 1) {
        errorMessages.notEnoughParticipants = "The event must have at least one participant";
    }
    if (maxParticipants > 999999) {
        errorMessages.tooManyParticipants = "The event must have less than 1000000 participants";
    }
    return errorMessages;
};

const Event = mongoose.model("Event", eventSchema);

module.exports = Event;
