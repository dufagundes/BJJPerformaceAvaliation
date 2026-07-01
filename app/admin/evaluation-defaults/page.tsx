import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { hasAdminSession } from "../../../lib/adminAuth";
import SettingsClient from "../settings/settings-client";

export default async function EvaluationDefaultsPage() {
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
              <p className="text-sm text-slate-700">Sign in as an administrator to manage evaluation defaults.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return <SettingsClient />;
}