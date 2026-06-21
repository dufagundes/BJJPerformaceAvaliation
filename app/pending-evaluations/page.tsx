"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";

function buildEvaluationLink(token: string): string {
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "http://localhost:3000";
  return `${baseUrl}/evaluate/${token}`;
}

function formatDate(value: Date | string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

interface Reviewer {
  id: string;
  type: string;
  inviteToken: string;
  cycle: {
    id: string;
    description: string;
    deadline: string;
    subject: {
      name: string;
    };
  };
  user: {
    name: string;
    email: string;
  } | null;
  contact: {
    name: string;
    email: string;
  } | null;
}

export default function PendingEvaluationsPage() {
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvaluations = async () => {
      try {
        const response = await fetch("/api/pending-evaluations");
        if (!response.ok) throw new Error("Failed to fetch");
        const data = await response.json();
        setReviewers(data.pendingReviewers || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    };

    fetchEvaluations();
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="p-6">
              <p className="text-center text-slate-600">Loading evaluations...</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-red-600">{error}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (reviewers.length === 0) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12">
        <div className="mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>No Pending Evaluations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">
                You don't have any pending evaluations at this time. Check back later or contact your administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12">
      <div className="mx-auto max-w-4xl space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Pending Evaluations</h1>
          <p className="mt-2 text-slate-600">
            You have <strong>{reviewers.length}</strong> evaluation{reviewers.length !== 1 ? "s" : ""} waiting for your feedback.
          </p>
        </div>

        <div className="space-y-4">
          {reviewers.map((reviewer) => {
            const link = buildEvaluationLink(reviewer.inviteToken);
            const reviewerName = reviewer.user?.name || reviewer.contact?.name || "Unknown";
            const isOverdue = new Date() > new Date(reviewer.cycle.deadline);

            return (
              <Card
                key={reviewer.id}
                className={`border-l-4 transition hover:shadow-md ${
                  isOverdue ? "border-l-red-500" : "border-l-blue-500"
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold text-slate-900">
                          {reviewer.cycle.subject.name}
                        </h2>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          reviewer.type === "PEER"
                            ? "border border-blue-200 bg-blue-50 text-blue-700"
                            : "border border-purple-200 bg-purple-50 text-purple-700"
                        }`}>
                          {reviewer.type === "PEER" ? "Peer Review" : "Parent/Student"}
                        </span>
                        {isOverdue && (
                          <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
                            Overdue
                          </span>
                        )}
                      </div>

                      <p className="text-sm text-slate-600">
                        <strong>Type:</strong> {reviewer.type === "PEER" ? "Peer Evaluation" : "Contact Review"}
                      </p>

                      <p className="text-sm text-slate-600">
                        <strong>Your Name:</strong> {reviewerName}
                      </p>

                      {reviewer.cycle.description && (
                        <p className="text-sm text-slate-600">
                          <strong>Cycle:</strong> {reviewer.cycle.description}
                        </p>
                      )}

                      <p className="text-sm text-slate-600">
                        <strong>Deadline:</strong>{" "}
                        <span className={isOverdue ? "font-semibold text-red-700" : ""}>
                          {formatDate(reviewer.cycle.deadline)}
                        </span>
                      </p>
                    </div>

                    <div className="flex flex-col gap-2 sm:flex-row">
                      <a
                        href={link}
                        className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Start Evaluation
                      </a>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(link);
                          alert("Link copied to clipboard!");
                        }}
                        className="inline-flex items-center justify-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                      >
                        Copy Link
                      </button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card className="bg-slate-100">
          <CardHeader>
            <CardTitle className="text-base">How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            <p>
              <strong>1. Click "Start Evaluation"</strong> to begin providing feedback.
            </p>
            <p>
              <strong>2. Rate the staff member</strong> on communication, punctuality, teaching effectiveness, and more.
            </p>
            <p>
              <strong>3. Share your observations</strong> about their strengths and areas for improvement.
            </p>
            <p>
              <strong>4. Submit your response</strong> to complete the evaluation. You can only submit once.
            </p>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
