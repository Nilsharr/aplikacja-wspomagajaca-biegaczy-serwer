require("./database/DatabaseService");
const routes = require("./api/routes/UsersRoutes");
const express = require("express");

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
routes(app);

app.listen(process.env.PORT || 3000, () => { console.log("Server running on port " + process.env.PORT || 3000) });


