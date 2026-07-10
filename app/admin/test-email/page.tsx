import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { hasAdminSession } from "../../../lib/adminAuth";
import SendTestEmailButton from "./send-test-email-button";
import SendTestSmsButton from "./send-test-sms-button";

export default async function TestEmailPage() {
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
              <p className="text-sm text-slate-700">Enable the placeholder admin session or your real auth system to send a test email.</p>
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
          <h1 className="text-2xl font-semibold text-slate-900">Test Email & SMS</h1>
          <p className="mt-1 text-sm text-slate-600">Send test emails and SMS messages to verify your notification system is working correctly.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Send Test Email</CardTitle>
          </CardHeader>
          <CardContent>
            <SendTestEmailButton />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Send Test SMS</CardTitle>
          </CardHeader>
          <CardContent>
            <SendTestSmsButton />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}