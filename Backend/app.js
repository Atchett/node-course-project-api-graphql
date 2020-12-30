const bodyParser = require("body-parser");
const express = require("express");
const path = require("path");

require("dotenv").config();

// middleware imports
const errors = require("./middleware/errors");
const headers = require("./middleware/corsHeaders");
const multer = require("./middleware/useMulter");
const { applicationInitialize } = require("./utils/applicationInitialize");
const { graphqlHTTP } = require("express-graphql");
const graphqlSchema = require("./graphql/schema");
const graphqlResolver = require("./graphql/resolvers");
const auth = require("./middleware/auth");
const { deleteFile } = require("./utils/deleteFile");
const { statusCodes, errorCodes } = require("./config/statusCodes");
const app = express();

// middleware
app.use(bodyParser.json()); // application/json
app.use(multer.useMulter);

// set global response headers
app.use(headers.setCors);

// handle authentication
app.use(auth);

// handle file upload
app.put("/post-image", (req, res, next) => {
  if (!req.isAuth) {
    const error = new Error("Not authenticated");
    error.code = errorCodes.NOT_AUTHORIZED;
    throw error;
  }
  if (!req.file) {
    return res.status(statusCodes.OK).json({ message: "No file provided" });
  }
  // oldPath comes from the request (i.e. the front end)
  if (req.body.oldPath) {
    deleteFile(req.body.oldPath);
  }
  return res
    .status(statusCodes.CREATED)
    .json({ message: "File stored", filePath: req.file.path });
});

// static handling
app.use("/images", express.static(path.join(__dirname, "images")));

app.use(
  "/graphql",
  graphqlHTTP({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql: true,
    customFormatErrorFn(err) {
      if (!err.originalError) {
        return err;
      }
      const { data, code = errorCodes.SERVER_ERROR } = err.originalError;
      const { message = "An error occurred" } = err;
      return { message, status: code, data };
    },
  })
);

// generic error handling
app.use(errors.handleError);

// login to db and start server listening
applicationInitialize(app, 8080);
