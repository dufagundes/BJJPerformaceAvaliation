import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { hasAdminSession } from "../../../../../lib/adminAuth";
import { prisma } from "../../../../../lib/prisma";
import ProgressDashboardClient from "./progress-dashboard-client";

export const dynamic = "force-dynamic";

type Params = {
  cycleId: string;
  staffMemberId: string;
};

function getQuarter(date: Date): number {
  return Math.floor(date.getMonth() / 3) + 1;
}

export default async function ProgressPage({ params }: { params: Promise<Params> }) {
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

  const { cycleId, staffMemberId } = await params;

  const [cycle, staffMember] = await Promise.all([
    prisma.evaluationCycle.findUnique({
      where: { id: cycleId },
      select: { id: true, deadline: true },
    }),
    prisma.user.findUnique({
      where: { id: staffMemberId },
      select: { id: true, name: true, role: true },
    }),
  ]);

  if (!cycle || !staffMember) {
    notFound();
  }

  const cycleQuarter = getQuarter(cycle.deadline);
  const cycleYear = cycle.deadline.getFullYear();

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Evaluation Progress</h1>
          <p className="mt-1 text-sm text-slate-600">
            {staffMember.name} ({staffMember.role}) - Q{cycleQuarter} {cycleYear}
          </p>
        </div>

        <ProgressDashboardClient
          cycleId={cycle.id}
          staffMemberId={staffMember.id}
          staffName={staffMember.name}
          cycleLabel={`Q${cycleQuarter} ${cycleYear}`}
        />
      </div>
    </main>
  );
}
