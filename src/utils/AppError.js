class AppError extends Error {
  constructor(message, statusCode = 500, options = {}) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
    this.isOperational = true;
    if (options.errors) {
      this.errors = options.errors;
    }
  }

  static badRequest(message, errors) {
    return new AppError(message, 400, { errors });
  }
}

module.exports = { AppError };
