import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "error", "warn"],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function testConnection() {
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "✓ set" : "✗ missing");
  console.log("DIRECT_URL:  ", process.env.DIRECT_URL ? "✓ set" : "✗ missing (optional for runtime)");
  console.log("");
  console.log("Connecting to database...");

  try {
    // Raw query — works even if migrations haven't run yet
    const result = await prisma.$queryRaw`SELECT current_database(), current_user, version()`;
    console.log("✓ Connection successful!");
    console.log("  Database:", result[0].current_database);
    console.log("  User:    ", result[0].current_user);
    console.log("  Version: ", result[0].version.split(" ").slice(0, 2).join(" "));
  } catch (err) {
    console.error("✗ Connection failed:", err.message);
    process.exit(1);
  }

  try {
    const userCount = await prisma.user.count();
    console.log(`\n✓ User table accessible — ${userCount} row(s) found.`);
  } catch (err) {
    console.error("\n✗ Could not query User table:", err.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }

  console.log("\nAll checks passed. Database is reachable and ready.");
}

testConnection();
