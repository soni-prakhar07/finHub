const { body, param, query } = require("express-validator");

const listRules = [
  query("type")
    .optional({ values: "falsy" })
    .isIn(["INCOME", "EXPENSE"])
    .withMessage("type must be INCOME or EXPENSE"),
  query("category").optional({ values: "falsy" }).isString().trim(),
  query("dateFrom")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Invalid dateFrom"),
  query("dateTo")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("Invalid dateTo"),
  query("page")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer"),
  query("limit")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be an integer between 1 and 100"),
];

const createRules = [
  body("amount")
    .isFloat({ gt: 0 })
    .withMessage("amount must be a positive number"),
  body("type")
    .isIn(["INCOME", "EXPENSE"])
    .withMessage("type must be INCOME or EXPENSE"),
  body("category").trim().notEmpty().withMessage("category is required"),
  body("date").isISO8601().withMessage("date must be a valid ISO 8601 date"),
  body("userId").isUUID().withMessage("userId must be a valid UUID"),
  body("notes").optional({ nullable: true }).isString(),
];

const updateRules = [
  param("id").isUUID().withMessage("Invalid record id"),
  body("amount")
    .optional()
    .isFloat({ gt: 0 })
    .withMessage("amount must be a positive number"),
  body("type")
    .optional()
    .isIn(["INCOME", "EXPENSE"])
    .withMessage("type must be INCOME or EXPENSE"),
  body("category").optional().trim().notEmpty().withMessage("category cannot be empty"),
  body("date").optional().isISO8601().withMessage("date must be a valid ISO 8601 date"),
  body("userId").optional().isUUID().withMessage("userId must be a valid UUID"),
  body("notes").optional({ nullable: true }).isString(),
];

const deleteRules = [param("id").isUUID().withMessage("Invalid record id")];

module.exports = {
  listRules,
  createRules,
  updateRules,
  deleteRules,
};
