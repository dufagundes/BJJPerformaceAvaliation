import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { hasAdminSession } from "../../../lib/adminAuth";
import ContactsClient from "./contacts-client";

export default async function AdminContactsPage() {
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

  return <ContactsClient />;
}
