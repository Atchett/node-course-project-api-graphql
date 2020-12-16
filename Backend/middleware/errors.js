exports.handleError = (error, req, res, next) => {
  console.log(error);
  const statusCode = error.statusCode || 500;
  const message = error.message || "Error occurred";
  const data = error.data || null;
  res.status(statusCode).json({ message, data });
};
