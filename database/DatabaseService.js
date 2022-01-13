const mongoose = require("mongoose");

mongoose.connect(process.env.CONNECTION_STRING, {
  useNewUrlParser: true,
});
mongoose.connection.on("connected", () => {
  //console.log("Connected to the db");
});
