import { getAdminSession } from "../../../../../lib/adminAuth";
import { prisma } from "../../../../../lib/prisma";
import { NextResponse } from "next/server";
import { normalizePhoneNumber } from "../../../../../lib/phoneUtils";

export async function POST(request: Request) {
  const adminSession = await getAdminSession();

  if (!adminSession) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email, phone } = await request.json();

  if (!email && !phone) {
    return NextResponse.json(
      { error: "Email or phone is required" },
      { status: 400 }
    );
  }

  try {
    const contact = await prisma.contact.findFirst({
      where: {
        schoolId: adminSession.schoolId,
        OR: [
          email ? { email: { equals: email.toLowerCase(), mode: "insensitive" } } : undefined,
          phone ? { phone: normalizePhoneNumber(phone, "1") || phone } : undefined,
        ].filter(Boolean),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        type: true,
        studentName: true,
      },
    });

    return NextResponse.json({
      exists: !!contact,
      contact: contact || null,
    });
  } catch (error) {
    console.error("Error searching for contact:", error);
    return NextResponse.json(
      { error: "Failed to search for contact" },
      { status: 500 }
    );
  }
}
