import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "../../../../lib/prisma";

function getAppUrl() {
  return (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");
}

export async function POST(request: Request) {
  let payload: { email?: string };
  try {
    payload = (await request.json()) as { email?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const email = payload.email?.trim().toLowerCase() || "";
  if (!email) {
    return NextResponse.json({ error: "Email is required." }, { status: 400 });
  }

  const users = await prisma.user.findMany({
    where: {
      email,
      role: "ADMIN",
      isActive: true,
      school: {
        is: {
          isActive: true,
        },
      },
    },
    select: { id: true, email: true, name: true, role: true },
  });
  const user = users.length === 1 ? users[0] : null;

  if (!user || user.role !== "ADMIN") {
    return NextResponse.json({ ok: true, message: "If that admin email exists, a reset link has been sent." }, { status: 200 });
  }

  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "NEXTAUTH_SECRET is missing." }, { status: 500 });
  }

  const resendApiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!resendApiKey || !from) {
    return NextResponse.json({ error: "Email settings are missing." }, { status: 500 });
  }

  const token = jwt.sign(
    {
      sub: user.id,
      role: user.role,
      type: "admin-password-reset",
    },
    secret,
    { expiresIn: "1h" },
  );

  const resetLink = `${getAppUrl()}/admin/reset-password?token=${encodeURIComponent(token)}`;
  const resend = new Resend(resendApiKey);

  const response = await resend.emails.send({
    from,
    to: user.email,
    subject: "Reset your Gracie Barra Lindale admin password",
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
        <p>Hi ${user.name || "Admin"},</p>
        <p>A request was made to reset your admin password.</p>
        <p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 14px; border-radius: 8px; background: #C8102E; color: #ffffff; text-decoration: none; font-weight: 600;">
            Reset Password
          </a>
        </p>
        <p>If you did not request this, you can ignore this email.</p>
      </div>
    `,
    text: `Reset your admin password: ${resetLink}`,
  });

  if (response.error) {
    return NextResponse.json({ error: response.error.message || "Could not send reset email." }, { status: 502 });
  }

  return NextResponse.json({ ok: true, message: "If that admin email exists, a reset link has been sent." }, { status: 200 });
}