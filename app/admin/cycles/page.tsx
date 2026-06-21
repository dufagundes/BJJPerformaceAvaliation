import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { hasAdminSession } from "../../../lib/adminAuth";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

type CycleRow = {
  id: string;
  description: string;
  status: "IN_PROGRESS" | "COMPLETED" | "OVERDUE" | "CANCELLED";
  deadline: Date;
  subject: {
    id: string;
    name: string;
  };
  reviewers: Array<{
    id: string;
    status: "PENDING" | "COMPLETED";
  }>;
};

function formatDate(value: Date): string {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function getStatusClasses(status: CycleRow["status"]) {
  if (status === "IN_PROGRESS") {
    return "border border-amber-300 bg-amber-50 text-amber-800";
  }

  if (status === "COMPLETED") {
    return "border border-emerald-300 bg-emerald-50 text-emerald-800";
  }

  if (status === "OVERDUE") {
    return "border border-rose-300 bg-rose-50 text-rose-800";
  }

  return "border border-slate-300 bg-slate-100 text-slate-700";
}

export default async function AdminCyclesPage() {
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

  let cycles: CycleRow[] = [];
  let dbUnavailable = false;

  try {
    await prisma.evaluationCycle.updateMany({
      where: {
        status: {
          in: ["IN_PROGRESS", "OVERDUE"],
        },
        reviewers: {
          some: {},
          none: {
            status: "PENDING",
          },
        },
      },
      data: {
        status: "COMPLETED",
      },
    });

    cycles = (await prisma.evaluationCycle.findMany({
      orderBy: [{ createdAt: "desc" }],
      select: {
        id: true,
        description: true,
        status: true,
        deadline: true,
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewers: {
          select: {
            id: true,
            status: true,
          },
        },
      },
    })) as CycleRow[];
  } catch {
    dbUnavailable = true;
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-4xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
          <h1 className="text-2xl font-semibold text-slate-900">Evaluation Cycles</h1>
          <p className="mt-1 text-sm text-slate-600">Monitor cycle completion and generate quarterly scorecards.</p>
          </div>
          <Link href="/admin/evaluations/new" className="inline-flex w-fit items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
            Start New Evaluation
          </Link>
        </div>

        {dbUnavailable ? (
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
        ) : null}

        <section className="space-y-4">
          {!dbUnavailable && cycles.length === 0 ? (
            <Card>
              <CardContent className="py-6">
                <p className="text-sm text-slate-600">No evaluation cycles yet. Launch your first one to begin collecting feedback.</p>
              </CardContent>
            </Card>
          ) : null}

          {cycles.map((cycle: CycleRow) => {
            const invited = cycle.reviewers.length;
            const completed = cycle.reviewers.filter((reviewer) => reviewer.status === "COMPLETED").length;

            return (
              <Card key={cycle.id}>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle>{cycle.subject.name}</CardTitle>
                    <span className={`inline-flex w-fit rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusClasses(cycle.status)}`}>
                      {cycle.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-700">{cycle.description}</p>

                  <div className="text-sm text-slate-600">
                    <p>Deadline: {formatDate(cycle.deadline)}</p>
                    <p>
                      Submission progress: {completed} of {invited}
                    </p>
                  </div>

                  <Link
                    href={`/admin/evaluations/${cycle.id}`}
                    className="inline-flex w-fit items-center rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Open Cycle Detail
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </section>
      </div>
    </main>
  );
}