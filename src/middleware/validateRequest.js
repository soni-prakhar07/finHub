const { validationResult } = require("express-validator");
const { AppError } = require("../utils/AppError");

function validateRequest(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) {
    return next();
  }

  const errors = result.array({ onlyFirstError: true }).map((e) => ({
    field: e.path,
    message: e.msg,
  }));

  next(AppError.badRequest("Validation failed", errors));
}

module.exports = { validateRequest };
