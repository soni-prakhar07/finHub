/**
 * Create an ADMIN user using the same DB config as the API (.env).
 *
 * Usage (from project root):
 *   npm run create-admin -- --name "Admin" --email admin@example.com --password "yourPassword"
 *
 * Short flags: -n, -e, -p
 */

require("dotenv").config();

const bcrypt = require("bcrypt");
const { prisma, pool } = require("../src/config/prisma");

const SALT_ROUNDS = 10;

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--name" || a === "-n") {
      out.name = argv[++i];
    } else if (a === "--email" || a === "-e") {
      out.email = argv[++i];
    } else if (a === "--password" || a === "-p") {
      out.password = argv[++i];
    }
  }
  return out;
}

async function main() {
  const { name, email, password } = parseArgs(process.argv);

  if (!name || !email || !password) {
    console.error(
      "Usage: npm run create-admin -- --name <name> --email <email> --password <password>"
    );
    process.exitCode = 1;
    return;
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.error(`User already exists: ${email}`);
    process.exitCode = 1;
    return;
  }

  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashed,
      role: "ADMIN",
    },
  });

  console.log(`Admin user created: ${user.email} (${user.id})`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
