const { body, param } = require("express-validator");

const ROLES = ["VIEWER", "ANALYST", "ADMIN"];

const createUserRules = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("Valid email is required"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
  body("role")
    .isIn(ROLES)
    .withMessage(`role must be one of: ${ROLES.join(", ")}`),
];

const updateRoleRules = [
  param("id").isUUID().withMessage("Invalid user id"),
  body("role")
    .isIn(ROLES)
    .withMessage(`role must be one of: ${ROLES.join(", ")}`),
];

const updateStatusRules = [
  param("id").isUUID().withMessage("Invalid user id"),
  body("status").isBoolean().withMessage("status must be a boolean"),
];

const deleteUserRules = [param("id").isUUID().withMessage("Invalid user id")];

module.exports = {
  createUserRules,
  updateRoleRules,
  updateStatusRules,
  deleteUserRules,
};
