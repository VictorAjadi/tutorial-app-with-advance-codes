exports.empty = (value, message, statusCode = 404, next=null) => {
  if (!value) {
    throw new Error(message,{statusCode})
  }
};
