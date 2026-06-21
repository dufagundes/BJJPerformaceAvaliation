import { prisma } from "./prisma";

export const ADMIN_CONFIG_ID = "default";

export async function getOrCreateAdminConfig() {
  const existing = await prisma.adminConfig.findUnique({
    where: { id: ADMIN_CONFIG_ID },
  });

  if (existing) {
    return existing;
  }

  return prisma.adminConfig.create({
    data: {
      id: ADMIN_CONFIG_ID,
      defaultCycleDurationDays: 15,
      defaultContactsToInvite: 5,
      reminderScheduleDaysBefore: [3, 1],
    },
  });
}
