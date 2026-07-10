import { ContactType, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAdminSession, unauthorizedAdminResponse } from "../../../../lib/adminAuth";
import { prisma } from "../../../../lib/prisma";

type CreateContactPayload = {
  type?: string;
  name?: string;
  email?: string;
  phone?: string;
  studentName?: string;
  status?: "ACTIVE" | "INACTIVE";
};

function normalizeType(input: string): ContactType | null {
  const value = input.trim().toUpperCase();
  if (value === "STUDENT") {
    return ContactType.STUDENT;
  }
  if (value === "PARENT") {
    return ContactType.PARENT;
  }
  return null;
}

export async function GET(_request: Request) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return unauthorizedAdminResponse();
  }

  try {
    const contacts = await prisma.contact.findMany({
      where: { schoolId: adminSession.schoolId },
      orderBy: [{ name: "asc" }],
      select: {
        id: true,
        type: true,
        name: true,
        email: true,
        studentName: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ contacts }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Could not load contacts." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return unauthorizedAdminResponse();
  }

  let payload: CreateContactPayload;
  try {
    payload = (await request.json()) as CreateContactPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const type = normalizeType(payload.type ?? "");
  const name = payload.name?.trim() ?? "";
  const email = payload.email?.trim().toLowerCase() ?? "";
  const phone = payload.phone?.trim() || null;
  const studentName = payload.studentName?.trim() || null;
  const isActive = (payload.status ?? "ACTIVE") === "ACTIVE";

  if (!type || !name || !email) {
    return NextResponse.json({ error: "type, name, and email are required." }, { status: 400 });
  }

  if (type === ContactType.PARENT && !studentName) {
    return NextResponse.json({ error: "studentName is required for Parent contacts." }, { status: 400 });
  }

  try {
    const contact = await prisma.contact.create({
      data: {
        schoolId: adminSession.schoolId,
        type,
        name,
        email,
        phone,
        studentName: type === ContactType.PARENT ? studentName : null,
        isActive,
      },
      select: {
        id: true,
        type: true,
        name: true,
        email: true,
        phone: true,
        studentName: true,
        isActive: true,
      },
    });

    return NextResponse.json({ ok: true, contact }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A contact with that email already exists." }, { status: 409 });
    }

    return NextResponse.json({ error: "Could not create contact." }, { status: 500 });
  }
}
