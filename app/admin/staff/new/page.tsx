import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { hasAdminSession } from "../../../../lib/adminAuth";
import StaffForm from "./staff-form";

export default async function NewStaffPage() {
  const authorized = await hasAdminSession();
  if (!authorized) {
    return (
      <main className="px-4 py-8">
        <div className="mx-auto max-w-3xl">
          <Card>
            <CardHeader>
              <CardTitle>Admin Access Required</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">Enable the placeholder admin session or your real auth system to register staff.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Register Staff Member</h1>
          <p className="mt-1 text-sm text-slate-600">Create a staff record so the team member can participate in evaluation cycles.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Staff Details</CardTitle>
          </CardHeader>
          <CardContent>
            <StaffForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
