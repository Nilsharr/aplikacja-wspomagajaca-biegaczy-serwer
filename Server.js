require("./database/DatabaseService");
const routes = require("./api/routes/UsersRoutes");
const express = require("express");
const expressOasGenerator = require("express-oas-generator");

const app = express();
// swagger
expressOasGenerator.handleResponses(app, {});

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
routes(app);

// swagger
expressOasGenerator.handleRequests();
app.listen(process.env.PORT, () => { console.log("Server running on port 3000") });


