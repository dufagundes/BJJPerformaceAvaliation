import { ContactType } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAdminSession, unauthorizedAdminResponse } from "../../../../../lib/adminAuth";
import { prisma } from "../../../../../lib/prisma";
import { normalizePhoneNumber } from "../../../../../lib/phoneUtils";

type ImportContactRow = {
  type: "STUDENT" | "PARENT";
  name: string;
  email: string;
  phone?: string;
  studentName?: string;
};

type ImportPayload = {
  rows?: ImportContactRow[];
};

export async function POST(request: Request) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return unauthorizedAdminResponse();
  }

  let payload: ImportPayload;
  try {
    payload = (await request.json()) as ImportPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const rows = payload.rows ?? [];
  if (rows.length === 0) {
    return NextResponse.json({ error: "No rows provided for import." }, { status: 400 });
  }

  const normalizedRows = rows.map((row) => ({
    type: row.type,
    name: row.name.trim(),
    email: row.email.trim().toLowerCase(),
    phone: row.phone?.trim(),
    studentName: row.studentName?.trim(),
  }));

  const emails = Array.from(new Set(normalizedRows.map((row) => row.email).filter((email) => email.length > 0)));
  const existing = await prisma.contact.findMany({
    where: { schoolId: adminSession.schoolId, email: { in: emails } },
    select: { id: true, email: true },
  });

  const existingMap = new Map(existing.map((contact) => [contact.email.toLowerCase(), contact.id]));
  const seenInFile = new Set<string>();
  const skipped: Array<{ email: string; reason: string }> = [];
  const toCreate = [] as Array<{
    type: ContactType;
    name: string;
    email: string;
    phone: string | null;
    studentName: string | null;
    isActive: boolean;
    schoolId: string;
  }>;
  const toUpdate = [] as Array<{
    id: string;
    type: ContactType;
    name: string;
    phone: string | null;
    studentName: string | null;
  }>;

  for (const row of normalizedRows) {
    if (!row.name || !row.email || !row.type) {
      skipped.push({ email: row.email || "(missing)", reason: "Missing required values." });
      continue;
    }

    if (row.type === "PARENT" && !row.studentName) {
      skipped.push({ email: row.email, reason: "Parent rows require studentName." });
      continue;
    }

    if (seenInFile.has(row.email)) {
      skipped.push({ email: row.email, reason: "Duplicate email in upload file." });
      continue;
    }

    seenInFile.add(row.email);

    const normalizedPhone = row.phone ? normalizePhoneNumber(row.phone, "1") : null;
    const contactType = row.type === "PARENT" ? ContactType.PARENT : ContactType.STUDENT;

    // Check if contact already exists
    const existingContactId = existingMap.get(row.email);
    if (existingContactId) {
      // Update existing contact
      toUpdate.push({
        id: existingContactId,
        type: contactType,
        name: row.name,
        phone: normalizedPhone,
        studentName: contactType === ContactType.PARENT ? (row.studentName ?? null) : null,
      });
    } else {
      // Create new contact
      toCreate.push({
        type: contactType,
        name: row.name,
        email: row.email,
        phone: normalizedPhone,
        studentName: contactType === ContactType.PARENT ? (row.studentName ?? null) : null,
        isActive: true,
        schoolId: adminSession.schoolId,
      });
    }
  }

  // Execute updates
  for (const update of toUpdate) {
    await prisma.contact.update({
      where: { id: update.id },
      data: {
        type: update.type,
        name: update.name,
        phone: update.phone,
        studentName: update.studentName,
      },
    });
  }

  // Execute creates
  if (toCreate.length > 0) {
    await prisma.contact.createMany({
      data: toCreate,
      skipDuplicates: true,
    });
  }

  return NextResponse.json(
    {
      ok: true,
      createdCount: toCreate.length,
      updatedCount: toUpdate.length,
      importedCount: toCreate.length + toUpdate.length,
      skipped,
    },
    { status: 200 },
  );
}
