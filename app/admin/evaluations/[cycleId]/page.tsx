import Link from "next/link";
import AiReviewControls from "./ai-review-controls";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { hasAdminSession } from "../../../../lib/adminAuth";
import { prisma } from "../../../../lib/prisma";
import { calculateCycleScorecard } from "../../../../lib/weightedScorecard";

export const dynamic = "force-dynamic";

function formatDate(value: Date): string {
  return value.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

export default async function EvaluationCycleDetailPage({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}) {
  const authorized = await hasAdminSession();
  if (!authorized) {
    return (
      <main className="px-4 py-8">
        <div className="mx-auto max-w-4xl">
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

  const { cycleId } = await params;

  let cycle:
    | {
        id: string;
        description: string;
        status: string;
        deadline: Date;
        subject: { name: string; email: string };
        reviewers: Array<{
          id: string;
          type: string;
          status: string;
          user: { name: string; email: string } | null;
          contact: { name: string; email: string } | null;
        }>;
      }
    | null = null;

  try {
    cycle = await prisma.evaluationCycle.findUnique({
      where: { id: cycleId },
      select: {
        id: true,
        description: true,
        status: true,
        deadline: true,
        subject: {
          select: {
            name: true,
            email: true,
          },
        },
        reviewers: {
          orderBy: [{ type: "asc" }, { id: "asc" }],
          select: {
            id: true,
            type: true,
            status: true,
            user: {
              select: { name: true, email: true },
            },
            contact: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });
  } catch {
    cycle = null;
  }

  if (!cycle) {
    return (
      <main className="px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Cycle Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">This evaluation cycle does not exist or the database is unavailable.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const peerReviewers = cycle.reviewers.filter((reviewer) => reviewer.type === "PEER");
  const contactReviewers = cycle.reviewers.filter((reviewer) => reviewer.type === "PARENT_STUDENT");

  let scorecard: Awaited<ReturnType<typeof calculateCycleScorecard>> | null = null;
  let scorecardError = "";

  try {
    scorecard = await calculateCycleScorecard(cycle.id);
  } catch (error) {
    scorecardError = error instanceof Error ? error.message : "Unable to load scorecard details.";
  }

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Evaluation Cycle Created</h1>
          <p className="mt-1 text-sm text-slate-600">Invitations have been generated and queued for delivery.</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <CardTitle>Cycle Summary</CardTitle>
              <Link
                href={`/admin/evaluations/${cycle.id}/test-links`}
                className="inline-flex w-fit items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
              >
                View Test Links
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-slate-700">
              <p><strong>Status:</strong> {cycle.status}</p>
              <p><strong>Subject:</strong> {cycle.subject.name} ({cycle.subject.email})</p>
              <p><strong>Deadline:</strong> {formatDate(cycle.deadline)}</p>
              <p><strong>Description:</strong> {cycle.description}</p>
              <p><strong>Peer reviewers:</strong> {peerReviewers.length}</p>
              <p><strong>Contact reviewers:</strong> {contactReviewers.length}</p>
            </div>
          </CardContent>
        </Card>

        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Peers</CardTitle>
            </CardHeader>
            <CardContent>
              {peerReviewers.length === 0 ? (
                <p className="text-sm text-slate-600">No peer reviewers selected.</p>
              ) : (
                <div className="space-y-2">
                  {peerReviewers.map((reviewer) => (
                    <div key={reviewer.id} className="rounded-md border border-slate-200 px-3 py-2">
                      <p className="text-sm font-medium text-slate-900">{reviewer.user?.name ?? "Unknown"}</p>
                      <p className="text-xs text-slate-500">{reviewer.user?.email ?? "-"}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parents and Students</CardTitle>
            </CardHeader>
            <CardContent>
              {contactReviewers.length === 0 ? (
                <p className="text-sm text-slate-600">No contact reviewers selected.</p>
              ) : (
                <div className="space-y-2">
                  {contactReviewers.map((reviewer) => (
                    <div key={reviewer.id} className="rounded-md border border-slate-200 px-3 py-2">
                      <p className="text-sm font-medium text-slate-900">{reviewer.contact?.name ?? "Unknown"}</p>
                      <p className="text-xs text-slate-500">{reviewer.contact?.email ?? "-"}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>{cycle.subject.name}&apos;s Final Score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {scorecardError ? (
              <p className="text-sm text-rose-700">{scorecardError}</p>
            ) : null}

            {scorecard ? (
              <>
                {scorecard.notes?.length ? (
                  <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    {scorecard.notes[0]}
                  </div>
                ) : null}

                {/* Score circle */}
                <div className="flex flex-col items-center gap-4 py-4">
                  <div
                    className={[
                      "flex h-40 w-40 flex-col items-center justify-center rounded-full border-8 shadow-md",
                      scorecard.finalScore >= 85
                        ? "border-emerald-400 bg-emerald-50 text-emerald-700"
                        : scorecard.finalScore >= 70
                          ? "border-sky-400 bg-sky-50 text-sky-700"
                          : scorecard.finalScore >= 50
                            ? "border-amber-400 bg-amber-50 text-amber-700"
                            : "border-rose-400 bg-rose-50 text-rose-700",
                    ].join(" ")}
                  >
                    <span className="text-4xl font-bold leading-none">
                      {scorecard.finalScore.toFixed(1)}
                    </span>
                    <span className="mt-1 text-xs font-medium uppercase tracking-wide opacity-70">
                      out of 100
                    </span>
                  </div>

                  <div
                    className={[
                      "rounded-full px-5 py-1.5 text-sm font-semibold",
                      scorecard.finalScore >= 85
                        ? "bg-emerald-100 text-emerald-800"
                        : scorecard.finalScore >= 70
                          ? "bg-sky-100 text-sky-800"
                          : scorecard.finalScore >= 50
                            ? "bg-amber-100 text-amber-800"
                            : "bg-rose-100 text-rose-800",
                    ].join(" ")}
                  >
                    {scorecard.scoreLabel}
                  </div>
                </div>

                {/* Score legend */}
                <div className="flex flex-wrap justify-center gap-3 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    <span className="text-slate-600">85–100 Excellent</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
                    <span className="text-slate-600">70–84 Good</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="text-slate-600">50–69 Needs Improvement</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="text-slate-600">0–49 Critical</span>
                  </span>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">Question Breakdown</p>
                  <div className="mt-3 space-y-4">
                    {scorecard.groups.map((group) => (
                      <div key={group.name} className="rounded-xl border border-slate-200 bg-slate-50/80 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{group.name}</p>
                            <p className="text-xs text-slate-500">{group.responseRate} responded</p>
                          </div>
                        </div>

                        <div className="mt-4 space-y-4">
                          {group.sessions.map((session) => (
                            <div key={`${group.name}-${session.name}`} className="space-y-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                                {session.name}
                              </p>

                              <div className="space-y-3">
                                {session.factors.map((factor) => {
                                  const barWidth = `${Math.max(0, Math.min(100, factor.normalizedScore))}%`;

                                  return (
                                    <div
                                      key={`${session.name}-${factor.questionText}`}
                                      className="rounded-lg border border-slate-200 bg-white p-3"
                                    >
                                      <div className="flex flex-wrap items-start justify-between gap-3">
                                        <p className="text-sm font-medium text-slate-900">{factor.questionText}</p>
                                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                                          {factor.normalizedScore.toFixed(1)}%
                                        </span>
                                      </div>

                                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200">
                                        <div
                                          className={[
                                            "h-full rounded-full",
                                            factor.normalizedScore >= 85
                                              ? "bg-emerald-500"
                                              : factor.normalizedScore >= 70
                                                ? "bg-sky-500"
                                                : factor.normalizedScore >= 50
                                                  ? "bg-amber-500"
                                                  : "bg-rose-500",
                                          ].join(" ")}
                                          style={{ width: barWidth }}
                                        />
                                      </div>

                                      <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                                        <span>Average: {factor.rawAverage.toFixed(1)} / 5</span>
                                        <span>
                                          {factor.responseCount} response{factor.responseCount === 1 ? "" : "s"}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Qualitative feedback */}
                <div>
                  <p className="text-sm font-semibold text-slate-900">Qualitative Feedback</p>
                  {scorecard.qualitativeFeedback.length === 0 ? (
                    <p className="mt-1 text-sm text-slate-600">No qualitative comments submitted yet.</p>
                  ) : (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                      {scorecard.qualitativeFeedback.slice(0, 8).map((item, index) => (
                        <li key={`feedback-${index}`}>{item.text}</li>
                      ))}
                    </ul>
                  )}
                </div>

                <div>
                  <AiReviewControls cycleId={cycle.id} />
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
