const { query } = require("express-validator");

const recentRules = [
  query("page")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("page must be a positive integer"),
  query("limit")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be an integer between 1 and 100"),
];

module.exports = { recentRules };
