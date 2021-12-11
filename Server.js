require("./database/DatabaseService");
const userRoutes = require("./api/routes/UsersRoutes");
const eventRoutes = require("./api/routes/EventsRoutes");
const express = require("express");
const cors = require("cors");
const port = process.env.PORT || 3000;

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors());

userRoutes(app);
eventRoutes(app);

module.exports = app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
