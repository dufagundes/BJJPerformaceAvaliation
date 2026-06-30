import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { createHash, randomUUID } from "crypto";
import { getAdminSession, unauthorizedAdminResponse } from "../../../../lib/adminAuth";
import { prisma } from "../../../../lib/prisma";
import { STAFF_ROLES } from "../../../../lib/staffRoles";

export async function GET() {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return unauthorizedAdminResponse();
  }

  try {
    const staffMembers = await prisma.user.findMany({
      where: {
        schoolId: adminSession.schoolId,
        role: "STAFF",
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        staffProfile: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ staffMembers });
  } catch {
    return NextResponse.json({ error: "Could not load staff members." }, { status: 503 });
  }
}

type CreateStaffPayload = {
  name?: string;
  email?: string;
  role?: string;
};

export async function POST(request: Request) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return unauthorizedAdminResponse();
  }

  let payload: CreateStaffPayload;
  try {
    payload = (await request.json()) as CreateStaffPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const name = payload.name?.trim() ?? "";
  const email = payload.email?.trim().toLowerCase() ?? "";
  const role = payload.role?.trim() ?? "";

  if (!name || !email || !role) {
    return NextResponse.json({ error: "Name, email, and role are required." }, { status: 400 });
  }

  if (!STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number])) {
    return NextResponse.json({ error: "Invalid role selected." }, { status: 400 });
  }

  try {
    const passwordHash = createHash("sha256").update(randomUUID()).digest("hex");

    const staffMember = await prisma.user.create({
      data: {
        schoolId: adminSession.schoolId,
        name,
        email,
        passwordHash,
        role: "STAFF",
        staffProfile: {
          create: {
            title: role,
            isActive: true,
          },
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        staffProfile: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    return NextResponse.json({ ok: true, staffMember }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A staff member with this email already exists." }, { status: 409 });
    }

    return NextResponse.json(
      { error: "Could not create staff member. Check that the email is unique and the database is available." },
      { status: 500 },
    );
  }
}