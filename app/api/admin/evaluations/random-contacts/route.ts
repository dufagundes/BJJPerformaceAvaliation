import { NextResponse } from "next/server";
import { isAdminApiRequestAuthorized, unauthorizedAdminResponse } from "../../../../../lib/adminAuth";
import { prisma } from "../../../../../lib/prisma";

type RandomContactsPayload = {
  count?: number;
  excludeIds?: string[];
};

function pickRandom<T>(items: T[], count: number): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }

  return copy.slice(0, Math.max(0, count));
}

export async function POST(request: Request) {
  if (!(await isAdminApiRequestAuthorized(request))) {
    return unauthorizedAdminResponse();
  }

  let payload: RandomContactsPayload;
  try {
    payload = (await request.json()) as RandomContactsPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const requestedCount = Number(payload.count ?? 0);
  if (!Number.isInteger(requestedCount) || requestedCount <= 0) {
    return NextResponse.json({ error: "count must be a positive integer." }, { status: 400 });
  }

  const contacts = await prisma.contact.findMany({
    where: {
      isActive: true,
      ...(payload.excludeIds && payload.excludeIds.length > 0 ? { id: { notIn: payload.excludeIds } } : {}),
    },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      type: true,
      studentName: true,
      isActive: true,
    },
  });

  const selected = pickRandom(contacts, requestedCount);
  const allSelected = selected.length === contacts.length;

  return NextResponse.json(
    {
      selected,
      requestedCount,
      availableCount: contacts.length,
      warning: contacts.length < requestedCount
        ? `Only ${contacts.length} contacts available. All have been selected.`
        : null,
      allSelected,
    },
    { status: 200 },
  );
}
