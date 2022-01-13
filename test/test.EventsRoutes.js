const chai = require("chai");
const chaiHttp = require("chai-http");
const mongoose = require("mongoose");
const should = chai.should();
const server = require("../Server");
const User = require("../api/models/User");
const Event = require("../api/models/Event");

chai.use(chaiHttp);

const testsToSkipCreatingEventsInBeforeEach = ["should create new event when user is admin on /events POST", "should not create new event when user doesn't have admin privileges on /events POST",
    "should return 401 status for no authorization token on /events POST", "should return 401 status for no authorization token on /events POST",
    "should not create new event when date is invalid on /events POST", "should not create new event when maxParticipants value is too big on /events POST",
    "should not create new event when maxParticipants value is <= 0 on /events POST", "should not create new event when name is null on /events POST",
    "should not create new event when address is null on /events POST", "should not create new event when date is null on /events POST",
    "should not create new event when maxParticipants is null on /events POST", "should not create new event when route is null on /events POST"];

const testsToAddUserToEventInBeforeEach = ["should not add user to event that he already is in on /events/:id/join POST", "should remove user from event on /events/:id/leave DELETE",
    "should return 401 status for invalid token on /events/:id/leave DELETE", "should return 401 status for no authorization token on /events/:id/leave DELETE",
    "should return 400 status invalid eventId on /events/:id/leave DELETE"];
const invalidToken = "eyJhbGciOiJIUzI1NiJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTY0MTkyNTk1OCwiaWF0IjoxNjQxOTI1OTU4fQ.SPijfFqJFk48oygS14Gl5wQtkMcJbZuF2PqqpspgXFw";
const eventProperties = ["name", "details", "address", "date", "maxParticipants", "participants", "route"];

const adminUser = {
    login: "Testadmin",
    email: "Testadmin@gmail.com",
    password: "admin123",
    confirmPassword: "admin123"
}

const normalUser = {
    login: "Test",
    email: "test@gmail.com",
    password: "Test123",
    confirmPassword: "Test123"
}

const exampleRoute = [{
    coords: {
        latitude: 51.23757,
        longitude: 22.531164,
        altitude: 0,
        accuracy: 0,
        heading: 0,
        speed: 0
    },
},
{
    coords: {
        latitude: 51.237751,
        longitude: 22.530706,
        altitude: 0,
        accuracy: 0,
        heading: 0,
        speed: 0
    },
},
{
    coords: {
        latitude: 51.237301,
        longitude: 22.529801,
        altitude: 0,
        accuracy: 0,
        heading: 0,
        speed: 0
    },
},
{
    coords: {
        latitude: 51.236912,
        longitude: 22.52949,
        altitude: 0,
        accuracy: 0,
        heading: 0,
        speed: 0
    },
},
{
    coords: {
        latitude: 51.236288,
        longitude: 22.5293,
        altitude: 0,
        accuracy: 0,
        heading: 0,
        speed: 0
    },
    timestamp: 0,
},
{
    coords: {
        latitude: 51.235255,
        longitude: 22.529396,
        altitude: 0,
        accuracy: 0,
        heading: 0,
        speed: 0
    },
    timestamp: 0,
},
{
    coords: {
        latitude: 51.235214,
        longitude: 22.529404,
        altitude: 0,
        accuracy: 0,
        heading: 0,
        speed: 0
    },
    timestamp: 0,
},
{
    coords: {
        latitude: 51.234605,
        longitude: 22.529502,
        altitude: 0,
        accuracy: 0,
        heading: 0,
        speed: 0
    },
    timestamp: 0,
}]

const newEvent = {
    name: "Test name",
    details: "Test details",
    address: {
        country: "Poland",
        city: "Lublin",
        street: "Muzyczna"
    },
    date: new Date().setMonth(new Date().getMonth() + 2),
    maxParticipants: 10,
    route: exampleRoute
}

describe('Test events routes', function () {

    //#region before and after each
    beforeEach(async function () {
        await User.deleteMany({});

        const adminUserRes = await chai.request(server)
            .post("/users")
            .send(adminUser);
        await User.updateOne({ login: adminUserRes.body.user.login, email: adminUserRes.body.user.email }, { admin: true }, { upsert: true });
        this.validAdminUserToken = adminUserRes.body.token;

        const normalUserRes = await chai.request(server)
            .post("/users")
            .send(normalUser);
        this.validNormalUserToken = normalUserRes.body.token;

        if (!testsToSkipCreatingEventsInBeforeEach.includes(this.currentTest.title)) {
            await Event.deleteMany({});
            const res = await chai.request(server)
                .post("/events")
                .set("Authorization", "Bearer " + this.validAdminUserToken)
                .send(newEvent);
            this.eventId = res.body._id;
        }

        if (testsToAddUserToEventInBeforeEach.includes(this.currentTest.title)) {
            await chai.request(server)
                .post(`/events/${this.eventId}/join`)
                .set("Authorization", "Bearer " + this.validNormalUserToken);
        }
    });

    afterEach(async function () {
        await User.deleteMany({});
        await Event.deleteMany({});
    });

    after(function () {
        // need to disconnect mongoose after all tests
        mongoose.disconnect();
    });
    //#endregion

    describe("Test /events POST", function () {
        it("should create new event when user is admin on /events POST", async function () {
            const res = await chai.request(server)
                .post("/events")
                .set("Authorization", "Bearer " + this.validAdminUserToken)
                .send(newEvent);

            res.should.have.status(201);
            res.should.be.json;
            res.body.should.be.a("object");
            eventProperties.forEach(prop => res.body.should.have.property(prop));

            res.body.name.should.be.equal(newEvent.name);
            res.body.details.should.be.equal(newEvent.details);
            res.body.address.country.should.be.equal(newEvent.address.country);
            res.body.address.city.should.be.equal(newEvent.address.city);
            res.body.address.country.should.be.equal(newEvent.address.country);
            Date.parse(res.body.date).should.be.equal(newEvent.date);
            res.body.maxParticipants.should.be.equal(newEvent.maxParticipants);
            res.body.route.length.should.be.equal(newEvent.route.length);
            for (let index = 0; index < newEvent.route.length; index++) {
                res.body.route[index].coords.latitude.should.be.equal(newEvent.route[index].coords.latitude);
                res.body.route[index].coords.longitude.should.be.equal(newEvent.route[index].coords.longitude);
            }
        });

        it("should not create new event when user doesn't have admin privileges on /events POST", async function () {
            const res = await chai.request(server)
                .post("/events")
                .set("Authorization", "Bearer " + this.validNormalUserToken)
                .send(newEvent);

            res.should.have.status(403);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });

        it("should return 401 status for invalid token on /events POST", async function () {
            const res = await chai.request(server)
                .post("/events")
                .set("Authorization", "Bearer " + invalidToken)
                .send(newEvent);

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });

        it("should return 401 status for no authorization token on /events POST", async function () {
            const res = await chai.request(server)
                .post("/events")
                .send(newEvent);

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should not create new event when date is invalid on /events POST", async function () {
            const invalidEvent = { ...newEvent };
            invalidEvent.date = "30/30/2030";

            const res = await chai.request(server)
                .post("/events")
                .set("Authorization", "Bearer " + this.validAdminUserToken)
                .send(invalidEvent);

            res.should.have.status(422);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("errorMessages");
            res.body.errorMessages.should.have.property("invalidDate");
        });

        it("should not create new event when maxParticipants value is too big on /events POST", async function () {
            const invalidEvent = { ...newEvent };
            invalidEvent.maxParticipants = 10000000;

            const res = await chai.request(server)
                .post("/events")
                .set("Authorization", "Bearer " + this.validAdminUserToken)
                .send(invalidEvent);

            res.should.have.status(422);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("errorMessages");
            res.body.errorMessages.should.have.property("tooManyParticipants");
        });

        it("should not create new event when maxParticipants value is <= 0 on /events POST", async function () {
            const invalidEvent = { ...newEvent };
            invalidEvent.maxParticipants = -20;

            const res = await chai.request(server)
                .post("/events")
                .set("Authorization", "Bearer " + this.validAdminUserToken)
                .send(invalidEvent);

            res.should.have.status(422);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("errorMessages");
            res.body.errorMessages.should.have.property("notEnoughParticipants");
        });

        it("should not create new event when name is null on /events POST", async function () {
            const invalidEvent = { ...newEvent };
            invalidEvent.name = null;

            const res = await chai.request(server)
                .post("/events")
                .set("Authorization", "Bearer " + this.validAdminUserToken)
                .send(invalidEvent);

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });

        it("should not create new event when address is null on /events POST", async function () {
            const invalidEvent = { ...newEvent };
            invalidEvent.address = null;

            const res = await chai.request(server)
                .post("/events")
                .set("Authorization", "Bearer " + this.validAdminUserToken)
                .send(invalidEvent);

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });

        it("should not create new event when date is null on /events POST", async function () {
            const invalidEvent = { ...newEvent };
            invalidEvent.date = null;

            const res = await chai.request(server)
                .post("/events")
                .set("Authorization", "Bearer " + this.validAdminUserToken)
                .send(invalidEvent);

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });

        it("should not create new event when maxParticipants is null on /events POST", async function () {
            const invalidEvent = { ...newEvent };
            invalidEvent.maxParticipants = null;

            const res = await chai.request(server)
                .post("/events")
                .set("Authorization", "Bearer " + this.validAdminUserToken)
                .send(invalidEvent);

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });

        it("should not create new event when route is null on /events POST", async function () {
            const invalidEvent = { ...newEvent };
            invalidEvent.route = null;

            const res = await chai.request(server)
                .post("/events")
                .set("Authorization", "Bearer " + this.validAdminUserToken)
                .send(invalidEvent);

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });
    });

    describe("Test /events GET", function () {
        it("should list all events for admin on /events GET", async function () {
            const res = await chai.request(server)
                .get("/events")
                .set("Authorization", "Bearer " + this.validAdminUserToken);

            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a("array");
            res.body.length.should.be.equal(1);
            eventProperties.forEach(prop => res.body[0].should.have.property(prop));

            res.body[0].name.should.be.equal(newEvent.name);
            res.body[0].details.should.be.equal(newEvent.details);
            res.body[0].address.country.should.be.equal(newEvent.address.country);
            res.body[0].address.city.should.be.equal(newEvent.address.city);
            res.body[0].address.country.should.be.equal(newEvent.address.country);
            Date.parse(res.body[0].date).should.be.equal(newEvent.date);
            res.body[0].maxParticipants.should.be.equal(newEvent.maxParticipants);
            res.body[0].route.length.should.be.equal(newEvent.route.length);
            for (let index = 0; index < newEvent.route.length; index++) {
                res.body[0].route[index].coords.latitude.should.be.equal(newEvent.route[index].coords.latitude);
                res.body[0].route[index].coords.longitude.should.be.equal(newEvent.route[index].coords.longitude);
            }
        });

        it("should list all events on for normal user /events GET", async function () {
            const res = await chai.request(server)
                .get("/events")
                .set("Authorization", "Bearer " + this.validNormalUserToken);

            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a("array");
            res.body.length.should.be.equal(1);
            eventProperties.forEach(prop => res.body[0].should.have.property(prop));

            res.body[0].name.should.be.equal(newEvent.name);
            res.body[0].details.should.be.equal(newEvent.details);
            res.body[0].address.country.should.be.equal(newEvent.address.country);
            res.body[0].address.city.should.be.equal(newEvent.address.city);
            res.body[0].address.country.should.be.equal(newEvent.address.country);
            Date.parse(res.body[0].date).should.be.equal(newEvent.date);
            res.body[0].maxParticipants.should.be.equal(newEvent.maxParticipants);
            res.body[0].route.length.should.be.equal(newEvent.route.length);
            for (let index = 0; index < newEvent.route.length; index++) {
                res.body[0].route[index].coords.latitude.should.be.equal(newEvent.route[index].coords.latitude);
                res.body[0].route[index].coords.longitude.should.be.equal(newEvent.route[index].coords.longitude);
            }
        });

        it("should return 401 status for invalid token on /events GET", async function () {
            const res = await chai.request(server)
                .get("/events")
                .set("Authorization", "Bearer " + invalidToken);

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });

        it("should return 401 status for no authorization token on /events GET", async function () {
            const res = await chai.request(server)
                .get("/events");

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });
    });

    describe("Test /events/:id GET", function () {
        it("should list event with given id for admin on /events/:id GET", async function () {
            const res = await chai.request(server)
                .get(`/events/${this.eventId}`)
                .set("Authorization", "Bearer " + this.validAdminUserToken);

            res.should.have.status(200);
            res.should.be.json;

            res.body.should.be.a("object");
            eventProperties.forEach(prop => res.body.should.have.property(prop));

            res.body.name.should.be.equal(newEvent.name);
            res.body.details.should.be.equal(newEvent.details);
            res.body.address.country.should.be.equal(newEvent.address.country);
            res.body.address.city.should.be.equal(newEvent.address.city);
            res.body.address.country.should.be.equal(newEvent.address.country);
            Date.parse(res.body.date).should.be.equal(newEvent.date);
            res.body.maxParticipants.should.be.equal(newEvent.maxParticipants);
            res.body.route.length.should.be.equal(newEvent.route.length);
            for (let index = 0; index < newEvent.route.length; index++) {
                res.body.route[index].coords.latitude.should.be.equal(newEvent.route[index].coords.latitude);
                res.body.route[index].coords.longitude.should.be.equal(newEvent.route[index].coords.longitude);
            }
        });

        it("should list event with given id for normal user on /events/:id GET", async function () {
            const res = await chai.request(server)
                .get(`/events/${this.eventId}`)
                .set("Authorization", "Bearer " + this.validNormalUserToken);

            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a("object");
            eventProperties.forEach(prop => res.body.should.have.property(prop));

            res.body.name.should.be.equal(newEvent.name);
            res.body.details.should.be.equal(newEvent.details);
            res.body.address.country.should.be.equal(newEvent.address.country);
            res.body.address.city.should.be.equal(newEvent.address.city);
            res.body.address.country.should.be.equal(newEvent.address.country);
            Date.parse(res.body.date).should.be.equal(newEvent.date);
            res.body.maxParticipants.should.be.equal(newEvent.maxParticipants);
            res.body.route.length.should.be.equal(newEvent.route.length);

            for (let index = 0; index < newEvent.route.length; index++) {
                res.body.route[index].coords.latitude.should.be.equal(newEvent.route[index].coords.latitude);
                res.body.route[index].coords.longitude.should.be.equal(newEvent.route[index].coords.longitude);
            }
        });

        it("should return 404 status for not existing this.eventId on /events/:id GET", async function () {
            const res = await chai.request(server)
                .get("/events/61e0356a2755bad772dc6d84")
                .set("Authorization", "Bearer " + this.validNormalUserToken);

            res.should.have.status(404);
        });

        it("should return 401 status for invalid token on /events/:id GET", async function () {
            const res = await chai.request(server)
                .get(`/events/${this.eventId}`)
                .set("Authorization", "Bearer " + invalidToken);

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });

        it("should return 401 status for no authorization token on /events/:id GET", async function () {
            const res = await chai.request(server)
                .get(`/events/${this.eventId}`)

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should return 400 status for invalid this.eventId on /events/:id GET", async function () {
            const res = await chai.request(server)
                .get("/events/aaaa5521d")
                .set("Authorization", "Bearer " + this.validNormalUserToken);

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });
    });

    describe("Test /events/:id PUT", function () {
        it("should edit existing event when user is admin on /events/:id PUT", async function () {
            const editedEvent = { ...newEvent };
            editedEvent.name = "Edited Event";
            editedEvent.maxParticipants = 150;
            editedEvent.date = new Date().setMonth(new Date().getMonth() + 5);

            const res = await chai.request(server)
                .put(`/events/${this.eventId}`)
                .set("Authorization", "Bearer " + this.validAdminUserToken)
                .send({ event: editedEvent });

            res.should.have.status(204);
        });

        it("should add new event when user is admin on /events/:id PUT", async function () {
            const id = new mongoose.Types.ObjectId();
            const anotherEvent = { ...newEvent };
            anotherEvent.name = "Another Event";
            anotherEvent.maxParticipants = 70;
            anotherEvent.date = new Date().setMonth(new Date().getMonth() + 4);
            anotherEvent._id = id;

            const res = await chai.request(server)
                .put(`/events/${id}`)
                .set("Authorization", "Bearer " + this.validAdminUserToken)
                .send({ event: anotherEvent });

            res.should.have.status(204);
        });

        it("should not edit existing event when user doesn't have admin privileges on /events/:id PUT", async function () {
            const editedEvent = { ...newEvent };
            editedEvent.name = "Edited Event";
            editedEvent.maxParticipants = 150;
            editedEvent.date = new Date().setMonth(new Date().getMonth() + 5);

            const res = await chai.request(server)
                .put(`/events/${this.eventId}`)
                .set("Authorization", "Bearer " + this.validNormalUserToken)
                .send({ event: editedEvent });

            res.should.have.status(403);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });

        it("should not add new event when user doesn't have admin privileges on /events/:id PUT", async function () {
            const id = new mongoose.Types.ObjectId();
            const anotherEvent = { ...newEvent };
            anotherEvent.name = "Another Event";
            anotherEvent.maxParticipants = 70;
            anotherEvent.date = new Date().setMonth(new Date().getMonth() + 4);
            anotherEvent._id = id;

            const res = await chai.request(server)
                .put(`/events/${id}`)
                .set("Authorization", "Bearer " + this.validNormalUserToken)
                .send({ event: anotherEvent });

            res.should.have.status(403);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });

        it("should return 401 status for invalid token on /events/:id PUT", async function () {
            const editedEvent = { ...newEvent };
            editedEvent.name = "Edited Event";
            editedEvent.maxParticipants = 150;
            editedEvent.date = new Date().setMonth(new Date().getMonth() + 5);

            const res = await chai.request(server)
                .put(`/events/${this.eventId}`)
                .set("Authorization", "Bearer " + invalidToken)
                .send({ event: editedEvent });

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });

        it("should return 401 status for no authorization token on /events/:id PUT", async function () {
            const editedEvent = { ...newEvent };
            editedEvent.name = "Edited Event";
            editedEvent.maxParticipants = 150;
            editedEvent.date = new Date().setMonth(new Date().getMonth() + 5);

            const res = await chai.request(server)
                .put(`/events/${this.eventId}`)
                .send({ event: editedEvent });

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should not edit existing event when date is invalid on /events/:id PUT", async function () {
            const invalidEvent = { ...newEvent };
            invalidEvent.date = "30/30/2030";

            const res = await chai.request(server)
                .put(`/events/${this.eventId}`)
                .set("Authorization", "Bearer " + this.validAdminUserToken)
                .send({ event: invalidEvent });

            res.should.have.status(422);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("errorMessages");
            res.body.errorMessages.should.have.property("invalidDate");
        });

        it("should not edit existing event when maxParticipants value is too big on /events/:id PUT", async function () {
            const invalidEvent = { ...newEvent };
            invalidEvent.maxParticipants = 10000000;

            const res = await chai.request(server)
                .put(`/events/${this.eventId}`)
                .set("Authorization", "Bearer " + this.validAdminUserToken)
                .send({ event: invalidEvent });

            res.should.have.status(422);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("errorMessages");
            res.body.errorMessages.should.have.property("tooManyParticipants");
        });

        it("should not edit existing event when maxParticipants value is <= 0 on /events/:id PUT", async function () {
            const invalidEvent = { ...newEvent };
            invalidEvent.maxParticipants = -20;

            const res = await chai.request(server)
                .put(`/events/${this.eventId}`)
                .set("Authorization", "Bearer " + this.validAdminUserToken)
                .send({ event: invalidEvent });

            res.should.have.status(422);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("errorMessages");
            res.body.errorMessages.should.have.property("notEnoughParticipants");
        });

        it("should not edit existing event when event is null on /events/:id PUT", async function () {
            const res = await chai.request(server)
                .put(`/events/${this.eventId}`)
                .set("Authorization", "Bearer " + this.validAdminUserToken)
                .send(null);

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });
    });

    describe("Test /events/:id DELETE", function () {
        it("should delete event when user is admin on /events/:id DELETE", async function () {
            const res = await chai.request(server)
                .delete(`/events/${this.eventId}`)
                .set("Authorization", "Bearer " + this.validAdminUserToken);

            res.should.have.status(204);
        });

        it("should not delete event when user is not an admin on /events/:id DELETE", async function () {
            const res = await chai.request(server)
                .delete(`/events/${this.eventId}`)
                .set("Authorization", "Bearer " + this.validNormalUserToken);

            res.should.have.status(403);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });

        it("should return 401 status for invalid token on /events/:id DELETE", async function () {
            const res = await chai.request(server)
                .delete(`/events/${this.eventId}`)
                .set("Authorization", "Bearer " + invalidToken);

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });

        it("should return 401 status for no authorization token on /events/:id DELETE", async function () {
            const res = await chai.request(server)
                .delete(`/events/${this.eventId}`);

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should return 400 status for invalid eventId on /events/:id DELETE", async function () {
            const res = await chai.request(server)
                .delete("/events/vbbvg")
                .set("Authorization", "Bearer " + this.validAdminUserToken);

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });
    });

    describe("Test /events/:id/join POST", function () {
        it("should add user to event on /events/:id/join POST", async function () {
            const res = await chai.request(server)
                .post(`/events/${this.eventId}/join`)
                .set("Authorization", "Bearer " + this.validNormalUserToken);

            res.should.have.status(204);
        });

        it("should not add user to event that he already is in on /events/:id/join POST", async function () {
            const res = await chai.request(server)
                .post(`/events/${this.eventId}/join`)
                .set("Authorization", "Bearer " + this.validNormalUserToken);

            res.should.have.status(422);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should not add user to event has maximum number of participants on /events/:id/join POST", async function () {
            const part = Array.from({ length: newEvent.maxParticipants }, () => new mongoose.Types.ObjectId());
            await Event.updateOne({ _id: this.eventId }, { participants: part });

            const res = await chai.request(server)
                .post(`/events/${this.eventId}/join`)
                .set("Authorization", "Bearer " + this.validNormalUserToken);

            res.should.have.status(422);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should not add user to not existing event on /events/:id/join POST", async function () {
            const id = new mongoose.Types.ObjectId();

            const res = await chai.request(server)
                .post(`/events/${id}/join`)
                .set("Authorization", "Bearer " + this.validNormalUserToken);

            res.should.have.status(404);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should return 401 status for invalid token on /events/:id/join POST", async function () {
            const res = await chai.request(server)
                .post(`/events/${this.eventId}/join`)
                .set("Authorization", "Bearer " + invalidToken);

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should return 401 status for no authorization token on /events/:id/join POST", async function () {
            const res = await chai.request(server)
                .post(`/events/${this.eventId}/join`);

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should return 400 status invalid eventId on /events/:id/join POST", async function () {
            const res = await chai.request(server)
                .post("/events/aafgf/join")
                .set("Authorization", "Bearer " + this.validNormalUserToken);

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });
    });

    describe("Test /events/:id/leave DELETE", function () {
        it("should remove user from event on /events/:id/leave DELETE", async function () {
            const res = await chai.request(server)
                .delete(`/events/${this.eventId}/leave`)
                .set("Authorization", "Bearer " + this.validNormalUserToken);

            res.should.have.status(204);
        });

        it("should return 404 status for not existing event on /events/:id/leave DELETE", async function () {
            const id = new mongoose.Types.ObjectId();

            const res = await chai.request(server)
                .delete(`/events/${id}/leave`)
                .set("Authorization", "Bearer " + this.validNormalUserToken);

            res.should.have.status(404);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should return 401 status for invalid token on /events/:id/leave DELETE", async function () {
            const res = await chai.request(server)
                .delete(`/events/${this.eventId}/leave`)
                .set("Authorization", "Bearer " + invalidToken);

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should return 401 status for no authorization token on /events/:id/leave DELETE", async function () {
            const res = await chai.request(server)
                .delete(`/events/${this.eventId}/leave`);

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should return 400 status invalid eventId on /events/:id/leave DELETE", async function () {
            const res = await chai.request(server)
                .delete("/events/llkgb/leave")
                .set("Authorization", "Bearer " + this.validNormalUserToken);

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });
    });

});