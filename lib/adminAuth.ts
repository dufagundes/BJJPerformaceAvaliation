import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";

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
  if (session?.user?.role !== "ADMIN" || !session.user.id || !session.user.schoolId) {
    return null;
  }

  return {
    userId: session.user.id,
    schoolId: session.user.schoolId,
    schoolName: session.user.schoolName,
  };
}