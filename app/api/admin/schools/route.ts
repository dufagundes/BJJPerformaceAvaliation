import { Prisma } from "@prisma/client";
import { hash } from "bcryptjs";
import { NextResponse } from "next/server";
import { getAdminSession, unauthorizedAdminResponse } from "../../../../lib/adminAuth";
import { prisma } from "../../../../lib/prisma";

type CreateSchoolPayload = {
  schoolName?: string;
  adminName?: string;
  adminEmail?: string;
  adminPassword?: string;
};

export async function GET() {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return unauthorizedAdminResponse();
  }

  const schools = await prisma.school.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      isActive: true,
      createdAt: true,
      _count: {
        select: {
          users: true,
          contacts: true,
          evaluationCycles: true,
        },
      },
      users: {
        where: { role: "ADMIN", isActive: true },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  return NextResponse.json({ schools }, { status: 200 });
}

export async function POST(request: Request) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return unauthorizedAdminResponse();
  }

  let payload: CreateSchoolPayload;
  try {
    payload = (await request.json()) as CreateSchoolPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const schoolName = payload.schoolName?.trim() ?? "";
  const adminName = payload.adminName?.trim() ?? "";
  const adminEmail = payload.adminEmail?.trim().toLowerCase() ?? "";
  const adminPassword = payload.adminPassword ?? "";

  if (!schoolName || !adminName || !adminEmail || !adminPassword) {
    return NextResponse.json(
      { error: "School name, admin name, admin email, and password are required." },
      { status: 400 },
    );
  }

  if (adminPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  try {
    const passwordHash = await hash(adminPassword, 12);
    const school = await prisma.school.create({
      data: {
        name: schoolName,
        users: {
          create: {
            name: adminName,
            email: adminEmail,
            passwordHash,
            role: "ADMIN",
            isActive: true,
          },
        },
        adminConfigs: {
          create: {
            defaultCycleDurationDays: 15,
            defaultContactsToInvite: 5,
            reminderScheduleDaysBefore: [3, 1],
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
    });

    return NextResponse.json({ ok: true, school }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "A school with this name or user with this email already exists." },
        { status: 409 },
      );
    }

    return NextResponse.json({ error: "Could not create school." }, { status: 500 });
  }
}