const { verifyToken } = require("../utils/jwt");
const { prisma } = require("../config/prisma");
const { AppError } = require("../utils/AppError");

async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return next(new AppError("Authentication required", 401));
    }

    const token = header.slice("Bearer ".length).trim();
    if (!token) {
      return next(new AppError("Authentication required", 401));
    }

    const decoded = verifyToken(token);

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
    });

    if (!user || !user.status) {
      return next(new AppError("Unauthorized", 401));
    }

    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return next(new AppError("Invalid or expired token", 401));
    }
    return next(err);
  }
}

module.exports = { authenticate };
