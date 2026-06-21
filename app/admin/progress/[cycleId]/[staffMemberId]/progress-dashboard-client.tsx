"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../../components/ui/card";

type GroupKey = "PEER" | "PARENT_STUDENT";

type EvaluatorProgress = {
  id: string;
  name: string;
  email: string;
  status: "submitted" | "pending";
};

type GroupProgress = {
  key: GroupKey;
  name: string;
  invited: number;
  submitted: number;
  progressPercent: number;
  evaluators: EvaluatorProgress[];
};

type ChecklistItem = {
  key: GroupKey;
  label: string;
  met: boolean;
  submitted: number;
  invited: number;
};

type ProgressPayload = {
  stage: 3 | 4 | 5;
  stageLabel: string;
  groups: GroupProgress[];
  checklist: ChecklistItem[];
  generate: {
    enabled: boolean;
    reason: string;
    buttonLabel: string;
  };
  totals: {
    submitted: number;
    invited: number;
  };
  preview: {
    finalScore: number;
    scoreLabel: "Excellent" | "Good" | "Needs Improvement" | "Critical";
    peerGroupScore: number;
    parentGroupScore: number;
    peerWeight: number;
    parentWeight: number;
    notes?: string[];
  } | null;
};

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 010 1.414l-7.25 7.25a1 1 0 01-1.414 0L3.296 9.21A1 1 0 114.71 7.796l4.037 4.037 6.543-6.543a1 1 0 011.414 0z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4c0 .266.106.52.293.707l2.5 2.5a1 1 0 001.414-1.414L11 9.586V6z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function ProgressDashboardClient({
  cycleId,
  staffMemberId,
}: {
  cycleId: string;
  staffMemberId: string;
  staffName: string;
  cycleLabel: string;
}) {
  const [data, setData] = useState<ProgressPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams({ cycleId, staffMemberId });
    return `/api/admin/progress?${params.toString()}`;
  }, [cycleId, staffMemberId]);

  const load = useCallback(
    async (silent: boolean) => {
      if (silent) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const response = await fetch(query, { cache: "no-store" });
        const payload = (await response.json()) as ProgressPayload | { error?: string };

        if (!response.ok) {
          setError(payload && "error" in payload ? payload.error ?? "Failed to load progress." : "Failed to load progress.");
          return;
        }

        setData(payload as ProgressPayload);
        setError(null);
      } catch {
        setError("Failed to load progress.");
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
    },
    [query],
  );

  useEffect(() => {
    load(false);
  }, [load]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      load(true);
    }, 10000);

    return () => window.clearInterval(timer);
  }, [load]);

  const resend = async (evaluatorId: string) => {
    setToast(null);
    setResendingId(evaluatorId);

    try {
      const response = await fetch(`/api/admin/evaluators/${evaluatorId}/resend`, {
        method: "POST",
      });
      const payload = (await response.json()) as { warning?: string; error?: string; ok?: boolean };

      if (!response.ok || payload.ok === false) {
        setToast(payload.error ?? payload.warning ?? "Resend failed.");
      } else {
        setToast("Email resent successfully.");
      }

      await load(true);
    } catch {
      setToast("Resend failed.");
    } finally {
      setResendingId(null);
    }
  };

  const generate = async () => {
    setToast(null);
    setIsGenerating(true);

    try {
      const response = await fetch("/api/admin/progress/generate-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cycleId, staffMemberId }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        setToast(payload.error ?? "Could not generate report.");
      } else {
        setToast(payload.message ?? "Report generated.");
      }

      await load(true);
    } catch {
      setToast("Could not generate report.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-sm text-slate-600">Loading evaluation progress...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Could Not Load Progress</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-slate-700">{error ?? "Unknown error."}</p>
          <Button type="button" onClick={() => load(false)}>
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>{data.stageLabel}</CardTitle>
            <Button type="button" variant="outline" onClick={() => load(true)} disabled={isRefreshing}>
              {isRefreshing ? "Refreshing..." : "Refresh now"}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">Auto-refresh every 10 seconds.</p>
        </CardContent>
      </Card>

      {data.preview ? (
        <Card>
          <CardHeader>
            <CardTitle>Current Partial Score</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Final Score (70/30)</p>
                <p className="text-2xl font-semibold text-slate-900">{data.preview.finalScore.toFixed(1)}</p>
                <p className="text-xs text-slate-600">{data.preview.scoreLabel}</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Parents/Students Avg</p>
                <p className="text-lg font-semibold text-slate-900">{data.preview.parentGroupScore.toFixed(1)}</p>
                <p className="text-xs text-slate-600">Weight {(data.preview.parentWeight * 100).toFixed(0)}%</p>
              </div>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                <p className="text-xs text-slate-500">Peers Avg</p>
                <p className="text-lg font-semibold text-slate-900">{data.preview.peerGroupScore.toFixed(1)}</p>
                <p className="text-xs text-slate-600">Weight {(data.preview.peerWeight * 100).toFixed(0)}%</p>
              </div>
            </div>

            {data.preview.notes && data.preview.notes.length > 0 ? (
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
                {data.preview.notes.join(" ")}
              </div>
            ) : null}

            <p className="text-xs text-slate-600">
              This is a live preview based on submitted responses so far. Final report generation remains locked until both evaluator groups have at least one submission.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-3">
        {data.groups.map((group) => (
          <Card key={group.key}>
            <CardHeader>
              <CardTitle className="text-base">{group.name}</CardTitle>
              <p className="text-sm text-slate-600">
                {group.submitted} of {group.invited}
              </p>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full bg-sky-600"
                  style={{ width: `${group.progressPercent}%` }}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {group.evaluators.length === 0 ? (
                <p className="text-sm text-slate-500">No evaluators assigned.</p>
              ) : (
                group.evaluators.map((evaluator) => (
                  <div key={evaluator.id} className="rounded-md border border-slate-200 p-2">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-900">{evaluator.name}</p>
                        <p className="text-xs text-slate-500">{evaluator.email}</p>
                      </div>
                      {evaluator.status === "submitted" ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-300 bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700">
                          <CheckIcon />
                          Submitted
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                          <ClockIcon />
                          Pending
                        </span>
                      )}
                    </div>

                    {evaluator.status === "pending" ? (
                      <div className="mt-2">
                        <Button
                          type="button"
                          variant="outline"
                          className="h-8 px-2 py-1 text-xs"
                          onClick={() => resend(evaluator.id)}
                          disabled={resendingId === evaluator.id}
                        >
                          {resendingId === evaluator.id ? "Resending..." : "Resend email"}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Generate report checklist</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {data.checklist.map((item) => (
            <div key={item.key} className="flex items-center gap-2 text-sm">
              <span
                className={item.met ? "text-emerald-700" : "text-rose-700"}
                aria-hidden="true"
              >
                {item.met ? "[OK]" : "[WAIT]"}
              </span>
              <span className="text-slate-800">
                {item.label} - {item.submitted} of {item.invited} responded
                {!item.met ? " (waiting)" : ""}
              </span>
            </div>
          ))}

          <div className="pt-2">
            <Button
              type="button"
              onClick={generate}
              disabled={!data.generate.enabled || isGenerating}
            >
              {isGenerating ? "Working..." : data.generate.buttonLabel}
            </Button>
            {!data.generate.enabled ? (
              <p className="mt-2 text-xs text-slate-600">{data.generate.reason}</p>
            ) : null}
          </div>

          {toast ? (
            <p className="text-sm text-slate-700" role="status">
              {toast}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
