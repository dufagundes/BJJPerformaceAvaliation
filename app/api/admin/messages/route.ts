import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSmsHistory, getEmailHistory, getSmsReplies } from "@/lib/messageLogging";

async function getAdminSession() {
  // Check for admin session bypass (local dev)
  if (process.env.ADMIN_SESSION_BYPASS === "true") {
    const adminUser = await prisma.user.findFirst({
      where: {
        role: "ADMIN",
        isActive: true,
      },
      select: {
        schoolId: true,
      },
    });
    if (adminUser?.schoolId) {
      return { schoolId: adminUser.schoolId };
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  try {
    const adminSession = await getAdminSession();
    if (!adminSession) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all"; // "sms", "email", "all"
    const cycleId = searchParams.get("cycleId");
    const reviewerId = searchParams.get("reviewerId");
    const status = searchParams.get("status");
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const offset = parseInt(searchParams.get("offset") || "0", 10);

    const options = {
      cycleId: cycleId || undefined,
      reviewerId: reviewerId || undefined,
      status: status || undefined,
      limit,
      offset,
    };

    let smsMessages: any[] = [];
    let emailMessages: any[] = [];
    let smsReplies: any[] = [];

    if (type === "sms" || type === "all") {
      try {
        smsMessages = await getSmsHistory(adminSession.schoolId, options);
        smsReplies = await getSmsReplies(adminSession.schoolId);
      } catch (error) {
        console.error("Error fetching SMS history:", error);
      }
    }

    if (type === "email" || type === "all") {
      try {
        emailMessages = await getEmailHistory(adminSession.schoolId, options);
      } catch (error) {
        console.error("Error fetching email history:", error);
      }
    }

    return NextResponse.json({
      sms: smsMessages,
      email: emailMessages,
      smsReplies: smsReplies,
      total: {
        sms: smsMessages.length,
        email: emailMessages.length,
        replies: smsReplies.length,
      },
    });
  } catch (error) {
    console.error("Error fetching message history:", error);
    return NextResponse.json(
      { error: "Failed to fetch message history", details: String(error) },
      { status: 500 }
    );
  }
}
