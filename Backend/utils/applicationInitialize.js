const mongoose = require("mongoose");
const dbConfig = require("../config/dbConfig");

// connect to db
// listen on specified port
// listen for socket connections
exports.applicationInitialize = async (app, serverPort) => {
  try {
    await mongoose.connect(
      dbConfig.MONGODB_OLD_URIFORMAT,
      dbConfig.MONGODB_CONNECTION_OPTIONS
    );
    app.listen(serverPort);
  } catch (error) {
    console.log(error);
  }
};
