import { prisma } from "./prisma";

export async function getOrCreateAdminConfig(schoolId: string) {
  const existing = await prisma.adminConfig.findUnique({
    where: { schoolId },
  });

  if (existing) {
    return existing;
  }

  return prisma.adminConfig.create({
    data: {
      schoolId,
      defaultCycleDurationDays: 15,
      defaultContactsToInvite: 5,
      reminderScheduleDaysBefore: [3, 1],
    },
  });
}
