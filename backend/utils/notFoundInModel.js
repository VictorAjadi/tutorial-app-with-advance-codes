const customError = require("./customError");

exports.empty = (value, message, statusCode = 404, next) => {
  if (!value) {
    return next(new customError(message, statusCode));
  }
};
