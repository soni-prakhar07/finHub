const { AppError } = require("../utils/AppError");

function isPrismaKnownError(err) {
  return Boolean(err && typeof err.code === "string" && err.code.startsWith("P"));
}

function logServerError(err, req, status) {
  const info = {
    method: req.method,
    path: req.originalUrl || req.url,
    status,
    name: err?.name,
    message: err?.message,
  };
  if (err?.code) {
    info.code = err.code;
  }
  if (isPrismaKnownError(err) && err.meta) {
    info.prismaMeta = err.meta;
  }

  console.error("[API Error]", info);
  if (err?.stack) {
    console.error(err.stack);
  }
}

function errorMiddleware(err, req, res, next) {
  if (res.headersSent) {
    console.error("[API Error] (headers already sent)", err?.message, err?.stack);
    return next(err);
  }

  if (err instanceof SyntaxError && "body" in err) {
    logServerError(err, req, 400);
    return res.status(400).json({ message: "Invalid JSON" });
  }

  let status = err.statusCode || err.status || 500;
  let message = err.message || "Internal server error";
  let errors = err.errors;

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    status = 401;
    message = "Invalid or expired token";
  }

  if (isPrismaKnownError(err)) {
    if (err.code === "P2002") {
      status = 409;
      message = "A record with this value already exists";
    } else if (err.code === "P2025") {
      status = 404;
      message = "Record not found";
    } else if (err.code === "P2003") {
      status = 400;
      message = "Invalid relation reference";
    }
  }

  const isOperational = err instanceof AppError && err.isOperational;
  if (status === 500 && !isOperational) {
    message = "Internal server error";
    errors = undefined;
  }

  logServerError(err, req, status);

  const body = { message };
  if (errors && Array.isArray(errors)) {
    body.errors = errors;
  }

  if (process.env.NODE_ENV !== "production") {
    body.detail = err.message;
  }

  res.status(status).json(body);
}

module.exports = { errorMiddleware };
