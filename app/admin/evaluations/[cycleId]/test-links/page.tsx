import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { hasAdminSession } from "../../../../../lib/adminAuth";
import { prisma } from "../../../../../lib/prisma";
import { CopyLinkButton, RefreshPageButton } from "./link-action-buttons";

export const dynamic = "force-dynamic";

function formatDate(value: Date): string {
  return value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function buildEvaluationLink(token: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${baseUrl}/evaluate/${token}`;
}

export default async function CycleTestLinksPage({
  params,
}: {
  params: Promise<{ cycleId: string }>;
}) {
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
              <p className="text-sm text-slate-700">Admin session not authenticated.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const { cycleId } = await params;

  let cycle:
    | {
        id: string;
        description: string;
        deadline: Date;
        subject: { id: string; name: string };
        reviewers: Array<{
          id: string;
          type: string;
          status: string;
          inviteToken: string;
          user: { name: string; email: string } | null;
          contact: { name: string; email: string } | null;
        }>;
      }
    | null = null;

  try {
    cycle = await prisma.evaluationCycle.findUnique({
      where: { id: cycleId },
      select: {
        id: true,
        description: true,
        deadline: true,
        subject: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewers: {
          orderBy: [{ type: "asc" }, { id: "asc" }],
          select: {
            id: true,
            type: true,
            status: true,
            inviteToken: true,
            user: {
              select: { name: true, email: true },
            },
            contact: {
              select: { name: true, email: true },
            },
          },
        },
      },
    });
  } catch {
    cycle = null;
  }

  if (!cycle) {
    return (
      <main className="px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Cycle Not Found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-700">This evaluation cycle does not exist.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const peerReviewers = cycle.reviewers.filter((r) => r.type === "PEER");
  const contactReviewers = cycle.reviewers.filter((r) => r.type === "PARENT_STUDENT");

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Test Evaluation Links</h1>
          <p className="mt-1 text-sm text-slate-600">
            Development/QA page: View and test all invitation links for this cycle. Clicking a link opens the evaluation form. Submitting marks the reviewer as complete.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Cycle Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-slate-700">
              <p>
                <strong>Subject:</strong> {cycle.subject.name}
              </p>
              <p>
                <strong>Deadline:</strong> {formatDate(cycle.deadline)}
              </p>
              <p>
                <strong>Description:</strong> {cycle.description}
              </p>
              <p>
                <strong>Total Reviewers:</strong> {cycle.reviewers.length} ({peerReviewers.length} peers, {contactReviewers.length} contacts)
              </p>
              <p>
                <Link
                  href={`/admin/progress/${cycle.id}/${cycle.subject.id}`}
                  className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Open Progress and Partial Score Preview
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Peer Reviewers ({peerReviewers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {peerReviewers.length === 0 ? (
              <p className="text-sm text-slate-600">No peer reviewers.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600">
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2">Test Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {peerReviewers.map((reviewer) => {
                      const link = buildEvaluationLink(reviewer.inviteToken);
                      const statusColor =
                        reviewer.status === "COMPLETED"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-amber-200 bg-amber-50 text-amber-700";
                      return (
                        <tr key={reviewer.id} className="border-b border-slate-100 last:border-0">
                          <td className="py-3 pr-4 font-medium text-slate-900">{reviewer.user?.name || "Unknown"}</td>
                          <td className="py-3 pr-4 text-slate-600">{reviewer.user?.email || "-"}</td>
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusColor}`}
                            >
                              {reviewer.status}
                            </span>
                          </td>
                          <td className="py-3 space-x-2">
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              Open Form
                            </a>
                            <CopyLinkButton
                              link={link}
                              className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Parents & Students ({contactReviewers.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {contactReviewers.length === 0 ? (
              <p className="text-sm text-slate-600">No parent/student reviewers.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-600">
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2">Test Link</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contactReviewers.map((reviewer) => {
                      const link = buildEvaluationLink(reviewer.inviteToken);
                      const statusColor =
                        reviewer.status === "COMPLETED"
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-amber-200 bg-amber-50 text-amber-700";
                      return (
                        <tr key={reviewer.id} className="border-b border-slate-100 last:border-0">
                          <td className="py-3 pr-4 font-medium text-slate-900">{reviewer.contact?.name || "Unknown"}</td>
                          <td className="py-3 pr-4 text-slate-600">{reviewer.contact?.email || "-"}</td>
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusColor}`}
                            >
                              {reviewer.status}
                            </span>
                          </td>
                          <td className="py-3 space-x-2">
                            <a
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                            >
                              Open Form
                            </a>
                            <CopyLinkButton
                              link={link}
                              className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How to Test</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-inside list-decimal space-y-2 text-sm text-slate-700">
              <li>Click "Open Form" to view the evaluation form in a new tab</li>
              <li>Fill in all ratings (1-5 scale) and text responses</li>
              <li>Click "Submit Evaluation"</li>
              <li>Return to this page and refresh to see the status change to COMPLETED</li>
              <li>Once all reviewers (or minimum required) are COMPLETED, you can generate the final score</li>
            </ol>
          </CardContent>
        </Card>

        <div className="flex flex-wrap gap-2">
          <Link
            href={`/admin/evaluations/${cycleId}`}
            className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            ← Back to Cycle Detail
          </Link>
          <RefreshPageButton className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800" />
        </div>
      </div>
    </main>
  );
}
