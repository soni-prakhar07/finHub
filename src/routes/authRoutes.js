const express = require("express");
const { validateRequest } = require("../middleware/validateRequest");
const { registerRules, loginRules } = require("../validators/authValidators");
const authController = require("../controllers/authController");

const router = express.Router();

router.post(
  "/register",
  registerRules,
  validateRequest,
  authController.register
);
router.post("/login", loginRules, validateRequest, authController.login);

module.exports = router;
