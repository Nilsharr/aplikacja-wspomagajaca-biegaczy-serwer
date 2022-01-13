const chai = require("chai");
const chaiHttp = require("chai-http");
const should = chai.should();
const server = require("../Server");
const User = require("../api/models/User");
const Event = require("../api/models/Event");

chai.use(chaiHttp);

const testsToSkipBeforeEach = ["should create new user on /users POST", "should not create new user when login is null on /users POST",
    "should not create new user when email is null on /users POST", "should not create new user when email is invalid on /users POST",
    "should not create new user when password has less than six characters on /users POST", "should not create new user when passwords don\"t match on /users POST"];

const testsToAddEventsInBeforeEach = ["should list all events that current user takes part in on /users/events GET", "should return 401 status for invalid token on /users/events GET",
    "should return 401 status for no authorization token on /users/events GET",
    "should list all events that user with given id takes part in on /users/:id/events GET", "should return 401 status for invalid token on /users/:id/events GET",
    "should return 401 status for no authorization token on /users/:id/events GET", "should return 400 status for null eventId on /users/:id/events GET",
    "should return 400 status for invalid eventId on /users/:id/events GET"
];

const testsToSetUserAsAdminInBeforeEach = [...testsToAddEventsInBeforeEach,
    "should login user with admin privileges with login on /users/login-admin POST", "should login user with admin privileges with email on /users/login-admin POST",
    "should not login user with not existing login on /users/login-admin POST", "should not login user with wrong password on /users/login-admin POST",
    "should return 400 status for null login on /users/login-admin POST", "should return 400 status for null password on /users/login-admin POST"];

const invalidToken = "eyJhbGciOiJIUzI1NiJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTY0MTkyNTk1OCwiaWF0IjoxNjQxOTI1OTU4fQ.SPijfFqJFk48oygS14Gl5wQtkMcJbZuF2PqqpspgXFw";
const userProperties = ["login", "email", "password", "admin", "events", "statistics"];
const eventProperties = ["name", "details", "address", "date", "maxParticipants", "participants", "route"];

const userOne = {
    login: "Test",
    email: "test@gmail.com",
    password: "Test123",
    confirmPassword: "Test123"
}

const userTwo = {
    login: "Brrrt",
    email: "brrr@gmail.com",
    password: "888000999",
    confirmPassword: "888000999"
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

const newStatistics = {
    totalTime: 60,
    distance: 1200,
    caloriesBurned: 110,
    averageSpeed: 20,
    route: exampleRoute
};

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

describe("Test user routes", function () {

    //#region before and after each
    beforeEach(async function () {
        if (testsToSkipBeforeEach.includes(this.currentTest.title)) {
            return;
        }
        await User.deleteMany({});

        const userRes = await chai.request(server)
            .post("/users")
            .send(userOne);

        this.eventId = userRes.body.user._id;
        this.validToken = userRes.body.token;

        if (testsToSetUserAsAdminInBeforeEach.includes(this.currentTest.title)) {
            await User.updateOne({ login: userRes.body.user.login, email: userRes.body.user.email }, { admin: true }, { upsert: true });
        }

        if (testsToAddEventsInBeforeEach.includes(this.currentTest.title)) {
            await Event.deleteMany({});
            const eventRes = await chai.request(server)
                .post("/events")
                .set("Authorization", "Bearer " + this.validToken)
                .send(newEvent)

            await chai.request(server)
                .post(`/events/${eventRes.body._id}/join`)
                .set("Authorization", "Bearer " + this.validToken);
        }
    });

    afterEach(async function () {
        await User.deleteMany({});

        if (testsToAddEventsInBeforeEach.includes(this.currentTest.title)) {
            await Event.deleteMany({});
        }
    });
    //#endregion

    describe("Test /users POST", function () {
        it("should create new user on /users POST", async function () {
            const res = await chai.request(server)
                .post("/users")
                .send(userTwo);

            res.should.have.status(201);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("user");
            userProperties.forEach(prop => res.body.user.should.have.property(prop));
            res.body.should.have.property("token");
            res.body.user.login.should.be.equal(userTwo.login);
            res.body.user.email.should.be.equal(userTwo.email);
        });

        it("should not create new user when login is null on /users POST", async function () {
            const invalidUser = { ...userTwo };
            invalidUser.login = null;

            const res = await chai.request(server)
                .post("/users")
                .send(invalidUser);

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });

        it("should not create new user when email is null on /users POST", async function () {
            const invalidUser = { ...userTwo };
            invalidUser.email = null;

            const res = await chai.request(server)
                .post("/users")
                .send(invalidUser);

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });

        it("should not create new user when email is invalid on /users POST", async function () {
            const invalidUser = { ...userTwo };
            invalidUser.email = "invalid-mail.com"

            const res = await chai.request(server)
                .post("/users")
                .send(invalidUser);

            res.should.have.status(422);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("errorMessages");
            res.body.errorMessages.should.have.property("emailInvalid");
        });

        it("should not create new user when user exists with given login in database on /users POST", async function () {
            const invalidUser = { ...userTwo };
            invalidUser.login = userOne.login;

            const res = await chai.request(server)
                .post("/users")
                .send(invalidUser);

            res.should.have.status(422);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("errorMessages");
            res.body.errorMessages.should.have.property("loginExists");

        });

        it("should not create new user when user exists with given email in database on /users POST", async function () {
            const invalidUser = { ...userTwo };
            invalidUser.email = userOne.email;

            const res = await chai.request(server)
                .post("/users")
                .send(invalidUser);

            res.should.have.status(422);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("errorMessages");
            res.body.errorMessages.should.have.property("emailExists");
        });

        it("should not create new user when password has less than six characters on /users POST", async function () {
            const invalidUser = { ...userTwo };
            invalidUser.password = "12345";
            invalidUser.confirmPassword = "12345";

            const res = await chai.request(server)
                .post("/users")
                .send(invalidUser);

            res.should.have.status(422);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("errorMessages");
            res.body.errorMessages.should.have.property("passTooShort");
        })

        it("should not create new user when passwords don\"t match on /users POST", async function () {
            const invalidUser = { ...userTwo };
            invalidUser.password = "test258";
            invalidUser.confirmPassword = "test852";

            const res = await chai.request(server)
                .post("/users")
                .send(invalidUser);

            res.should.have.status(422);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("errorMessages");
            res.body.errorMessages.should.have.property("passDontMatch");
        });
    });

    describe("Test /users/me GET", function () {
        it("should list current user on /users GET", async function () {
            const res = await chai.request(server)
                .get("/users/me")
                .set("Authorization", "Bearer " + this.validToken);

            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a("object");
            userProperties.forEach(prop => res.body.user.should.have.property(prop));
            res.body.user.login.should.be.equal(userOne.login);
            res.body.user.email.should.be.equal(userOne.email)
        });

        it("should return 401 status for invalid token on /users/me GET", async function () {
            const res = await chai.request(server)
                .get("/users/me")
                .set("Authorization", "Bearer " + invalidToken);

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });

        it("should return 401 status for no authorization token on /users/me GET", async function () {
            const res = await chai.request(server)
                .get("/users/me");

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });
    });

    describe("Test /users GET", function () {
        it("should list all users on /users GET", async function () {
            const res = await chai.request(server)
                .get("/users")
                .set("Authorization", "Bearer " + this.validToken);

            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a("array");
            res.body.length.should.be.equal(1);
            userProperties.forEach(prop => res.body[0].should.have.property(prop));
        });

        it("should return 401 status for invalid token on /users GET", async function () {
            const res = await chai.request(server)
                .get("/users")
                .set("Authorization", "Bearer " + invalidToken);

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });

        it("should return 401 status for no authorization token on /users GET", async function () {
            const res = await chai.request(server)
                .get("/users");

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });
    });

    describe("Test /users/verify-token POST", function () {
        it("should return that token is valid on /users/verify-token POST", async function () {
            const res = await chai.request(server)
                .post("/users/verify-token")
                .send({ token: this.validToken });

            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("isValid").equal(true);
        });

        it("should return that token is invalid on /users/verify-token POST", async function () {
            const res = await chai.request(server)
                .post("/users/verify-token")
                .send({ token: invalidToken });

            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("isValid").equal(false);
        });

        it("should return 400 status for null token on /users/verify-token POST", async function () {
            const res = await chai.request(server)
                .post("/users/verify-token")
                .send({ token: null });

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });
    });

    describe("Test /users/login-admin POST", function () {
        it("should login user with admin privileges with login on /users/login-admin POST", async function () {
            const res = await chai.request(server)
                .post("/users/login-admin")
                .send({ login: userOne.login, password: userOne.password });

            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("user");
            userProperties.forEach(prop => res.body.user.should.have.property(prop));
            res.body.user.login.should.be.equal(userOne.login);
            res.body.user.email.should.be.equal(userOne.email);
            res.body.user.admin.should.be.equal(true);
            res.body.should.have.property("token");
        });

        it("should login user with admin privileges with email on /users/login-admin POST", async function () {
            const res = await chai.request(server)
                .post("/users/login-admin")
                .send({ login: userOne.email, password: userOne.password });

            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("user");
            userProperties.forEach(prop => res.body.user.should.have.property(prop));
            res.body.user.login.should.be.equal(userOne.login);
            res.body.user.email.should.be.equal(userOne.email);
            res.body.user.admin.should.be.equal(true);
            res.body.should.have.property("token");
        });

        it("should not login user without admin privileges with login on /users/login-admin POST", async function () {
            const res = await chai.request(server)
                .post("/users/login-admin")
                .send({ login: userOne.login, password: userOne.password });

            res.should.have.status(403);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("errorMessages");
            res.body.errorMessages.should.have.property("insufficientPrivileges");
        });

        it("should not login user without admin privileges with email on /users/login-admin POST", async function () {
            const res = await chai.request(server)
                .post("/users/login-admin")
                .send({ login: userOne.email, password: userOne.password });

            res.should.have.status(403);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("errorMessages");
            res.body.errorMessages.should.have.property("insufficientPrivileges");
        });

        it("should not login user with not existing login on /users/login-admin POST", async function () {
            const res = await chai.request(server)
                .post("/users/login-admin")
                .send({ login: "aaaa", password: "bbbbbbb" });

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("errorMessages");
            res.body.errorMessages.should.have.property("loginInvalid");
        });

        it("should not login user with wrong password on /users/login-admin POST", async function () {
            const res = await chai.request(server)
                .post("/users/login-admin")
                .send({ login: userOne.login, password: "bbbbbbb" });

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("errorMessages");
            res.body.errorMessages.should.have.property("passwordInvalid");
        });

        it("should return 400 status for null login on /users/login-admin POST", async function () {
            const res = await chai.request(server)
                .post("/users/login-admin")
                .send({ login: null, password: userOne.password });

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should return 400 status for null password on /users/login-admin POST", async function () {
            const res = await chai.request(server)
                .post("/users/login-admin")
                .send({ login: userOne.login, password: null });

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });
    });

    describe("Test /users/login POST", function () {
        it("should login user with login on /users/login POST", async function () {
            const res = await chai.request(server)
                .post("/users/login")
                .send({ login: userOne.login, password: userOne.password });

            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("user");
            userProperties.forEach(prop => res.body.user.should.have.property(prop));
            res.body.user.login.should.be.equal(userOne.login);
            res.body.user.email.should.be.equal(userOne.email);
            res.body.should.have.property("token");
        });

        it("should login user with email on /users/login POST", async function () {
            const res = await chai.request(server)
                .post("/users/login")
                .send({ login: userOne.email, password: userOne.password });

            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("user");
            userProperties.forEach(prop => res.body.user.should.have.property(prop));
            res.body.user.login.should.be.equal(userOne.login);
            res.body.user.email.should.be.equal(userOne.email);
            res.body.should.have.property("token");
        });

        it("should not login user with not existing login on /users/login POST", async function () {
            const res = await chai.request(server)
                .post("/users/login")
                .send({ login: "aaaa", password: "bbbbbbb" });

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("errorMessages");
            res.body.errorMessages.should.have.property("loginInvalid");
        });

        it("should not login user with wrong password on /users/login POST", async function () {
            const res = await chai.request(server)
                .post("/users/login")
                .send({ login: userOne.login, password: "bbbbbbb" });

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("errorMessages");
            res.body.errorMessages.should.have.property("passwordInvalid");
        });

        it("should return 400 status for null login on /users/login POST", async function () {
            const res = await chai.request(server)
                .post("/users/login")
                .send({ login: null, password: userOne.password });

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should return 400 status for null password on /users/login POST", async function () {
            const res = await chai.request(server)
                .post("/users/login")
                .send({ login: userOne.login, password: null });

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });
    });

    describe("Test /users/change-password-authenticated PATCH", function () {
        it("should change user password on /users/change-password-authenticated PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/change-password-authenticated")
                .set("Authorization", "Bearer " + this.validToken)
                .send({ currentPassword: userOne.password, newPassword: "Bvcdsff345", confirmPassword: "Bvcdsff345" });

            res.should.have.status(204);
        });

        it("should not change password with wrong currentPassword on /users/change-password-authenticated PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/change-password-authenticated")
                .set("Authorization", "Bearer " + this.validToken)
                .send({ currentPassword: "ccxxdd", newPassword: "Bvcdsff345", confirmPassword: "Bvcdsff345" });

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("errorMessages");
            res.body.errorMessages.should.have.property("passIncorrect");
        });

        it("should not change password when new password has less than six characters on /users/change-password-authenticated PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/change-password-authenticated")
                .set("Authorization", "Bearer " + this.validToken)
                .send({ currentPassword: userOne.password, newPassword: "Bvcd", confirmPassword: "Bvcd" });

            res.should.have.status(422);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("errorMessages");
            res.body.errorMessages.should.have.property("passTooShort");
        })

        it("should not change password when new passwords don\"t match on /users/change-password-authenticated PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/change-password-authenticated")
                .set("Authorization", "Bearer " + this.validToken)
                .send({ currentPassword: userOne.password, newPassword: "Bvcdsff345", confirmPassword: "nyhcdsff385" });

            res.should.have.status(422);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("errorMessages");
            res.body.errorMessages.should.have.property("passDontMatch");
        });

        it("should return 401 status for invalid token on /users/change-password-authenticated PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/change-password-authenticated")
                .set("Authorization", "Bearer " + invalidToken)
                .send({ currentPassword: userOne.password, newPassword: "Bvcdsff345", confirmPassword: "Bvcdsff345" });

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });

        it("should return 401 status for no authorization token on /users/change-password-authenticated PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/change-password-authenticated")
                .send({ currentPassword: userOne.password, newPassword: "Bvcdsff345", confirmPassword: "Bvcdsff345" });

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should return 400 status for null currentPassword on /users/change-password-authenticated PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/change-password-authenticated")
                .set("Authorization", "Bearer " + this.validToken)
                .send({ currentPassword: null, newPassword: "Bvcdsff345", confirmPassword: "Bvcdsff345" });

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should return 400 status for null newPassword on /users/change-password-authenticated PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/change-password-authenticated")
                .set("Authorization", "Bearer " + this.validToken)
                .send({ currentPassword: userOne.password, newPassword: null, confirmPassword: "Bvcdsff345" });

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should return 400 status for null confirmPassword on /users/change-password-authenticated PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/change-password-authenticated")
                .set("Authorization", "Bearer " + this.validToken)
                .send({ currentPassword: userOne.password, newPassword: "Bvcdsff345", confirmPassword: null });

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });
    });

    describe("Test /users/change-password PATCH", function () {
        it("should change user password on /users/change-password PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/change-password")
                .set("Authorization", "Bearer " + this.validToken)
                .send({ password: "Bvcdsff345", confirmPassword: "Bvcdsff345" });

            res.should.have.status(204);
        });

        it("should not change password when new password has less than six characters on /users/change-password PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/change-password")
                .set("Authorization", "Bearer " + this.validToken)
                .send({ password: "Bvcd", confirmPassword: "Bvcd" });

            res.should.have.status(422);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("errorMessages");
            res.body.errorMessages.should.have.property("passTooShort");
        })

        it("should not change password when new passwords don\"t match on /users/change-password PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/change-password")
                .set("Authorization", "Bearer " + this.validToken)
                .send({ password: "Bvcdsff345", confirmPassword: "nyhcdsff385" });

            res.should.have.status(422);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("errorMessages");
            res.body.errorMessages.should.have.property("passDontMatch");
        });

        it("should return 401 status for invalid token on /users/change-password PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/change-password")
                .set("Authorization", "Bearer " + invalidToken)
                .send({ password: "Bvcdsff345", confirmPassword: "Bvcdsff345" });

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });

        it("should return 401 status for no authorization token on /users/change-password PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/change-password")
                .send({ password: "Bvcdsff345", confirmPassword: "Bvcdsff345" })

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should return 400 status for null password on /users/change-password PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/change-password")
                .set("Authorization", "Bearer " + this.validToken)
                .send({ password: null, confirmPassword: "Bvcdsff345" });

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");

        });

        it("should return 400 status for null confirmPassword on /users/change-password PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/change-password")
                .set("Authorization", "Bearer " + this.validToken)
                .send({ password: "Bvcdsff345", confirmPassword: null });

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });
    });

    describe("Test /users/personal PATCH", function () {
        it("should edit user's personal info on /users/personal PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/personal")
                .set("Authorization", "Bearer " + this.validToken)
                .send({ gender: "male", age: 25, height: 182, weight: 98 });

            res.should.have.status(204);
        });

        it("should not edit user's personal info for invalid gender on /users/personal PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/personal")
                .set("Authorization", "Bearer " + this.validToken)
                .send({ gender: "apache helicopter", age: 25, height: 182, weight: 98 });

            res.should.have.status(422);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("errorMessages");
            res.body.errorMessages.should.have.property("invalidGender");
        });

        it("should not edit user's personal info for invalid age on /users/personal PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/personal")
                .set("Authorization", "Bearer " + this.validToken)
                .send({ gender: "male", age: -30, height: 182, weight: 98 });

            res.should.have.status(422);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("errorMessages");
            res.body.errorMessages.should.have.property("invalidAge");
        });

        it("should not edit user's personal info for invalid height on /users/personal PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/personal")
                .set("Authorization", "Bearer " + this.validToken)
                .send({ gender: "male", age: 25, height: 50000, weight: 98 });

            res.should.have.status(422);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("errorMessages");
            res.body.errorMessages.should.have.property("invalidHeight");
        });

        it("should not edit user's personal info for invalid weight on /users/personal PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/personal")
                .set("Authorization", "Bearer " + this.validToken)
                .send({ gender: "male", age: 25, height: 182, weight: -300 });

            res.should.have.status(422);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("errorMessages");
            res.body.errorMessages.should.have.property("invalidWeight");
        });

        it("should return 401 status for invalid token on /users/personal PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/personal")
                .set("Authorization", "Bearer " + invalidToken)
                .send({ gender: "male", age: 25, height: 182, weight: 98 });

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });

        it("should return 401 status for no authorization token on /users/personal PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/personal")
                .send({ gender: "male", age: 25, height: 182, weight: 98 });

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should return 400 status for null gender on /users/personal PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/personal")
                .set("Authorization", "Bearer " + this.validToken)
                .send({ gender: null, age: 25, height: 182, weight: 98 });

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should return 400 status for null age on /users/personal PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/personal")
                .set("Authorization", "Bearer " + this.validToken)
                .send({ gender: "male", age: null, height: 182, weight: 98 });

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should return 400 status for null height on /users/personal PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/personal")
                .set("Authorization", "Bearer " + this.validToken)
                .send({ gender: "male", age: 25, height: null, weight: 98 });

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should return 400 status for null weight on /users/personal PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/personal")
                .set("Authorization", "Bearer " + this.validToken)
                .send({ gender: "male", age: 25, height: 182, weight: null });

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });
    });

    describe("Test /users/avatar PATCH", function () {
        it("should edit user's avatar (with avatar < 1 MB) on /users/avatar PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/avatar")
                .set("Authorization", "Bearer " + this.validToken)
                .attach("avatar", Buffer.alloc(524288), "avatar.jpg");

            res.should.have.status(201);
        });

        it("should not accept files larger than 1 MB on /users/avatar PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/avatar")
                .set("Authorization", "Bearer " + this.validToken)
                .attach("avatar", Buffer.alloc(2097152), "avatar.jpg");

            res.should.have.status(413);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });

        it("should return 401 status for invalid token on /users/avatar PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/avatar")
                .set("Authorization", "Bearer " + invalidToken)
                .attach("avatar", Buffer.alloc(524288), "avatar.jpg");

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });

        it("should return 401 status for no authorization token on /users/avatar PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/avatar")
                .attach("avatar", Buffer.alloc(524288), "avatar.jpg");

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should return 400 status for null file on /users/avatar PATCH", async function () {
            const res = await chai.request(server)
                .patch("/users/avatar")
                .set("Authorization", "Bearer " + this.validToken)
                .attach("avatar", null, "avatar.jpg");

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });
    });

    describe("Test /users/avatar DELETE", function () {
        it("should delete user's avatar on /users/avatar DELETE", async function () {
            const res = await chai.request(server)
                .delete("/users/avatar")
                .set("Authorization", "Bearer " + this.validToken);

            res.should.have.status(200);
        });

        it("should return 401 status for invalid token on /users/avatar DELETE", async function () {
            const res = await chai.request(server)
                .delete("/users/avatar")
                .set("Authorization", "Bearer " + invalidToken);

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });

        it("should return 401 status for no authorization token on /users/avatar DELETE", async function () {
            const res = await chai.request(server)
                .delete("/users/avatar");

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });
    });

    describe("Test /users/events GET", function () {
        it("should list all events that current user takes part in on /users/events GET", async function () {
            const res = await chai.request(server)
                .get("/users/events")
                .set("Authorization", "Bearer " + this.validToken);

            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a("array");
            res.body.length.should.be.equal(1);
            eventProperties.forEach(prop => res.body[0].should.have.property(prop));
        });

        it("should return 401 status for invalid token on /users/events GET", async function () {
            const res = await chai.request(server)
                .get("/users/events")
                .set("Authorization", "Bearer " + invalidToken)

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });

        it("should return 401 status for no authorization token on /users/events GET", async function () {
            const res = await chai.request(server)
                .get("/users/events")

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });
    });

    describe("Test /users/:id/events GET", function () {
        it("should list all events that user with given id takes part in on /users/:id/events GET", async function () {
            const res = await chai.request(server)
                .get(`/users/${this.eventId}/events`)
                .set("Authorization", "Bearer " + this.validToken);

            res.should.have.status(200);
            res.should.be.json;
            res.body.should.be.a("array");
            res.body.length.should.be.equal(1);
            eventProperties.forEach(prop => res.body[0].should.have.property(prop));
        });

        it("should return 401 status for invalid token on /users/:id/events GET", async function () {
            const res = await chai.request(server)
                .get(`/users/${this.eventId}/events`)
                .set("Authorization", "Bearer " + invalidToken);

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });

        it("should return 401 status for no authorization token on /users/:id/events GET", async function () {
            const res = await chai.request(server)
                .get(`/users/${this.eventId}/events`);

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should return 400 status for whitespace eventId on /users/:id/events GET", async function () {
            const res = await chai.request(server)
                .get("/users/ /events")
                .set("Authorization", "Bearer " + this.validToken);

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should return 400 status for invalid eventId on /users/:id/events GET", async function () {
            const res = await chai.request(server)
                .get("/users/aaaa5521d/events")
                .set("Authorization", "Bearer " + this.validToken);

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });
    });

    describe("Test /users/statistics POST", function () {
        it("should add user statistics on /users/statistics POST", async function () {
            const res = await chai.request(server)
                .post("/users/statistics")
                .set("Authorization", "Bearer " + this.validToken)
                .send(newStatistics);

            res.should.have.status(201);
        });

        it("should return 401 status for invalid token on /users/statistics POST", async function () {
            const res = await chai.request(server)
                .post("/users/statistics")
                .set("Authorization", "Bearer " + invalidToken)
                .send(newStatistics);

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.body.should.have.property("error");
        });

        it("should return 401 status for no authorization token on /users/statistics POST", async function () {
            const res = await chai.request(server)
                .post("/users/statistics")
                .send(newStatistics);

            res.should.have.status(401);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should return 400 status for null totalTime on /users/statistics POST", async function () {
            const invalidStatistics = { ...newStatistics };
            invalidStatistics.totalTime = null;

            const res = await chai.request(server)
                .post("/users/statistics")
                .set("Authorization", "Bearer " + this.validToken)
                .send(invalidStatistics);

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should return 400 status for null distance on /users/statistics POST", async function () {
            const invalidStatistics = { ...newStatistics };
            invalidStatistics.distance = null;

            const res = await chai.request(server)
                .post("/users/statistics")
                .set("Authorization", "Bearer " + this.validToken)
                .send(invalidStatistics);

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should return 400 status for null caloriesBurned on /users/statistics POST", async function () {
            const invalidStatistics = { ...newStatistics };
            invalidStatistics.caloriesBurned = null;

            const res = await chai.request(server)
                .post("/users/statistics")
                .set("Authorization", "Bearer " + this.validToken)
                .send(invalidStatistics);

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should return 400 status for null averageSpeed on /users/statistics POST", async function () {
            const invalidStatistics = { ...newStatistics };
            invalidStatistics.averageSpeed = null;

            const res = await chai.request(server)
                .post("/users/statistics")
                .set("Authorization", "Bearer " + this.validToken)
                .send(invalidStatistics);

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });

        it("should return 400 status for null route on /users/statistics POST", async function () {
            const invalidStatistics = { ...newStatistics };
            invalidStatistics.route = null;

            const res = await chai.request(server)
                .post("/users/statistics")
                .set("Authorization", "Bearer " + this.validToken)
                .send(invalidStatistics);

            res.should.have.status(400);
            res.should.be.json;
            res.body.should.be.a("object");
            res.should.have.property("error");
        });
    });

});