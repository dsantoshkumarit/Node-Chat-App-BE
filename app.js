const express = require("express");
const cors = require("cors");

const app = express();
//Adding cross origin access
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Add the routes
app.use("/user", require("./routes/user"));
app.use("/chatroom", require("./routes/chatroom"));

//add error handlers
const errorHandlers = require("./handlers/errorHandlers");
app.use(errorHandlers.notFound);
app.use(errorHandlers.mongooseErrors);
if (process.env.ENV === "DEVELOPMENT") {
  app.use(errorHandlers.developmentErrors);
} else {
  app.use(errorHandlers.productionErrors);
}

module.exports = app;
