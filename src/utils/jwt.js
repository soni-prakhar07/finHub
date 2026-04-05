const jwt = require("jsonwebtoken");
const { AppError } = require("./AppError");

const JWT_SECRET = process.env.JWT_SECRET;

function signToken(payload) {
  if (!JWT_SECRET) {
    throw new AppError("JWT_SECRET is not configured", 500);
  }
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

function verifyToken(token) {
  if (!JWT_SECRET) {
    throw new AppError("JWT_SECRET is not configured", 500);
  }
  return jwt.verify(token, JWT_SECRET);
}

module.exports = { signToken, verifyToken };
