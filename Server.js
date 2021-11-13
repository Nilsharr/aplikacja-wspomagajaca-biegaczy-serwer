require("./database/DatabaseService");
const routes = require("./api/routes/UsersRoutes");
const express = require("express");
const port = process.env.PORT || 3000;

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
routes(app);

module.exports = app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});


