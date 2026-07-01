"use client";

import { useState } from "react";
import { Button } from "../../../../components/ui/button";

type SendResponse = {
  email?: string;
  error?: string;
};

export default function SendSelfEvaluationButton({ cycleId }: { cycleId: string }) {
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  async function sendSelfEvaluation() {
    setIsSending(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch(`/api/admin/evaluations/${cycleId}/self-evaluation/send`, {
        method: "POST",
      });
      const data = (await response.json().catch(() => ({}))) as SendResponse;

      if (!response.ok) {
        throw new Error(data.error ?? "Could not send self evaluation email.");
      }

      setMessage(`Self evaluation email sent${data.email ? ` to ${data.email}` : ""}.`);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Could not send self evaluation email.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="space-y-2">
      <Button type="button" variant="outline" onClick={() => void sendSelfEvaluation()} disabled={isSending}>
        {isSending ? "Sending..." : "Send Self Evaluation"}
      </Button>
      {message ? (
        <p className={`rounded-md border px-3 py-2 text-sm ${isError ? "border-rose-300 bg-rose-50 text-rose-800" : "border-emerald-300 bg-emerald-50 text-emerald-800"}`}>
          {message}
        </p>
      ) : null}
    </div>
  );
}