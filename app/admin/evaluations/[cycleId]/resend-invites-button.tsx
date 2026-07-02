"use client";

import { useState } from "react";
import { Button } from "../../../../components/ui/button";

type ResendResponse = {
  error?: string;
  sent?: number;
  failed?: number;
  results?: Array<{
    kind?: "self-evaluation" | "reviewer";
    email: string;
    ok: boolean;
    error?: string;
  }>;
};

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function getDeliveryBreakdown(results: ResendResponse["results"] = []) {
  const successful = results.filter((result) => result.ok);
  const reviewerCount = successful.filter((result) => result.kind === "reviewer").length;
  const selfEvaluationCount = successful.filter((result) => result.kind === "self-evaluation").length;
  const parts: string[] = [];

  if (reviewerCount > 0) {
    parts.push(pluralize(reviewerCount, "reviewer invitation"));
  }

  if (selfEvaluationCount > 0) {
    parts.push(pluralize(selfEvaluationCount, "self-evaluation email"));
  }

  return parts.length > 0 ? ` (${parts.join(", ")})` : "";
}

export default function ResendInvitesButton({ cycleId }: { cycleId: string }) {
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function resendInvites() {
    setIsSending(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch(`/api/admin/evaluations/${cycleId}/remind`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ template: "invitation" }),
      });
      const data = (await response.json()) as ResendResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Could not resend invitations.");
      }

      const sent = data.sent ?? 0;
      const failed = data.failed ?? 0;
      const breakdown = getDeliveryBreakdown(data.results);
      if (failed > 0) {
        const firstError = data.results?.find((result) => !result.ok)?.error;
        setIsError(true);
        setMessage(`${sent} pending emails accepted by the email service${breakdown}. ${failed} failed.${firstError ? ` First error: ${firstError}` : ""}`);
        return;
      }

      setMessage(`${sent} pending emails accepted by the email service${breakdown}.`);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Could not resend invitations.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={() => void resendInvites()} disabled={isSending}>
        <i className={`bi ${isSending ? "bi-arrow-repeat" : "bi-send"} mr-2`} aria-hidden="true" />
        {isSending ? "Sending..." : "Resend Pending Emails"}
      </Button>
      {message ? (
        <p className={`rounded-md border px-3 py-2 text-sm ${isError ? "border-rose-300 bg-rose-50 text-rose-800" : "border-emerald-300 bg-emerald-50 text-emerald-800"}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}