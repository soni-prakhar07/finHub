const { AppError } = require("../utils/AppError");

/**
 * @param {...string} allowedRoles - One or more roles that may access the route.
 */
function requireRoles(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError("Authentication required", 401));
    }

    if (!allowedRoles.includes(req.user.role)) {
      const required = allowedRoles.join(", ");
      return next(
        new AppError(
          `Forbidden: this action requires one of [${required}]`,
          403
        )
      );
    }

    next();
  };
}

module.exports = { requireRoles };
