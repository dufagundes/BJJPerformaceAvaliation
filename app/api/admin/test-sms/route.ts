import { sendSms, sendEvaluationInviteSms } from "@/lib/smsService";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { to, message, type, name, link } = body;

    if (!to) {
      return NextResponse.json(
        { error: "Phone number (to) is required" },
        { status: 400 }
      );
    }

    let result;

    if (type === "evaluation_invite" && name && link) {
      // Send evaluation invite SMS
      result = await sendEvaluationInviteSms(to, name, link);
    } else if (message) {
      // Send custom message
      result = await sendSms(to, message);
    } else {
      return NextResponse.json(
        {
          error:
            "Either 'message' or ('type', 'name', 'link') parameters are required",
        },
        { status: 400 }
      );
    }

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: result.message,
      sid: result.sid,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Test SMS endpoint error:", errorMessage);
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message:
      "Test SMS Endpoint - POST to this endpoint with 'to' and 'message' parameters",
    example: {
      curl: `curl -X POST http://localhost:3000/api/admin/test-sms \\
  -H "Content-Type: application/json" \\
  -d '{
    "to": "+1234567890",
    "message": "Hello, this is a test SMS"
  }'`,
      evaluationInvite: {
        to: "+1234567890",
        type: "evaluation_invite",
        name: "John Doe",
        link: "http://localhost:3000/evaluate/token123",
      },
    },
  });
}
