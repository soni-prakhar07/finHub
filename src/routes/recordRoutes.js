const express = require("express");
const { policies } = require("../config/accessControl");
const { authenticate } = require("../middleware/authMiddleware");
const { requireRoles } = require("../middleware/roleMiddleware");
const { validateRequest } = require("../middleware/validateRequest");
const {
  listRules,
  createRules,
  updateRules,
  deleteRules,
} = require("../validators/recordValidators");
const recordController = require("../controllers/recordController");

const router = express.Router();

router.get(
  "/",
  authenticate,
  requireRoles(...policies.recordsRead),
  listRules,
  validateRequest,
  recordController.list
);

router.post(
  "/",
  authenticate,
  requireRoles(...policies.recordsWrite),
  createRules,
  validateRequest,
  recordController.create
);

router.put(
  "/:id",
  authenticate,
  requireRoles(...policies.recordsWrite),
  updateRules,
  validateRequest,
  recordController.update
);

router.delete(
  "/:id",
  authenticate,
  requireRoles(...policies.recordsWrite),
  deleteRules,
  validateRequest,
  recordController.remove
);

module.exports = router;
