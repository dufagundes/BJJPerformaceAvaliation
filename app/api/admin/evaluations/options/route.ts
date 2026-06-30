import { NextResponse } from "next/server";
import { getAdminSession, unauthorizedAdminResponse } from "../../../../../lib/adminAuth";
import { getOrCreateAdminConfig } from "../../../../../lib/adminConfig";
import { prisma } from "../../../../../lib/prisma";

export async function GET(_request: Request) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return unauthorizedAdminResponse();
  }

  const [config, staffMembers, contactsCount] = await Promise.all([
    getOrCreateAdminConfig(adminSession.schoolId),
    prisma.user.findMany({
      where: {
        schoolId: adminSession.schoolId,
        role: "STAFF",
        isActive: true,
        staffProfile: {
          is: {
            isActive: true,
          },
        },
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        staffProfile: {
          select: {
            title: true,
          },
        },
      },
    }),
    prisma.contact.count({ where: { schoolId: adminSession.schoolId, isActive: true } }),
  ]);

  return NextResponse.json(
    {
      config,
      staffMembers,
      activeContactsCount: contactsCount,
    },
    { status: 200 },
  );
}
