/**
 * Standard API Response Handlers
 */

exports.sendSuccess = (res, statusCode = 200, message = "Success", data = null, extra = {}) => {
  const response = {
    success: true,
    message,
    ...extra,
  };
  if (data !== null) {
    response.data = data;
  }
  return res.status(statusCode).json(response);
};

exports.sendError = (res, statusCode = 500, message = "An error occurred", error = null) => {
  const response = {
    success: false,
    message,
  };
  if (process.env.NODE_ENV === "development" && error) {
    response.error = error;
  }
  return res.status(statusCode).json(response);
};
