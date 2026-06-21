import { NextResponse } from "next/server";
import { isAdminApiRequestAuthorized, unauthorizedAdminResponse } from "../../../../../lib/adminAuth";
import { getOrCreateAdminConfig } from "../../../../../lib/adminConfig";
import { prisma } from "../../../../../lib/prisma";

export async function GET(request: Request) {
  if (!(await isAdminApiRequestAuthorized(request))) {
    return unauthorizedAdminResponse();
  }

  const [config, staffMembers, contactsCount] = await Promise.all([
    getOrCreateAdminConfig(),
    prisma.user.findMany({
      where: {
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
    prisma.contact.count({ where: { isActive: true } }),
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
