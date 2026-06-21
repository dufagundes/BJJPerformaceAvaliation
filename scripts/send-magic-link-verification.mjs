import { PrismaClient, ReviewerType, ReviewerStatus } from "@prisma/client";
import { Resend } from "resend";
import { randomUUID } from "crypto";

const prisma = new PrismaClient({ log: ["error"] });

function requiredEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function appUrl() {
  const value =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_URL?.trim();

  if (!value) {
    return "http://localhost:3000";
  }

  if (value.startsWith("http://") || value.startsWith("https://")) {
    return value.replace(/\/$/, "");
  }

  return `https://${value.replace(/\/$/, "")}`;
}

async function main() {
  const resend = new Resend(requiredEnv("RESEND_API_KEY"));
  const from = requiredEnv("EMAIL_FROM");

  const subject = await prisma.user.findFirst({
    where: {
      role: "STAFF",
      isActive: true,
      staffProfile: {
        is: {
          isActive: true,
          title: "Head Instructor",
        },
      },
    },
    select: {
      id: true,
      name: true,
    },
  });

  if (!subject) {
    throw new Error("No active Head Instructor staff member found to evaluate.");
  }

  const creator =
    (await prisma.user.findFirst({
      where: { role: "ADMIN", isActive: true },
      select: { id: true },
    })) ||
    (await prisma.user.findFirst({ where: { isActive: true }, select: { id: true } }));

  if (!creator) {
    throw new Error("No active user found to set as cycle creator.");
  }

  const contact = await prisma.contact.upsert({
    where: { email: "dufagundes@gmail.com" },
    update: {
      type: "PARENT",
      name: "Dufa Gundes",
      isActive: true,
    },
    create: {
      type: "PARENT",
      name: "Dufa Gundes",
      email: "dufagundes@gmail.com",
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      email: true,
    },
  });

  const deadline = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const cycle = await prisma.evaluationCycle.create({
    data: {
      subjectId: subject.id,
      description: `Magic Link Delivery Verification - ${new Date().toISOString()}`,
      status: "IN_PROGRESS",
      deadline,
      createdBy: creator.id,
    },
    select: {
      id: true,
      deadline: true,
    },
  });

  const inviteToken = randomUUID();

  const reviewer = await prisma.reviewer.create({
    data: {
      cycleId: cycle.id,
      contactId: contact.id,
      type: ReviewerType.PARENT_STUDENT,
      status: ReviewerStatus.PENDING,
      inviteToken,
      tokenExpiresAt: deadline,
    },
    select: {
      id: true,
      inviteToken: true,
      tokenExpiresAt: true,
    },
  });

  const link = `${appUrl()}/evaluate/${reviewer.inviteToken}`;

  const response = await resend.emails.send({
    from,
    to: contact.email,
    subject: `Magic Link Verification for ${subject.name}`,
    html: `<p>Hi ${contact.name},</p><p>This is a verification magic link for ${subject.name}.</p><p><a href="${link}">${link}</a></p><p>This link is single-use and expires at cycle end.</p>`,
    text: `Hi ${contact.name},\n\nThis is a verification magic link for ${subject.name}.\n\n${link}\n\nThis link is single-use and expires at cycle end.`,
  });

  if (response.error) {
    throw new Error(response.error.message || "Resend send failed.");
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        cycleId: cycle.id,
        reviewerId: reviewer.id,
        tokenExpiresAt: reviewer.tokenExpiresAt.toISOString(),
        link,
        messageId: response.data?.id ?? null,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : "Failed to send magic link verification email.");
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
