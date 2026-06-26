import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { hasAdminSession } from "../../../lib/adminAuth";
import { prisma } from "../../../lib/prisma";

export const dynamic = "force-dynamic";

type StaffRow = {
  id: string;
  name: string;
  email: string;
  staffProfile: {
    id: string;
    title: string;
  } | null;
  createdAt: Date;
};

export default async function AdminStaffPage() {
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

  let staffMembers: StaffRow[] = [];
  let dbUnavailable = false;

  try {
    staffMembers = (await prisma.user.findMany({
      where: {
        role: "STAFF",
        isActive: true,
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        staffProfile: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    })) as StaffRow[];
  } catch {
    dbUnavailable = true;
  }

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Staff Members</h1>
            <p className="mt-1 text-sm text-slate-600">Register team members and view who is already active in the evaluation system.</p>
          </div>
          <Link href="/admin/staff/new" className="inline-flex w-fit items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800">
            Register Staff Member
          </Link>
        </div>

        {dbUnavailable ? (
          <Card>
            <CardHeader>
              <CardTitle>Database Unavailable</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">The app could not load staff records. Check your PostgreSQL service and DATABASE_URL, then refresh.</p>
            </CardContent>
          </Card>
        ) : null}

        {!dbUnavailable ? (
          <Card>
            <CardHeader>
              <CardTitle>Registered Staff</CardTitle>
            </CardHeader>
            <CardContent>
              {staffMembers.length === 0 ? (
                <p className="text-sm text-slate-600">No staff members have been added yet.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500">
                        <th className="py-2 pr-4 font-medium">Name</th>
                        <th className="py-2 pr-4 font-medium">Email</th>
                        <th className="py-2 pr-4 font-medium">Role</th>
                        <th className="py-2 font-medium">Scorecards</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffMembers.map((staff) => (
                        <tr key={staff.id} className="border-b border-slate-100 text-slate-700 last:border-b-0">
                          <td className="py-3 pr-4 font-medium text-slate-900">
                            <Link href={`/admin/scorecards/${staff.id}`} className="text-sky-700 underline">
                              {staff.name}
                            </Link>
                          </td>
                          <td className="py-3 pr-4">{staff.email}</td>
                          <td className="py-3 pr-4">{staff.staffProfile?.title ?? "Unassigned"}</td>
                          <td className="py-3">
                            <Link href={`/admin/scorecards/${staff.id}`} className="text-sky-700 underline">
                              View scorecards
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
