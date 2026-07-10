"use client";

import { useState } from "react";
import { Button } from "../../../../components/ui/button";

type ResendResponse = {
  error?: string;
  sent?: number;
  failed?: number;
  total?: number;
  results?: Array<{
    name: string;
    phone: string;
    ok: boolean;
    error?: string;
  }>;
};

export default function ResendSmsButton({ cycleId }: { cycleId: string }) {
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function resendSms() {
    setIsSending(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch(`/api/admin/evaluations/${cycleId}/resend-sms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = (await response.json()) as ResendResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Could not resend SMS.");
      }

      const sent = data.sent ?? 0;
      const failed = data.failed ?? 0;
      const total = data.total ?? 0;

      if (total === 0) {
        setMessage("All reviewers have already responded or no non-respondents found.");
        return;
      }

      if (failed > 0) {
        const firstError = data.results?.find((result) => !result.ok)?.error;
        setIsError(true);
        setMessage(
          `${sent} of ${total} reminder SMS sent to non-respondents. ${failed} failed.${
            firstError ? ` First error: ${firstError}` : ""
          }`
        );
        return;
      }

      setMessage(`✓ ${sent} reminder SMS sent to non-respondent reviewer${sent !== 1 ? "s" : ""}.`);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Could not resend SMS.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" onClick={() => void resendSms()} disabled={isSending}>
        <i className={`bi ${isSending ? "bi-arrow-repeat" : "bi-telephone"} mr-2`} aria-hidden="true" />
        {isSending ? "Sending..." : "Resend SMS"}
      </Button>
      {message ? (
        <p className={`rounded-md border px-3 py-2 text-sm ${isError ? "border-rose-300 bg-rose-50 text-rose-800" : "border-emerald-300 bg-emerald-50 text-emerald-800"}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}
