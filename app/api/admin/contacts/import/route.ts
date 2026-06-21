import { ContactType } from "@prisma/client";
import { NextResponse } from "next/server";
import { isAdminApiRequestAuthorized, unauthorizedAdminResponse } from "../../../../../lib/adminAuth";
import { prisma } from "../../../../../lib/prisma";

type ImportContactRow = {
  type: "STUDENT" | "PARENT";
  name: string;
  email: string;
  studentName?: string;
};

type ImportPayload = {
  rows?: ImportContactRow[];
};

export async function POST(request: Request) {
  if (!(await isAdminApiRequestAuthorized(request))) {
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
    studentName: row.studentName?.trim(),
  }));

  const emails = Array.from(new Set(normalizedRows.map((row) => row.email).filter((email) => email.length > 0)));
  const existing = await prisma.contact.findMany({
    where: { email: { in: emails } },
    select: { email: true },
  });

  const existingEmails = new Set(existing.map((contact) => contact.email.toLowerCase()));
  const seenInFile = new Set<string>();
  const skipped: Array<{ email: string; reason: string }> = [];
  const toCreate = [] as Array<{
    type: ContactType;
    name: string;
    email: string;
    studentName: string | null;
    isActive: boolean;
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

    if (existingEmails.has(row.email)) {
      skipped.push({ email: row.email, reason: "Email already exists." });
      continue;
    }

    if (seenInFile.has(row.email)) {
      skipped.push({ email: row.email, reason: "Duplicate email in upload file." });
      continue;
    }

    seenInFile.add(row.email);
    toCreate.push({
      type: row.type === "PARENT" ? ContactType.PARENT : ContactType.STUDENT,
      name: row.name,
      email: row.email,
      studentName: row.type === "PARENT" ? row.studentName ?? null : null,
      isActive: true,
    });
  }

  if (toCreate.length > 0) {
    await prisma.contact.createMany({
      data: toCreate,
      skipDuplicates: true,
    });
  }

  return NextResponse.json(
    {
      ok: true,
      importedCount: toCreate.length,
      skipped,
    },
    { status: 200 },
  );
}
