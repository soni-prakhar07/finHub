const { asyncHandler } = require("../middleware/asyncHandler");
const authService = require("../services/authService");

const register = asyncHandler(async (req, res) => {
  const user = await authService.register(req.body);
  res.status(201).json({ message: "User registered successfully", user });
});

const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.status(200).json({
    message: "Login successful",
    token: result.token,
    user: result.user,
  });
});

module.exports = { register, login };
