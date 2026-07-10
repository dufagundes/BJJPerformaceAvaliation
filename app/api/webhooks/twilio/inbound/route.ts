import { NextRequest, NextResponse } from "next/server";
import { logSmsReply } from "@/lib/messageLogging";
import crypto from "crypto";

// Verify Twilio signature for security
function verifyTwilioSignature(
  req: NextRequest,
  body: string,
  twilioAuthToken: string
): boolean {
  const twilioSignature = req.headers.get("X-Twilio-Signature") || "";
  const url = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "";
  const fullUrl = `${url}/api/webhooks/twilio/inbound`;

  // Compute the hash
  const hash = crypto
    .createHmac("sha1", twilioAuthToken)
    .update(fullUrl + body)
    .digest("base64");

  return hash === twilioSignature;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.text();
    const params = new URLSearchParams(body);

    // Verify the request came from Twilio
    const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;
    if (!twilioAuthToken) {
      console.error("TWILIO_AUTH_TOKEN not configured");
      return NextResponse.json(
        { error: "Webhook not configured" },
        { status: 500 }
      );
    }

    if (!verifyTwilioSignature(req, body, twilioAuthToken)) {
      console.warn("Invalid Twilio signature");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const messageBody = params.get("Body") || "";
    const fromNumber = params.get("From") || "";
    const toNumber = params.get("To") || "";
    const messageSid = params.get("MessageSid") || "";

    // Extract schoolId from message context
    // For now, we'll need to look up the original message to find the schoolId
    // In a real scenario, you might store the schoolId in the original message metadata
    
    // Find the original outbound message by matching phone number
    const { prisma } = await import("@/lib/prisma");
    const originalMessage = await prisma.smsMessage.findFirst({
      where: {
        toPhone: fromNumber,
        status: "sent",
      },
      orderBy: { createdAt: "desc" },
      take: 1,
    });

    if (!originalMessage) {
      console.warn(`No matching outbound message found for ${fromNumber}`);
      // Still log it if we can
      return NextResponse.json({ success: true });
    }

    // Log the reply
    await logSmsReply({
      schoolId: originalMessage.schoolId,
      twilioSid: messageSid,
      originalSid: originalMessage.twilioSid,
      replyFromPhone: fromNumber,
      replyToPhone: toNumber,
      messageBody: messageBody,
    });

    // Update original message status to indicate it has a reply
    await prisma.smsMessage.update({
      where: { twilioSid: originalMessage.twilioSid },
      data: { status: "replied" },
    });

    // Return empty response to acknowledge receipt
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing Twilio webhook:", error);
    // Still return 200 to Twilio so it doesn't retry
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: "Twilio SMS webhook endpoint",
    method: "POST",
    documentation: "https://www.twilio.com/docs/sms/tutorials/how-to-receive-and-reply-messages-nodejs",
  });
}
