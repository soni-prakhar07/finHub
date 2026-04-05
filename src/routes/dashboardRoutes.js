const express = require("express");
const { policies } = require("../config/accessControl");
const { authenticate } = require("../middleware/authMiddleware");
const { requireRoles } = require("../middleware/roleMiddleware");
const { validateRequest } = require("../middleware/validateRequest");
const { recentRules } = require("../validators/dashboardValidators");
const dashboardController = require("../controllers/dashboardController");

const router = express.Router();

router.use(authenticate);
router.use(requireRoles(...policies.dashboard));

router.get("/summary", dashboardController.summary);
router.get("/categories", dashboardController.categories);
router.get("/trends", dashboardController.trends);
router.get("/insights", dashboardController.insights);
router.get(
  "/recent",
  recentRules,
  validateRequest,
  dashboardController.recent
);

module.exports = router;
