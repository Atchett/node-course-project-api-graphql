const { errorCodes } = require("../config/statusCodes");

exports.authCheck = (req) => {
  if (!req.isAuth) {
    const error = new Error("Not authenticated");
    error.code = errorCodes.NOT_AUTHENTICATED;
    throw error;
  }
};
