const bodyParser = require("body-parser");
const express = require("express");
const path = require("path");

require("dotenv").config();

// route imports
const feedRoutes = require("./routes/feed");
const authRoutes = require("./routes/auth");

// middleware imports
const errors = require("./middleware/errors");
const headers = require("./middleware/corsHeaders");
const multer = require("./middleware/useMulter");
const { applicationInitialize } = require("./utils/applicationInitialize");

const app = express();

// middleware
app.use(bodyParser.json()); // application/json
app.use(multer.useMulter);

// set global response headers
app.use(headers.setCors);

// route handling
app.use("/feed", feedRoutes);
app.use("/auth", authRoutes);
app.use("/images", express.static(path.join(__dirname, "images")));

// generic error handling
app.use(errors.handleError);

// login to db and start server listening
applicationInitialize(app, 8080, 3000);
