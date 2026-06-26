import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { hasAdminSession } from "../../../../lib/adminAuth";
import { prisma } from "../../../../lib/prisma";
import { calculateCycleScorecard } from "../../../../lib/weightedScorecard";

export const dynamic = "force-dynamic";

function formatDate(value: Date): string {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function quarterLabel(value: Date): string {
  const quarter = Math.floor(value.getMonth() / 3) + 1;
  return `Q${quarter} ${value.getFullYear()}`;
}

export default async function StaffScorecardsPage({
  params,
}: {
  params: Promise<{ staffId: string }>;
}) {
  const { staffId } = await params;
  const authorized = await hasAdminSession();
  if (!authorized) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Admin Access Required</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">
                Placeholder session check is enabled. Set cookie <strong>admin_session=1</strong> or set
                <strong> ADMIN_SESSION_BYPASS=true</strong> while wiring your real auth.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  let staffMember: { id: string; name: string } | null = null;
  let cycleScorecards: Array<{
    id: string;
    description: string;
    status: string;
    quarter: string;
    deadline: Date;
    finalScore: number;
    scoreLabel: "Excellent" | "Good" | "Needs Improvement" | "Critical";
    groupSummaries: Array<{
      name: string;
      responseRate: string;
      groupScore: number;
    }>;
    qualitativeFeedback: string[];
  }> = [];
  let dbUnavailable = false;

  try {
    const [staff, cycles] = await Promise.all([
      prisma.user.findUnique({
        where: { id: staffId },
        select: {
          id: true,
          name: true,
        },
      }),
      prisma.evaluationCycle.findMany({
        where: {
          subjectId: staffId,
        },
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          description: true,
          status: true,
          deadline: true,
        },
      }),
    ]);

    staffMember = staff;

    cycleScorecards = await Promise.all(
      cycles.map(async (cycle) => {
        const scorecard = await calculateCycleScorecard(cycle.id);
        return {
          id: cycle.id,
          description: cycle.description,
          status: cycle.status,
          quarter: quarterLabel(cycle.deadline),
          deadline: cycle.deadline,
          finalScore: scorecard.finalScore,
          scoreLabel: scorecard.scoreLabel,
          groupSummaries: scorecard.groups.map((group) => ({
            name: group.name,
            responseRate: group.responseRate,
            groupScore: group.groupScore,
          })),
          qualitativeFeedback: scorecard.qualitativeFeedback.map((entry) => entry.text),
        };
      }),
    );
  } catch {
    dbUnavailable = true;
  }

  if (dbUnavailable) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Database Unavailable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">
                The app could not connect to PostgreSQL. Start your database and verify
                <strong> DATABASE_URL</strong> in <strong>.env</strong>, then refresh this page.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (!staffMember) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Staff Member Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">No staff member exists for this ID.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">{staffMember.name} Scorecards</h1>
            <p className="mt-1 text-sm text-slate-600">Read-only quarterly performance history for staff evaluation meetings.</p>
          </div>
          <Link href="/admin/staff" className="text-sm font-medium text-sky-700 underline">
            Back to Staff
          </Link>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>Scorecard Results (Read-Only)</CardTitle>
          </CardHeader>
          <CardContent>
            {cycleScorecards.length === 0 ? (
              <p className="text-sm text-slate-700">
                No cycle history is available yet. Scorecards will appear once at least one evaluation is submitted.
              </p>
            ) : (
              <div className="space-y-4">
                {cycleScorecards.map((scorecard) => (
                  <div key={scorecard.id} className="rounded-md border border-slate-200 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-medium text-slate-900">{scorecard.description}</p>
                      <span className="inline-flex w-fit rounded-full border border-slate-300 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-800">
                        {scorecard.quarter} • {scorecard.scoreLabel} ({scorecard.finalScore.toFixed(1)}/100)
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-500">
                      Status: {scorecard.status} | Deadline: {formatDate(scorecard.deadline)}
                    </p>

                    <div className="mt-3 grid gap-3 md:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Group Scores</p>
                        {scorecard.groupSummaries.length === 0 ? (
                          <p className="mt-1 text-sm text-slate-600">No group score data available.</p>
                        ) : (
                          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
                            {scorecard.groupSummaries.map((item) => (
                              <li key={`${scorecard.id}-${item.name}`}>
                                {item.name}: {item.groupScore.toFixed(1)}/100 ({item.responseRate})
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">Comment Snapshot</p>
                        {scorecard.qualitativeFeedback.length === 0 ? (
                          <p className="mt-1 text-sm text-slate-600">No comments submitted.</p>
                        ) : (
                          <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
                            {scorecard.qualitativeFeedback.slice(0, 3).map((item, index) => (
                              <li key={`${scorecard.id}-comment-${index}`}>{item}</li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>

                    <div className="mt-3">
                      <Link href={`/admin/evaluations/${scorecard.id}`} className="text-sm font-medium text-sky-700 underline">
                        Open full cycle details (read-only score breakdown)
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
