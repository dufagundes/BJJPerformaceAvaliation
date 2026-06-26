import { NextResponse } from "next/server";
import { isAdminApiRequestAuthorized, unauthorizedAdminResponse } from "../../../../lib/adminAuth";
import { sendTestEmail } from "../../../../lib/testEmail";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseRecipients(value: unknown): string[] {
  if (typeof value !== "string") {
    return [];
  }

  return Array.from(
    new Set(
      value
        .split(/[\s,;]+/)
        .map((recipient) => recipient.trim().toLowerCase())
        .filter(Boolean),
    ),
  );
}

export async function POST(request: Request) {
  if (!(await isAdminApiRequestAuthorized(request))) {
    return unauthorizedAdminResponse();
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const recipients = parseRecipients((payload as { recipients?: unknown }).recipients);
  if (recipients.length === 0) {
    return NextResponse.json({ error: "Enter at least one recipient email." }, { status: 400 });
  }

  const invalidRecipients = recipients.filter((recipient) => !EMAIL_PATTERN.test(recipient));
  if (invalidRecipients.length > 0) {
    return NextResponse.json(
      { error: `Invalid email address: ${invalidRecipients.join(", ")}` },
      { status: 400 },
    );
  }

  const delivery = await sendTestEmail(recipients);
  const recipientLabel = recipients.join(", ");

  return NextResponse.json(
    {
      ok: delivery.ok,
      recipients,
      delivery,
      message: delivery.ok ? `Test email sent to ${recipientLabel}.` : undefined,
    },
    { status: delivery.ok ? 200 : 502 },
  );
}