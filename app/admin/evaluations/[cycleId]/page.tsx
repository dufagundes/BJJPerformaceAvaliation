import Link from "next/link";
import AiReviewControls from "./ai-review-controls";
import CycleReportActions from "./cycle-report-actions";
import ResendInvitesButton from "./resend-invites-button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { getAdminSession } from "../../../../lib/adminAuth";
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

function getDaysRemaining(deadline: Date): number {
  return Math.ceil((deadline.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

function getStatusLabel(status: string): string {
  return status.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getStatusClasses(status: string): string {
  if (status === "COMPLETED") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "OVERDUE") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (status === "CANCELLED") {
    return "border-slate-200 bg-slate-100 text-slate-600";
  }

  return "border-blue-200 bg-blue-50 text-blue-700";
}

function getScoreTone(score: number): { text: string; bg: string; bar: string; ring: string } {
  if (score >= 85) {
    return { text: "text-emerald-700", bg: "bg-emerald-50", bar: "bg-emerald-500", ring: "ring-emerald-200" };
  }

  if (score >= 70) {
    return { text: "text-blue-700", bg: "bg-blue-50", bar: "bg-blue-500", ring: "ring-blue-200" };
  }

  if (score >= 50) {
    return { text: "text-amber-700", bg: "bg-amber-50", bar: "bg-amber-500", ring: "ring-amber-200" };
  }

  return { text: "text-rose-700", bg: "bg-rose-50", bar: "bg-rose-500", ring: "ring-rose-200" };
}

function AudienceProgressCard({
  title,
  description,
  invited,
  completed,
}: {
  title: string;
  description: string;
  invited: number;
  completed: number;
}) {
  const percent = invited > 0 ? Math.round((completed / invited) * 100) : 0;

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-950">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{description}</p>
        </div>
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          {percent}%
        </span>
      </div>
      <div className="mt-5 h-2.5 overflow-hidden rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-blue-600" style={{ width: `${percent}%` }} />
      </div>
      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="font-medium text-slate-900">{completed} completed</span>
        <span className="text-slate-500">{invited} invited</span>
      </div>
    </article>
  );
}

function getReviewerName(reviewer: {
  user: { name: string; email: string } | null;
  contact: { name: string; email: string } | null;
}): string {
  return reviewer.user?.name ?? reviewer.contact?.name ?? "Unknown reviewer";
}

function getReviewerEmail(reviewer: {
  user: { name: string; email: string } | null;
  contact: { name: string; email: string } | null;
}): string {
  return reviewer.user?.email ?? reviewer.contact?.email ?? "-";
}

function WorkspaceStep({ label, complete }: { label: string; complete: boolean }) {
  return (
    <li className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm">
      <span className="font-medium text-slate-700">{label}</span>
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${complete ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
        {complete ? "Ready" : "Pending"}
      </span>
    </li>
  );
}

export default async function EvaluationCycleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ cycleId: string }>;
  searchParams?: Promise<{ sent?: string; failed?: string; total?: string }>;
}) {
  const adminSession = await getAdminSession();
  if (!adminSession) {
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
        subject: { id: string; name: string; email: string };
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
    cycle = await prisma.evaluationCycle.findFirst({
      where: { id: cycleId, schoolId: adminSession.schoolId },
      select: {
        id: true,
        description: true,
        status: true,
        deadline: true,
        subject: {
          select: {
            id: true,
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
  const completedReviewers = cycle.reviewers.filter((reviewer) => reviewer.status === "COMPLETED").length;
  const invitedReviewers = cycle.reviewers.length;
  const completionPercent = invitedReviewers > 0 ? Math.round((completedReviewers / invitedReviewers) * 100) : 0;
  const peerCompleted = peerReviewers.filter((reviewer) => reviewer.status === "COMPLETED").length;
  const contactCompleted = contactReviewers.filter((reviewer) => reviewer.status === "COMPLETED").length;
  const pendingReviewers = invitedReviewers - completedReviewers;
  const hasPeerResponse = peerCompleted > 0;
  const hasContactResponse = contactCompleted > 0;
  const canPrepareMeeting = completionPercent >= 50 && hasPeerResponse && hasContactResponse;
  const reviewerExportRows = cycle.reviewers.map((reviewer) => ({
    name: getReviewerName(reviewer),
    email: getReviewerEmail(reviewer),
    audience: reviewer.type === "PEER" ? "Peers" : "Parents & Students",
    status: getStatusLabel(reviewer.status),
  }));
  const daysRemaining = getDaysRemaining(cycle.deadline);
  const deliveryParams = await searchParams;
  const sentCount = Number(deliveryParams?.sent ?? NaN);
  const failedCount = Number(deliveryParams?.failed ?? NaN);
  const totalCount = Number(deliveryParams?.total ?? NaN);
  const hasDeliverySummary = [sentCount, failedCount, totalCount].every(Number.isFinite);

  let scorecard: Awaited<ReturnType<typeof calculateCycleScorecard>> | null = null;
  let scorecardError = "";

  try {
    scorecard = await calculateCycleScorecard(cycle.id);
  } catch (error) {
    scorecardError = error instanceof Error ? error.message : "Unable to load scorecard details.";
  }

  return (
    <main className="bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
            <ol className="flex flex-wrap items-center gap-2">
              <li>
                <Link href="/admin/cycles" className="hover:text-blue-700">Evaluation Cycles</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-slate-900">{cycle.subject.name}</li>
            </ol>
          </nav>

          <div className="mt-5 flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(cycle.status)}`}>
                  {getStatusLabel(cycle.status)}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-600">
                  360-Degree Evaluation
                </span>
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-[#0B1F3A] sm:text-4xl">
                {cycle.subject.name}
              </h1>
              <p className="mt-2 text-sm text-slate-600">{cycle.subject.email}</p>
              <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-600">{cycle.description}</p>
            </div>

            <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
              <ResendInvitesButton cycleId={cycle.id} />
            </div>
          </div>
        </header>

        {hasDeliverySummary ? (
          <div className={`rounded-xl border px-4 py-3 text-sm shadow-sm ${failedCount > 0 ? "border-rose-200 bg-rose-50 text-rose-800" : "border-emerald-200 bg-emerald-50 text-emerald-800"}`}>
            {failedCount > 0
              ? `${sentCount} of ${totalCount} invitations were sent. ${failedCount} failed. Check EMAIL_FROM, RESEND_API_KEY, and your verified Resend domain.`
              : `All ${sentCount} invitations were sent.`}
          </div>
        ) : null}

        <section aria-label="Cycle snapshot" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Completion</p>
            <div className="mt-3 flex items-end justify-between gap-3">
              <p className="text-3xl font-semibold text-[#0B1F3A]">{completionPercent}%</p>
              <p className="text-sm text-slate-500">{completedReviewers}/{invitedReviewers}</p>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${completionPercent}%` }} />
            </div>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Current Score</p>
            {scorecard ? (
              <>
                <p className="mt-3 text-3xl font-semibold text-[#0B1F3A]">{scorecard.finalScore.toFixed(1)}</p>
                <p className="mt-1 text-sm font-medium text-blue-700">{scorecard.scoreLabel}</p>
              </>
            ) : (
              <>
                <p className="mt-3 text-3xl font-semibold text-[#0B1F3A]">--</p>
                <p className="mt-1 text-sm text-slate-500">Awaiting submitted responses</p>
              </>
            )}
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Deadline</p>
            <p className="mt-3 text-xl font-semibold text-[#0B1F3A]">{formatDate(cycle.deadline)}</p>
            <p className={`mt-1 text-sm font-medium ${daysRemaining < 0 ? "text-rose-700" : daysRemaining <= 3 ? "text-amber-700" : "text-slate-500"}`}>
              {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days remaining`}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Audience Coverage</p>
            <p className="mt-3 text-3xl font-semibold text-[#0B1F3A]">{peerReviewers.length + contactReviewers.length}</p>
            <p className="mt-1 text-sm text-slate-500">{peerReviewers.length} peers, {contactReviewers.length} parents/students</p>
          </article>
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-6">
            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="text-[#0B1F3A]">Invitation Monitor</CardTitle>
                    <p className="mt-1 text-sm text-slate-500">Track every invitation and follow up without leaving this cycle.</p>
                  </div>
                  <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                    {pendingReviewers} pending
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                        <th className="py-3 pr-4 font-semibold">Reviewer</th>
                        <th className="py-3 pr-4 font-semibold">Audience</th>
                        <th className="py-3 pr-4 font-semibold">Email</th>
                        <th className="py-3 font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cycle.reviewers.map((reviewer) => (
                        <tr key={reviewer.id} className="border-b border-slate-100 last:border-0">
                          <td className="py-3 pr-4 font-medium text-slate-900">{getReviewerName(reviewer)}</td>
                          <td className="py-3 pr-4 text-slate-600">{reviewer.type === "PEER" ? "Peers" : "Parents & Students"}</td>
                          <td className="py-3 pr-4 text-slate-500">{getReviewerEmail(reviewer)}</td>
                          <td className="py-3">
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${reviewer.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                              {getStatusLabel(reviewer.status)}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <section className="grid gap-4 lg:grid-cols-2" aria-label="Audience progress">
              <AudienceProgressCard
                title="Peers"
                description="Co-instructor and staff feedback"
                invited={peerReviewers.length}
                completed={peerCompleted}
              />
              <AudienceProgressCard
                title="Parents & Students"
                description="Family and student perspective"
                invited={contactReviewers.length}
                completed={contactCompleted}
              />
            </section>

            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-[#0B1F3A]">Performance Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {scorecardError ? (
                  <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{scorecardError}</p>
                ) : null}

                {scorecard ? (
                  <>
                    {scorecard.notes?.length ? (
                      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                        {scorecard.notes[0]}
                      </div>
                    ) : null}

                    <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:items-center">
                      <div className={`rounded-2xl p-6 text-center ring-1 ${getScoreTone(scorecard.finalScore).bg} ${getScoreTone(scorecard.finalScore).ring}`}>
                        <p className={`text-5xl font-semibold ${getScoreTone(scorecard.finalScore).text}`}>{scorecard.finalScore.toFixed(1)}</p>
                        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">out of 100</p>
                        <p className="mt-4 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-sm">{scorecard.scoreLabel}</p>
                      </div>

                      <div className="space-y-4">
                        {scorecard.groups.map((group) => {
                          const tone = getScoreTone(group.groupScore);
                          return (
                            <div key={group.name} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-semibold text-slate-950">{group.name}</p>
                                  <p className="text-xs text-slate-500">{group.responseRate} responded</p>
                                </div>
                                <span className="text-sm font-semibold text-slate-900">{group.groupScore.toFixed(1)}%</span>
                              </div>
                              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                                <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${Math.max(0, Math.min(100, group.groupScore))}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs">
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

                    <details className="rounded-2xl border border-slate-200 bg-white p-4 open:shadow-sm">
                      <summary className="cursor-pointer text-sm font-semibold text-[#0B1F3A]">Question breakdown</summary>
                      <div className="mt-4 space-y-4">
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
                                                    ? "bg-blue-500"
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
                    </details>

                    <details className="rounded-2xl border border-slate-200 bg-white p-4 open:shadow-sm">
                      <summary className="cursor-pointer text-sm font-semibold text-[#0B1F3A]">Qualitative feedback</summary>
                      {scorecard.qualitativeFeedback.length === 0 ? (
                        <p className="mt-3 text-sm text-slate-600">No qualitative comments submitted yet.</p>
                      ) : (
                        <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700">
                          {scorecard.qualitativeFeedback.slice(0, 8).map((item, index) => (
                            <li key={`feedback-${index}`}>{item.text}</li>
                          ))}
                        </ul>
                      )}
                    </details>
                  </>
                ) : (
                  <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                    Score details will appear after evaluators submit responses.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <aside className="space-y-6">
            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-[#0B1F3A]">Reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm leading-6 text-slate-600">
                  Export reviewer status or print this workspace as the cycle report for the manager meeting.
                </p>
                <CycleReportActions subjectName={cycle.subject.name} reviewers={reviewerExportRows} />
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-[#0B1F3A]">Manager Meeting Prep</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`rounded-xl border px-4 py-3 ${canPrepareMeeting ? "border-emerald-200 bg-emerald-50" : "border-amber-200 bg-amber-50"}`}>
                  <p className={`text-sm font-semibold ${canPrepareMeeting ? "text-emerald-800" : "text-amber-800"}`}>
                    {canPrepareMeeting ? "Meeting package is ready" : "Meeting package is still building"}
                  </p>
                  <p className={`mt-1 text-xs ${canPrepareMeeting ? "text-emerald-700" : "text-amber-700"}`}>
                    Use this checklist before reviewing performance with the staff member.
                  </p>
                </div>
                <ul className="space-y-2">
                  <WorkspaceStep label="Peer feedback received" complete={hasPeerResponse} />
                  <WorkspaceStep label="Parent/student feedback received" complete={hasContactResponse} />
                  <WorkspaceStep label="At least 50% response rate" complete={completionPercent >= 50} />
                  <WorkspaceStep label="Score summary available" complete={!!scorecard} />
                  <WorkspaceStep label="AI recommendations reviewed" complete={false} />
                </ul>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-[#0B1F3A]">Reviewer Roster</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className="text-sm font-semibold text-slate-900">Peers</p>
                  <div className="mt-3 space-y-2">
                    {peerReviewers.length === 0 ? (
                      <p className="text-sm text-slate-500">No peer evaluators selected.</p>
                    ) : peerReviewers.map((reviewer) => (
                      <div key={reviewer.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{reviewer.user?.name ?? "Unknown"}</p>
                          <p className="truncate text-xs text-slate-500">{reviewer.user?.email ?? "-"}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${reviewer.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                          {getStatusLabel(reviewer.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-900">Parents & Students</p>
                  <div className="mt-3 space-y-2">
                    {contactReviewers.length === 0 ? (
                      <p className="text-sm text-slate-500">No parent or student evaluators selected.</p>
                    ) : contactReviewers.map((reviewer) => (
                      <div key={reviewer.id} className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-3 py-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">{reviewer.contact?.name ?? "Unknown"}</p>
                          <p className="truncate text-xs text-slate-500">{reviewer.contact?.email ?? "-"}</p>
                        </div>
                        <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${reviewer.status === "COMPLETED" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                          {getStatusLabel(reviewer.status)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-[#0B1F3A]">AI Review Assistant</CardTitle>
              </CardHeader>
              <CardContent>
                <AiReviewControls cycleId={cycle.id} />
              </CardContent>
            </Card>
          </aside>
        </section>
      </div>
    </main>
  );
}
