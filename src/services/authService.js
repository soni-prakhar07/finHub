const bcrypt = require("bcrypt");
const { prisma } = require("../config/prisma");
const { signToken } = require("../utils/jwt");
const { AppError } = require("../utils/AppError");

const SALT_ROUNDS = 10;

function sanitizeUser(user) {
  if (!user) {
    return null;
  }
  const { password: _p, ...rest } = user;
  return rest;
}

async function register({ name, email, password }) {
  if (!name || !email || !password) {
    throw new AppError("Name, email, and password are required", 400);
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError("Email already registered", 409);
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: "VIEWER",
    },
  });

  return sanitizeUser(user);
}

async function login({ email, password }) {
  if (!email || !password) {
    throw new AppError("Email and password are required", 400);
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.status) {
    throw new AppError("Invalid email or password", 401);
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    throw new AppError("Invalid email or password", 401);
  }

  const token = signToken({
    sub: user.id,
    email: user.email,
    role: user.role,
  });

  return {
    token,
    user: sanitizeUser(user),
  };
}

module.exports = { register, login, sanitizeUser };
