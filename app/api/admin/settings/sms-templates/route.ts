import { NextRequest, NextResponse } from "next/server";
import { getAdminSession, unauthorizedAdminResponse } from "@/lib/adminAuth";
import {
  getSmsTemplates,
  updateSmsTemplates,
  calculateSmsCost,
} from "@/lib/smsTemplates";
import { DEFAULT_TEMPLATES } from "@/lib/smsService";

export async function GET(request: NextRequest) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return unauthorizedAdminResponse();
  }

  try {
    const templates = await getSmsTemplates(adminSession.schoolId);

    // Calculate character counts for each template
    const info = {
      templates,
      defaults: DEFAULT_TEMPLATES,
      characterCounts: {
        invite: calculateSmsCost(templates.invite),
        reminder: calculateSmsCost(templates.reminder),
        completion: calculateSmsCost(templates.completion),
      },
      placeholders: {
        invite: ["{name}", "{link}", "{subject}"],
        reminder: ["{name}", "{days}", "{link}"],
        completion: ["{name}"],
      },
    };

    return NextResponse.json(info);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch templates";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = await request.json();
    const { templates } = body;

    if (!templates) {
      return NextResponse.json(
        { error: "templates object is required" },
        { status: 400 }
      );
    }

    // Validate each template before saving
    const validation = {
      invite: calculateSmsCost(templates.invite || DEFAULT_TEMPLATES.invite),
      reminder: calculateSmsCost(templates.reminder || DEFAULT_TEMPLATES.reminder),
      completion: calculateSmsCost(
        templates.completion || DEFAULT_TEMPLATES.completion
      ),
    };

    await updateSmsTemplates(adminSession.schoolId, templates);

    return NextResponse.json({
      success: true,
      message: "SMS templates updated successfully",
      templates: await getSmsTemplates(adminSession.schoolId),
      characterCounts: validation,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update templates";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function POST(request: NextRequest) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return unauthorizedAdminResponse();
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === "reset") {
      // Reset to defaults
      await updateSmsTemplates(adminSession.schoolId, DEFAULT_TEMPLATES);
      return NextResponse.json({
        success: true,
        message: "SMS templates reset to defaults",
        templates: DEFAULT_TEMPLATES,
      });
    }

    if (action === "test") {
      // Just calculate cost, don't send
      const { template, type } = body;
      if (!template) {
        return NextResponse.json(
          { error: "template is required" },
          { status: 400 }
        );
      }

      const cost = calculateSmsCost(template);
      return NextResponse.json({
        success: true,
        template,
        type,
        characterCount: cost.characterCount,
        segments: cost.segments,
        estimatedCost: cost.estimatedCost,
      });
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}` },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
