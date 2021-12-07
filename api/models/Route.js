const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema({
    // number?
    timestamp: Number,
    coords: {
        latitude: Number,
        longtitude: Number,
        altitudde: Number,
        accuracy: Number,
        heading: Number,
        speed: Number
    }
});

module.exports = routeSchema;