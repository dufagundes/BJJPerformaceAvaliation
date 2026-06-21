import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

const reviewerTypes = [
  {
    label: "Peer Reviewer",
    description: "Selected staff receive a private link by email and can submit feedback once.",
  },
  {
    label: "Parent / Student Reviewer",
    description: "Selected members receive the same one-time email flow without creating an account.",
  },
  {
    label: "Admin / Director",
    description: "Admins manage cycles, reviewer assignments, reminders, and scorecards from the admin dashboard.",
  },
  {
    label: "Staff Subject",
    description: "Staff members review finalized scorecards only after an evaluation cycle is closed.",
  },
];

export default function EvaluateLandingPage() {
  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-sky-700">Reviewer Access</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900">Use the secure link from your email invitation</h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
            Evaluations are accessed through one-time token links sent by email. This keeps submissions limited to invited reviewers,
            preserves the response flow for each cycle, and prevents open public submissions.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {reviewerTypes.map((item) => (
            <Card key={item.label}>
              <CardHeader>
                <CardTitle>{item.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-6 text-slate-600">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <Card>
            <CardHeader>
              <CardTitle>What To Do</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-slate-700">If you were invited to review a staff member, open the email from Gracie Barra Lindale and click the personal evaluation link.</p>
              <p className="text-sm text-slate-700">Each link can only be used once. If your link has expired or was already submitted, contact the admin team for a resend.</p>
              <p className="text-sm text-slate-700">Admins can monitor submission progress and resend invitations from the admin dashboard.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Shortcuts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link href="/admin" className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 hover:bg-white">
                Open Admin Dashboard
              </Link>
              <Link href="/admin/cycles" className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 hover:bg-white">
                Manage Review Cycles
              </Link>
              <Link href="/admin/test-email" className="block rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-slate-300 hover:bg-white">
                Test Email Delivery
              </Link>
            </CardContent>
          </Card>
        </section>
      </div>
    </main>
  );
}