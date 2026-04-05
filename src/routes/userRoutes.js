const express = require("express");
const { policies } = require("../config/accessControl");
const { authenticate } = require("../middleware/authMiddleware");
const { requireRoles } = require("../middleware/roleMiddleware");
const { validateRequest } = require("../middleware/validateRequest");
const {
  createUserRules,
  updateRoleRules,
  updateStatusRules,
  deleteUserRules,
} = require("../validators/userValidators");
const userController = require("../controllers/userController");

const router = express.Router();

router.get(
  "/",
  authenticate,
  requireRoles(...policies.usersManage),
  userController.listUsers
);

router.post(
  "/",
  authenticate,
  requireRoles(...policies.usersManage),
  createUserRules,
  validateRequest,
  userController.createUser
);

router.patch(
  "/:id/role",
  authenticate,
  requireRoles(...policies.usersManage),
  updateRoleRules,
  validateRequest,
  userController.updateRole
);

router.patch(
  "/:id/status",
  authenticate,
  requireRoles(...policies.usersManage),
  updateStatusRules,
  validateRequest,
  userController.updateStatus
);

router.delete(
  "/:id",
  authenticate,
  requireRoles(...policies.usersManage),
  deleteUserRules,
  validateRequest,
  userController.removeUser
);

module.exports = router;
