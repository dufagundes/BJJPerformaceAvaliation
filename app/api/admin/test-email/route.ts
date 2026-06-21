import { NextResponse } from "next/server";
import { isAdminApiRequestAuthorized, unauthorizedAdminResponse } from "../../../../lib/adminAuth";
import { sendTestEmail, TEST_EMAIL_RECIPIENT } from "../../../../lib/testEmail";

export async function POST(request: Request) {
  if (!(await isAdminApiRequestAuthorized(request))) {
    return unauthorizedAdminResponse();
  }

  const delivery = await sendTestEmail();

  return NextResponse.json(
    {
      ok: delivery.ok,
      recipient: TEST_EMAIL_RECIPIENT,
      delivery,
      message: delivery.ok ? `Test email sent to ${TEST_EMAIL_RECIPIENT}.` : undefined,
    },
    { status: delivery.ok ? 200 : 502 },
  );
}