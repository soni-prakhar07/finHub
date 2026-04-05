const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { Pool } = require("pg");

/**
 * Prefer plain DATABASE_PASSWORD in .env (no URL encoding for @ etc.).
 * Otherwise use DATABASE_URL (encode @ in password as %40).
 */
function poolConfigFromEnv() {
  const password = process.env.DATABASE_PASSWORD;
  if (password !== undefined && password !== "") {
    return {
      user: process.env.DATABASE_USER || "postgres",
      password: String(password),
      host: process.env.DATABASE_HOST || "127.0.0.1",
      port: Number.parseInt(process.env.DATABASE_PORT || "5432", 10),
      database: process.env.DATABASE_NAME || "finance_db",
    };
  }

  const raw = process.env.DATABASE_URL;
  const connectionString = String(raw ?? "")
    .trim()
    .replace(/^["']|["']$/g, "");

  if (!connectionString) {
    throw new Error(
      "Set DATABASE_URL or DATABASE_PASSWORD (and optional DATABASE_USER, DATABASE_HOST, DATABASE_NAME)"
    );
  }

  return { connectionString };
}

const pool = new Pool(poolConfigFromEnv());
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

module.exports = { prisma, pool };
