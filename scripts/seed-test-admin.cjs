const { PrismaClient, UserRole } = require("@prisma/client");
const { hash } = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  const email = "admin@test.local";
  const password = "Admin123!";
  const passwordHash = await hash(password, 10);

  const existing = await prisma.user.findUnique({ where: { email } });
  const user = await prisma.user.upsert({
    where: { email },
    create: {
      name: "Test Admin",
      email,
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
    update: {
      name: "Test Admin",
      passwordHash,
      role: UserRole.ADMIN,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
    },
  });

  const action = existing ? "updated" : "created";
  console.log(`Test admin ${action}: ${user.email}`);
}

main()
  .catch((error) => {
    console.error("Failed to seed test admin:", error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });