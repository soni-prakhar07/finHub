const bcrypt = require("bcrypt");
const { prisma } = require("../config/prisma");
const { AppError } = require("../utils/AppError");

const SALT_ROUNDS = 10;

const ROLES = ["VIEWER", "ANALYST", "ADMIN"];

function sanitizeUser(user) {
  if (!user) {
    return null;
  }
  const { password: _p, ...rest } = user;
  return rest;
}

function assertRole(value) {
  if (!ROLES.includes(value)) {
    throw new AppError(`role must be one of: ${ROLES.join(", ")}`, 400);
  }
}

async function createUser({ name, email, password, role }) {
  if (!name || !email || !password || !role) {
    throw new AppError("name, email, password, and role are required", 400);
  }

  assertRole(role);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new AppError("Email already in use", 409);
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role,
    },
  });

  return sanitizeUser(user);
}

async function listUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
  });
  return users.map(sanitizeUser);
}

async function updateUserRole(userId, { role }, actor) {
  if (!role) {
    throw new AppError("role is required", 400);
  }

  assertRole(role);

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    throw new AppError("User not found", 404);
  }

  if (
    existing.role === "ADMIN" &&
    actor &&
    existing.id !== actor.id
  ) {
    throw new AppError("Cannot change another admin's role", 403);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { role },
  });

  return sanitizeUser(user);
}

async function deleteUser(userId, actor) {
  if (!actor?.id) {
    throw new AppError("Authentication required", 401);
  }

  if (userId === actor.id) {
    throw new AppError("You cannot delete your own account", 400);
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    throw new AppError("User not found", 404);
  }

  if (existing.role === "ADMIN") {
    throw new AppError("Cannot delete an administrator account", 403);
  }

  await prisma.user.delete({ where: { id: userId } });
}

async function setUserStatus(userId, { status }) {
  if (typeof status !== "boolean") {
    throw new AppError("status must be a boolean", 400);
  }

  const existing = await prisma.user.findUnique({ where: { id: userId } });
  if (!existing) {
    throw new AppError("User not found", 404);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { status },
  });

  return sanitizeUser(user);
}

module.exports = {
  createUser,
  listUsers,
  updateUserRole,
  deleteUser,
  setUserStatus,
  sanitizeUser,
};
