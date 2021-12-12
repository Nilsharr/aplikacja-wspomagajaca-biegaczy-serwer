const mongoose = require("mongoose");

const routeSchema = new mongoose.Schema({
    // number?
    timestamp: Number,
    coords: {
        latitude: Number,
        longitude: Number,
        altitude: Number,
        accuracy: Number,
        heading: Number,
        speed: Number
    }
});

module.exports = routeSchema;