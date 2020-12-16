const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authBearer = req.get("Authorization");
  let token;
  if (!authBearer) {
    const error = new Error("No authorization token");
    error.statusCode = 403;
    throw error;
  }
  token = authBearer.split(" ")[1];
  let decodedToken;
  try {
    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    err.statusCode = 500;
    throw err;
  }
  if (!decodedToken) {
    const error = new Error("Not authenticated");
    error.statusCode = 401;
    throw error;
  }
  req.userId = decodedToken.userId;
  next();
};
