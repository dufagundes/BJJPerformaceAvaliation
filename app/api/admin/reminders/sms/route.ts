import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, unauthorizedAdminResponse } from "@/lib/adminAuth";
import { sendEvaluationReminders, getReminderSummary } from "@/lib/smsReminders";

export async function GET(request: NextRequest) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return unauthorizedAdminResponse();
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get("action") || "summary";

    if (action === "summary") {
      const summary = await getReminderSummary();
      return NextResponse.json({ summary });
    }

    if (action === "send") {
      const daysParam = searchParams.get("days");
      const days = daysParam
        ? daysParam.split(",").map((d) => parseInt(d.trim()))
        : undefined;

      const result = await sendEvaluationReminders(days);

      return NextResponse.json({
        success: true,
        message: `Sent ${result.sent} SMS reminders (${result.errors} errors)`,
        result,
      });
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Reminder endpoint error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = await request.json();
    const { daysToRemind } = body;

    if (!Array.isArray(daysToRemind)) {
      return NextResponse.json(
        { error: "daysToRemind must be an array of numbers" },
        { status: 400 }
      );
    }

    const result = await sendEvaluationReminders(daysToRemind);

    return NextResponse.json({
      success: true,
      message: `Sent ${result.sent} SMS reminders (${result.errors} errors)`,
      result,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Reminder endpoint error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
