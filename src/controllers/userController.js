const { asyncHandler } = require("../middleware/asyncHandler");
const userService = require("../services/userService");

const listUsers = asyncHandler(async (req, res) => {
  const users = await userService.listUsers();
  res.status(200).json({ users });
});

const createUser = asyncHandler(async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json({ message: "User created", user });
});

const updateRole = asyncHandler(async (req, res) => {
  const user = await userService.updateUserRole(
    req.params.id,
    req.body,
    req.user
  );
  res.status(200).json({ message: "Role updated", user });
});

const updateStatus = asyncHandler(async (req, res) => {
  const user = await userService.setUserStatus(req.params.id, req.body);
  res.status(200).json({ message: "User status updated", user });
});

const removeUser = asyncHandler(async (req, res) => {
  await userService.deleteUser(req.params.id, req.user);
  res.status(204).send();
});

module.exports = {
  listUsers,
  createUser,
  updateRole,
  updateStatus,
  removeUser,
};
