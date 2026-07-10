// @ts-ignore
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

export type AdminSession = {
  userId: string;
  schoolId: string;
  schoolName?: string | null;
};

export function unauthorizedAdminResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function isAdminApiRequestAuthorized(_request: Request): Promise<boolean> {
  return (await getAdminSession()) !== null;
}

export async function hasAdminSession(): Promise<boolean> {
  return (await getAdminSession()) !== null;
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN" || !session.user.id) {
    return null;
  }

  if (!session.user.schoolId) {
    const user = await prisma.user.findFirst({
      where: {
        id: session.user.id,
        role: "ADMIN",
        isActive: true,
        school: {
          is: {
            isActive: true,
          },
        },
      },
      select: {
        schoolId: true,
        school: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!user) {
      return null;
    }

    return {
      userId: session.user.id,
      schoolId: user.schoolId,
      schoolName: user.school.name,
    };
  }

  return {
    userId: session.user.id,
    schoolId: session.user.schoolId,
    schoolName: session.user.schoolName,
  };
}