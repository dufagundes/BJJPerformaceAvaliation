import { ContactType, Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAdminSession, unauthorizedAdminResponse } from "../../../../../lib/adminAuth";
import { prisma } from "../../../../../lib/prisma";

type UpdateContactPayload = {
  type?: string;
  name?: string;
  email?: string;
  studentName?: string;
  status?: "ACTIVE" | "INACTIVE";
};

function normalizeType(input: string | undefined): ContactType | null {
  if (!input) {
    return null;
  }

  const value = input.trim().toUpperCase();
  if (value === "STUDENT") {
    return ContactType.STUDENT;
  }
  if (value === "PARENT") {
    return ContactType.PARENT;
  }
  return null;
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ contactId: string }> },
) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return unauthorizedAdminResponse();
  }

  const { contactId } = await context.params;
  if (!contactId) {
    return NextResponse.json({ error: "contactId is required." }, { status: 400 });
  }

  let payload: UpdateContactPayload;
  try {
    payload = (await request.json()) as UpdateContactPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const type = normalizeType(payload.type);
  const name = payload.name?.trim();
  const email = payload.email?.trim().toLowerCase();
  const studentName = payload.studentName?.trim();
  const isActive = payload.status ? payload.status === "ACTIVE" : undefined;

  if (payload.type && !type) {
    return NextResponse.json({ error: "Invalid contact type." }, { status: 400 });
  }

  const existing = await prisma.contact.findFirst({
    where: { id: contactId, schoolId: adminSession.schoolId },
    select: { id: true, type: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Contact not found." }, { status: 404 });
  }

  const finalType = type ?? existing.type;
  const finalStudentName = finalType === ContactType.PARENT ? (studentName ?? undefined) : null;

  if (finalType === ContactType.PARENT && (!finalStudentName || finalStudentName.length === 0)) {
    return NextResponse.json({ error: "studentName is required for Parent contacts." }, { status: 400 });
  }

  try {
    const contact = await prisma.contact.update({
      where: { id: contactId },
      data: {
        type: finalType,
        ...(name !== undefined ? { name } : {}),
        ...(email !== undefined ? { email } : {}),
        studentName: finalStudentName,
        ...(isActive !== undefined ? { isActive } : {}),
      },
      select: {
        id: true,
        type: true,
        name: true,
        email: true,
        studentName: true,
        isActive: true,
      },
    });

    return NextResponse.json({ ok: true, contact }, { status: 200 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "A contact with that email already exists." }, { status: 409 });
    }

    return NextResponse.json({ error: "Could not update contact." }, { status: 500 });
  }
}
