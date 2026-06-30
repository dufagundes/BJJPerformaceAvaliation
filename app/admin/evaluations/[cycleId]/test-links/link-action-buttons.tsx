"use client";

import { useState } from "react";

type RefreshPageButtonProps = {
  className?: string;
};

export function RefreshPageButton({ className }: RefreshPageButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.location.reload()}
      className={className}
    >
      Refresh Page
    </button>
  );
}

type ResendEmailButtonProps = {
  cycleId: string;
  reviewerId: string;
  className?: string;
};

type ResendEmailResponse = {
  email?: string;
  error?: string;
};

export function ResendEmailButton({ cycleId, reviewerId, className }: ResendEmailButtonProps) {
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const onResend = async () => {
    setIsSending(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch(`/api/admin/evaluations/${cycleId}/reviewers/${reviewerId}/resend`, {
        method: "POST",
      });
      const data = (await response.json()) as ResendEmailResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Could not resend email.");
      }

      setMessage(data.email ? `Sent to ${data.email}.` : "Email sent.");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Could not resend email.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <span className="inline-flex flex-col gap-1 align-top">
      <button
        type="button"
        onClick={() => void onResend()}
        disabled={isSending}
        className={className}
        title="Resend invitation email"
      >
        {isSending ? "Sending..." : "Resend Email"}
      </button>
      {message ? (
        <span className={`max-w-xs text-xs ${isError ? "text-rose-700" : "text-emerald-700"}`}>
          {message}
        </span>
      ) : null}
    </span>
  );
}