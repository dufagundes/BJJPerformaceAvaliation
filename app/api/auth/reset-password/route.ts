import { hash } from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/prisma";

type ResetTokenPayload = {
  sub: string;
  role: "ADMIN";
  type: "admin-password-reset";
  iat: number;
  exp: number;
};

export async function POST(request: Request) {
  let payload: { token?: string; password?: string };
  try {
    payload = (await request.json()) as { token?: string; password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const token = payload.token?.trim() || "";
  const password = payload.password || "";

  if (!token || !password) {
    return NextResponse.json({ error: "Token and password are required." }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters." }, { status: 400 });
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "NEXTAUTH_SECRET is missing." }, { status: 500 });
  }

  let decoded: ResetTokenPayload;
  try {
    decoded = jwt.verify(token, secret) as ResetTokenPayload;
  } catch {
    return NextResponse.json({ error: "Reset token is invalid or expired." }, { status: 400 });
  }

  if (decoded.type !== "admin-password-reset" || decoded.role !== "ADMIN" || !decoded.sub) {
    return NextResponse.json({ error: "Reset token is invalid." }, { status: 400 });
  }

  const passwordHash = await hash(password, 12);
  const updated = await prisma.user.updateMany({
    where: {
      id: decoded.sub,
      role: "ADMIN",
    },
    data: {
      passwordHash,
    },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "Admin user not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, message: "Password updated successfully." }, { status: 200 });
}