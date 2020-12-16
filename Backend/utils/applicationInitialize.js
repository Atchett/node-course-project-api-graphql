const mongoose = require("mongoose");
const dbConfig = require("../config/dbConfig");

// connect to db
// listen on specified port
// listen for socket connections
exports.applicationInitialize = async (app, serverPort, clientPort) => {
  try {
    await mongoose.connect(
      dbConfig.MONGODB_OLD_URIFORMAT,
      dbConfig.MONGODB_CONNECTION_OPTIONS
    );
    const server = app.listen(serverPort);
    const io = require("./socket").init(server, clientPort);
    //console.log(io);
    io.on("connection", (socket) => {
      console.log("Client connected");
    });
  } catch (error) {
    console.log(error);
  }
};
