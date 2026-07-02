import { NextResponse } from "next/server";
import { getAdminSession, unauthorizedAdminResponse } from "../../../../lib/adminAuth";
import { getOrCreateAdminConfig } from "../../../../lib/adminConfig";
import { prisma } from "../../../../lib/prisma";
import {
  getScorecardWeights,
  saveScorecardWeights,
  ScorecardWeightsPayload,
  validateScorecardWeights,
} from "../../../../lib/scorecardWeights";

type UpdateSettingsPayload = {
  defaultCycleDurationDays?: number;
  defaultContactsToInvite?: number;
  reminderScheduleDaysBefore?: number[];
  scorecardWeights?: ScorecardWeightsPayload;
};

function normalizeReminderDays(input: number[]): number[] {
  return Array.from(
    new Set(
      input
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value >= 0),
    ),
  ).sort((a, b) => b - a);
}

export async function GET(_request: Request) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return unauthorizedAdminResponse();
  }

  const config = await getOrCreateAdminConfig(adminSession.schoolId);
  try {
    const scorecardWeights = await getScorecardWeights(adminSession.schoolId);
    return NextResponse.json({ config, scorecardWeights }, { status: 200 });
  } catch {
    return NextResponse.json(
      {
        config,
        scorecardWeights: null,
        scorecardWeightsError:
          "Scorecard weights are unavailable. Run database migrations for scorecard weight tables.",
      },
      { status: 200 },
    );
  }
}

export async function PUT(request: Request) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
    return unauthorizedAdminResponse();
  }

  let payload: UpdateSettingsPayload;
  try {
    payload = (await request.json()) as UpdateSettingsPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload." }, { status: 400 });
  }

  const defaultCycleDurationDays = Number(payload.defaultCycleDurationDays);
  const defaultContactsToInvite = Number(payload.defaultContactsToInvite);
  const reminderScheduleDaysBefore = normalizeReminderDays(payload.reminderScheduleDaysBefore ?? []);

  if (!Number.isInteger(defaultCycleDurationDays) || defaultCycleDurationDays <= 0) {
    return NextResponse.json({ error: "defaultCycleDurationDays must be a positive integer." }, { status: 400 });
  }

  if (!Number.isInteger(defaultContactsToInvite) || defaultContactsToInvite <= 0) {
    return NextResponse.json({ error: "defaultContactsToInvite must be a positive integer." }, { status: 400 });
  }

  if (reminderScheduleDaysBefore.length === 0) {
    return NextResponse.json({ error: "reminderScheduleDaysBefore must contain at least one day." }, { status: 400 });
  }

  if (payload.scorecardWeights) {
    const scorecardWeightErrors = validateScorecardWeights(payload.scorecardWeights);
    if (scorecardWeightErrors.length > 0) {
      return NextResponse.json({ error: scorecardWeightErrors[0] }, { status: 400 });
    }
  }

  const existing = await getOrCreateAdminConfig(adminSession.schoolId);

  const config = await prisma.adminConfig.update({
    where: { id: existing.id },
    data: {
      defaultCycleDurationDays,
      defaultContactsToInvite,
      reminderScheduleDaysBefore,
    },
  });

  if (payload.scorecardWeights) {
    await saveScorecardWeights(adminSession.schoolId, payload.scorecardWeights);
  }

  const scorecardWeights = payload.scorecardWeights ? await getScorecardWeights(adminSession.schoolId) : undefined;
  return NextResponse.json({ ok: true, config, scorecardWeights }, { status: 200 });
}
