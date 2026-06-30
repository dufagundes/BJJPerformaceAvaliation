import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { getAdminSession } from "../../../lib/adminAuth";
import SchoolsClient from "./schools-client";

export default async function AdminSchoolsPage() {
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
              <p className="text-sm text-slate-700">Sign in as an administrator to manage schools.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return <SchoolsClient currentSchoolName={adminSession.schoolName ?? "Current school"} />;
}