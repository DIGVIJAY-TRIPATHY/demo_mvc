// Throw this anywhere (controllers, services, middleware).
// errorHandler turns it into a JSON response or an error page.
class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.name = "HttpError";
    this.statusCode = statusCode;
  }
}

module.exports = { HttpError };
