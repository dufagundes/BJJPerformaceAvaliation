import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { getAdminSession } from "../../lib/adminAuth";
import { prisma } from "../../lib/prisma";

export const dynamic = "force-dynamic";

function getQuarter(date: Date): number {
  return Math.floor(date.getMonth() / 3) + 1;
}

type DashboardStats = {
  staffCount: number;
  openCycleCount: number;
  pendingEvaluationCount: number;
  scorecardCount: number;
  currentOpenCycle: {
    id: string;
    quarter: number;
    year: number;
    invited: number;
    submitted: number;
    progressPercent: number;
  } | null;
  recentStaff: Array<{
    id: string;
    name: string;
    role: string;
  }>;
};

const quickLinks = [
  {
    href: "/admin/staff",
    label: "Manage Staff",
    description: "Register team members and view the current roster.",
  },
  {
    href: "/admin/cycles",
    label: "Evaluation Cycles",
    description: "Track cycle progress and generate scorecards.",
  },
  {
    href: "/admin/schools",
    label: "Platform: Schools & Admins",
    description: "Register new schools and create their first administrator accounts.",
  },
  {
    href: "/admin/test-email",
    label: "Test Email",
    description: "Confirm outbound email delivery from the admin tools.",
  },
  {
    href: "/admin/scorecard",
    label: "School Scorecard Builder",
    description: "Add, remove, and tune this school's evaluation questions and dropdown options.",
  },
];

export default async function AdminPage() {
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

  let stats: DashboardStats | null = null;
  let dbUnavailable = false;

  try {
    const [staffCount, openCycleCount, pendingEvaluationCount, scorecardCount, recentStaff, latestOpenCycle] = await Promise.all([
      prisma.user.count({
        where: {
          schoolId: adminSession.schoolId,
          role: "STAFF",
          isActive: true,
        },
      }),
      prisma.evaluationCycle.count({
        where: { schoolId: adminSession.schoolId, status: "IN_PROGRESS" },
      }),
      prisma.reviewer.count({
        where: { cycle: { schoolId: adminSession.schoolId }, status: "PENDING" },
      }),
      prisma.evaluationResponse.count({ where: { reviewer: { cycle: { schoolId: adminSession.schoolId } } } }),
      prisma.user.findMany({
        where: {
          schoolId: adminSession.schoolId,
          role: "STAFF",
          isActive: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          role: true,
        },
      }),
      prisma.evaluationCycle.findFirst({
        where: { schoolId: adminSession.schoolId, status: "IN_PROGRESS" },
        orderBy: [{ deadline: "desc" }],
        select: {
          id: true,
          deadline: true,
        },
      }),
    ]);

    let currentOpenCycle: DashboardStats["currentOpenCycle"] = null;

    if (latestOpenCycle) {
      const [invited, submitted] = await Promise.all([
        prisma.reviewer.count({
          where: { cycleId: latestOpenCycle.id },
        }),
        prisma.reviewer.count({
          where: {
            cycleId: latestOpenCycle.id,
            status: "COMPLETED",
          },
        }),
      ]);

      currentOpenCycle = {
        id: latestOpenCycle.id,
        quarter: getQuarter(latestOpenCycle.deadline),
        year: latestOpenCycle.deadline.getFullYear(),
        invited,
        submitted,
        progressPercent: invited > 0 ? Math.round((submitted / invited) * 100) : 0,
      };
    }

    stats = {
      staffCount,
      openCycleCount,
      pendingEvaluationCount,
      scorecardCount,
      currentOpenCycle,
      recentStaff,
    };
  } catch {
    dbUnavailable = true;
  }

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-slate-600">
            View evaluation system activity, jump into setup tasks, and confirm the evaluation workflow is moving.
          </p>
        </div>

        {dbUnavailable ? (
          <Card>
            <CardHeader>
              <CardTitle>Database Unavailable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">
                The app could not load admin metrics. Check your PostgreSQL service and DATABASE_URL, then refresh.
              </p>
            </CardContent>
          </Card>
        ) : null}

        {stats ? (
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card>
              <CardHeader>
                <CardTitle>Total Staff</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-slate-900">{stats.staffCount}</p>
                <p className="text-sm text-slate-600">People registered in the system.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Open Cycles</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-slate-900">{stats.openCycleCount}</p>
                <p className="text-sm text-slate-600">Quarterly evaluation cycles still collecting feedback.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pending Evaluations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-slate-900">{stats.pendingEvaluationCount}</p>
                <p className="text-sm text-slate-600">Invites that have not submitted yet.</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Submitted Evaluations</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold text-slate-900">{stats.scorecardCount}</p>
                <p className="text-sm text-slate-600">Completed evaluation responses in the system.</p>
              </CardContent>
            </Card>
          </section>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Current Cycle Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats?.currentOpenCycle ? (
              <>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-slate-900">
                    Q{stats.currentOpenCycle.quarter} {stats.currentOpenCycle.year}
                  </p>
                  <p className="text-sm text-slate-600">
                    {stats.currentOpenCycle.submitted} of {stats.currentOpenCycle.invited} submissions
                  </p>
                </div>

                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full bg-sky-600"
                    style={{ width: `${stats.currentOpenCycle.progressPercent}%` }}
                  />
                </div>

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-slate-600">Completion: {stats.currentOpenCycle.progressPercent}%</p>
                  <Link
                    href="/admin/cycles"
                    className="inline-flex w-fit items-center rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Open Cycle Details
                  </Link>
                </div>
              </>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-slate-600">No open cycle found yet. Start a cycle to track evaluation progress here.</p>
                <Link
                  href="/admin/cycles"
                  className="inline-flex w-fit items-center rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Go To Cycles
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 sm:grid-cols-3">
                {quickLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 transition hover:border-slate-300 hover:bg-white"
                  >
                    <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Staff</CardTitle>
            </CardHeader>
            <CardContent>
              {stats && stats.recentStaff.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentStaff.map((staff) => (
                    <div key={staff.id} className="rounded-lg border border-slate-200 px-3 py-3">
                      <p className="font-medium text-slate-900">{staff.name}</p>
                      <p className="text-sm text-slate-600">{staff.role}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-600">No staff members have been added yet.</p>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}
