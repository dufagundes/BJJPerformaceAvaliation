import Link from "next/link";
import AiReviewControls from "./ai-review-controls";
import ResendInvitesButton from "./resend-invites-button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { getAdminSession } from "../../../../lib/adminAuth";
import { prisma } from "../../../../lib/prisma";
import { calculateCycleScorecard } from "../../../../lib/weightedScorecard";

export const dynamic = "force-dynamic";

type ScorecardGroup = Awaited<ReturnType<typeof calculateCycleScorecard>>["groups"][number];

type AudienceBreakdown = {
  title: string;
  group: ScorecardGroup | null;
  averageScore: string;
  responseRate: string;
  weight: string;
  topStrength: string;
  lowestArea: string;
  configured: boolean;
};

type TimelineStage = {
  title: string;
  icon: string;
  date: string;
  status: string;
  complete: boolean;
};

function formatDate(value: Date): string {
  return value.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTimelineDate(value: Date | null): string {
  if (!value) {
    return "No date yet";
  }

  return value.toLocaleDateString("en-US", {
    month: "short",
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

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "E";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1];
  return `${first}${second ?? ""}`.toUpperCase();
}

function getBadgeClasses(label: string): string {
  if (label === "Excellent") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (label === "Good") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (label === "Needs Improvement") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (label === "Critical") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-slate-200 bg-slate-50 text-slate-600";
}

function getResponsePercent(responseRate: string): string {
  const match = responseRate.match(/\((\d+)%\)/);
  return match ? `${match[1]}%` : "0%";
}

function getTopFactor(group: ScorecardGroup | null): string {
  const factors = group?.sessions.flatMap((session) => session.factors).filter((factor) => factor.responseCount > 0) ?? [];
  if (factors.length === 0) {
    return "Awaiting responses";
  }

  return factors.reduce((best, factor) => (factor.normalizedScore > best.normalizedScore ? factor : best)).questionText;
}

function getLowestFactor(group: ScorecardGroup | null): string {
  const factors = group?.sessions.flatMap((session) => session.factors).filter((factor) => factor.responseCount > 0) ?? [];
  if (factors.length === 0) {
    return "Awaiting responses";
  }

  return factors.reduce((lowest, factor) => (factor.normalizedScore < lowest.normalizedScore ? factor : lowest)).questionText;
}

function buildAudienceBreakdown(title: string, group: ScorecardGroup | null): AudienceBreakdown {
  return {
    title,
    group,
    averageScore: group ? group.groupScore.toFixed(1) : "--",
    responseRate: group ? getResponsePercent(group.responseRate) : "Not configured",
    weight: group ? `${Math.round(group.weight * 100)}%` : "Not configured",
    topStrength: group ? getTopFactor(group) : "Not configured",
    lowestArea: group ? getLowestFactor(group) : "Not configured",
    configured: group !== null,
  };
}

function EvaluationBreakdownCard({ breakdown }: { breakdown: AudienceBreakdown }) {
  const questionCount = breakdown.group?.sessions.reduce((total, session) => total + session.factors.length, 0) ?? 0;

  return (
    <details className="rounded-2xl border border-slate-200 bg-white shadow-sm">
      <summary className="flex cursor-pointer list-none flex-col gap-5 p-5 marker:hidden lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <h3 className="text-lg font-semibold text-[#0B1F3A]">{breakdown.title}</h3>
            <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${breakdown.configured ? "border-blue-200 bg-blue-50 text-blue-700" : "border-slate-200 bg-slate-50 text-slate-600"}`}>
              {breakdown.configured ? `${questionCount} questions` : "Not configured"}
            </span>
          </div>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Average Score</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-950">{breakdown.averageScore}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Response %</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-950">{breakdown.responseRate}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Weight</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-950">{breakdown.weight}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Top Strength</dt>
              <dd className="mt-1 line-clamp-2 text-sm font-medium text-slate-800">{breakdown.topStrength}</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Lowest Area</dt>
              <dd className="mt-1 line-clamp-2 text-sm font-medium text-slate-800">{breakdown.lowestArea}</dd>
            </div>
          </dl>
        </div>
        <span className="inline-flex shrink-0 items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50">
          View Details
        </span>
      </summary>

      <div className="border-t border-slate-100 px-5 pb-5 pt-4">
        <h4 className="text-sm font-semibold text-slate-950">Questions</h4>
        {breakdown.group && questionCount > 0 ? (
          <div className="mt-4 space-y-4">
            {breakdown.group.sessions.map((session) => (
              <div key={`${breakdown.title}-${session.name}`} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900">{session.name}</p>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600">
                    Weight {Math.round(session.weight * 100)}%
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {session.factors.map((factor) => (
                    <div key={`${session.name}-${factor.questionText}`} className="rounded-lg border border-slate-200 bg-white p-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <p className="text-sm font-medium text-slate-900">{factor.questionText}</p>
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {factor.responseCount > 0 ? `${factor.normalizedScore.toFixed(1)}%` : "No responses"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Questions for this audience are not configured yet.
          </p>
        )}
      </div>
    </details>
  );
}

function EvaluationTimeline({ stages }: { stages: TimelineStage[] }) {
  return (
    <section aria-labelledby="evaluation-timeline-heading" className="card border-0 shadow-sm">
      <div className="card-header bg-white">
        <h2 id="evaluation-timeline-heading" className="h4 mb-1 text-primary-emphasis">Evaluation Timeline</h2>
        <p className="mb-0 text-secondary">Project-style lifecycle view from invitation through manager meeting.</p>
      </div>
      <div className="card-body">
        <ol className="list-unstyled mb-0">
          {stages.map((stage, index) => (
            <li key={stage.title} className="d-flex gap-3">
              <div className="d-flex flex-column align-items-center">
                <span className={`d-inline-flex align-items-center justify-content-center rounded-circle border ${stage.complete ? "bg-success text-white border-success" : "bg-light text-secondary border-secondary-subtle"}`}>
                  <i className={`bi ${stage.icon} p-2`} aria-hidden="true" />
                </span>
                {index < stages.length - 1 ? <span className="vr flex-grow-1 my-2" aria-hidden="true" /> : null}
              </div>
              <article className="card flex-grow-1 mb-3">
                <div className="card-body p-3">
                  <div className="d-flex flex-column gap-2 flex-md-row justify-content-md-between align-items-md-start">
                    <div>
                      <h3 className="h6 mb-1">{stage.title}</h3>
                      <p className="mb-0 small text-secondary">{stage.date}</p>
                    </div>
                    <span className={`badge rounded-pill ${stage.complete ? "text-bg-success" : "text-bg-light border text-secondary"}`}>
                      {stage.status}
                    </span>
                  </div>
                </div>
              </article>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
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
        createdAt: Date;
        subject: { id: string; name: string; email: string; staffProfile: { title: string } | null };
        reviewers: Array<{
          id: string;
          type: string;
          status: string;
          user: { name: string; email: string } | null;
          contact: { name: string; email: string } | null;
          response: { submittedAt: Date } | null;
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
        createdAt: true,
        subject: {
          select: {
            id: true,
            name: true,
            email: true,
            staffProfile: {
              select: { title: true },
            },
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
            response: {
              select: { submittedAt: true },
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

  const currentScore = scorecard ? scorecard.finalScore.toFixed(1) : "--";
  const performanceBadge = scorecard?.scoreLabel ?? "Not Scored";
  const roleLabel = cycle.subject.staffProfile?.title ?? "Staff Member";
  const responseStatus = `${completedReviewers}/${invitedReviewers} completed (${completionPercent}%)`;
  const peerScoreGroup = scorecard?.groups.find((group) => group.name === "Peers") ?? null;
  const parentStudentScoreGroup = scorecard?.groups.find((group) => group.name === "Parents/Students") ?? null;
  const audienceBreakdowns = [
    buildAudienceBreakdown("Peer Evaluation", peerScoreGroup),
    buildAudienceBreakdown("Parents & Students", parentStudentScoreGroup),
    buildAudienceBreakdown("Self Evaluation", null),
    buildAudienceBreakdown("Manager Evaluation", null),
  ];
  const responseDates = cycle.reviewers
    .map((reviewer) => reviewer.response?.submittedAt ?? null)
    .filter((value): value is Date => value !== null);
  const latestResponseDate = responseDates.length > 0
    ? new Date(Math.max(...responseDates.map((value) => value.getTime())))
    : null;
  const timelineStages: TimelineStage[] = [
    {
      title: "Invitations Sent",
      icon: "bi-send-check",
      date: formatTimelineDate(cycle.createdAt),
      status: "Completed",
      complete: true,
    },
    {
      title: "Responses Received",
      icon: "bi-inbox",
      date: formatTimelineDate(latestResponseDate),
      status: completedReviewers > 0 ? `${completedReviewers}/${invitedReviewers} received` : "Pending",
      complete: completedReviewers > 0,
    },
    {
      title: "AI Generated",
      icon: "bi-stars",
      date: "Generated from the right AI panel",
      status: canPrepareMeeting ? "Ready" : "Pending responses",
      complete: false,
    },
    {
      title: "Manager Review",
      icon: "bi-person-check",
      date: "No review date yet",
      status: canPrepareMeeting ? "Ready" : "Pending",
      complete: false,
    },
    {
      title: "Meeting Completed",
      icon: "bi-calendar-check",
      date: "No meeting date yet",
      status: "Pending",
      complete: false,
    },
  ];

  return (
    <main className="bg-slate-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <nav aria-label="Breadcrumb" className="text-sm text-slate-500">
            <ol className="flex flex-wrap items-center gap-2 px-6 pt-5">
              <li>
                <Link href="/admin/cycles" className="hover:text-blue-700">Evaluation Cycles</Link>
              </li>
              <li aria-hidden="true">/</li>
              <li className="font-medium text-slate-900">{cycle.subject.name}</li>
            </ol>
          </nav>

          <div className="mt-5 border-t border-slate-100 bg-gradient-to-r from-white via-white to-slate-50 p-6">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="flex min-w-0 flex-col gap-5 sm:flex-row sm:items-center">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-4 border-white bg-[#0B1F3A] text-3xl font-semibold text-white shadow-md ring-1 ring-slate-200">
                  {getInitials(cycle.subject.name)}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClasses(cycle.status)}`}>
                      {getStatusLabel(cycle.status)}
                    </span>
                    <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-600">
                      360-Degree Evaluation
                    </span>
                  </div>
                  <h1 className="mt-3 truncate text-3xl font-semibold tracking-tight text-[#0B1F3A] sm:text-4xl">
                    {cycle.subject.name}
                  </h1>
                  <p className="mt-1 text-sm text-slate-600">{cycle.subject.email}</p>
                  <dl className="mt-5 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Cycle</dt>
                      <dd className="mt-1 font-medium text-slate-900">{cycle.description}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Role</dt>
                      <dd className="mt-1 font-medium text-slate-900">{roleLabel}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Evaluation Type</dt>
                      <dd className="mt-1 font-medium text-slate-900">360-Degree Evaluation</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Deadline</dt>
                      <dd className="mt-1 font-medium text-slate-900">{formatDate(cycle.deadline)}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Total Evaluators</dt>
                      <dd className="mt-1 font-medium text-slate-900">{invitedReviewers}</dd>
                    </div>
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Response Status</dt>
                      <dd className="mt-1 font-medium text-slate-900">{responseStatus}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              <div className="flex shrink-0 flex-col gap-4 xl:items-end">
                <div className="grid gap-3 sm:grid-cols-2 xl:min-w-80">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Current Score</p>
                    <p className="mt-2 text-4xl font-semibold text-[#0B1F3A]">{currentScore}</p>
                  </div>
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Performance Badge</p>
                    <span className={`mt-3 inline-flex rounded-full border px-3 py-1.5 text-sm font-semibold ${getBadgeClasses(performanceBadge)}`}>
                      {performanceBadge}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row xl:justify-end">
                  <ResendInvitesButton cycleId={cycle.id} />
                  <Link
                    href={`/admin/evaluations/${cycle.id}/test-links`}
                    className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50"
                  >
                    View Test Links
                  </Link>
                  <details className="relative">
                    <summary className="inline-flex cursor-pointer list-none items-center justify-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-900 transition-colors hover:bg-slate-50">
                      More Actions
                    </summary>
                    <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-slate-200 bg-white p-2 text-sm shadow-lg">
                      <a href="#invitation-monitor" className="block rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-950">Invitation monitor</a>
                      <a href="#performance-summary" className="block rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-950">Performance summary</a>
                      <a href="#ai-review-assistant" className="block rounded-lg px-3 py-2 text-slate-700 hover:bg-slate-50 hover:text-slate-950">AI review assistant</a>
                    </div>
                  </details>
                </div>
              </div>
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

        <section aria-labelledby="evaluation-breakdown-heading" className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="evaluation-breakdown-heading" className="text-2xl font-semibold tracking-tight text-[#0B1F3A]">
                Evaluation Breakdown
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Review each audience as a separate evaluation area. Expand a card to inspect its questions.
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {audienceBreakdowns.map((breakdown) => (
              <EvaluationBreakdownCard key={breakdown.title} breakdown={breakdown} />
            ))}
          </div>
        </section>

        <section className="container-fluid px-0" aria-label="Cycle workspace">
          <div className="row g-4">
            <div className="col-12 col-lg-8 space-y-6">
              <Card id="invitation-monitor" className="rounded-2xl border-slate-200 bg-white shadow-sm">
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

            <Card id="performance-summary" className="rounded-2xl border-slate-200 bg-white shadow-sm">
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

            <aside className="col-12 col-lg-4 space-y-6 lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto">
              <AiReviewControls cycleId={cycle.id} subjectName={cycle.subject.name} />

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

            </aside>
          </div>
        </section>

        <EvaluationTimeline stages={timelineStages} />
      </div>
    </main>
  );
}
