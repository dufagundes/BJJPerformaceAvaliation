"use client";

import { useState } from "react";
import { Button } from "../../../components/ui/button";

type ApiResponse = {
  ok?: boolean;
  message?: string;
  recipient?: string;
  delivery?: {
    error?: string;
  };
};

export default function SendTestEmailButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleSend = async () => {
    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    try {
      const response = await fetch("/api/admin/test-email", {
        method: "POST",
      });
      const payload = (await response.json()) as ApiResponse;

      if (!response.ok || payload.ok === false) {
        setIsError(true);
        setMessage(payload.delivery?.error || "Failed to send test email.");
      } else {
        setMessage(payload.message || `Test email sent to ${payload.recipient}.`);
      }
    } catch {
      setIsError(true);
      setMessage("Failed to send test email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {message ? (
        <div className={`rounded-md px-3 py-2 text-sm ${isError ? "border border-rose-300 bg-rose-50 text-rose-800" : "border border-emerald-300 bg-emerald-50 text-emerald-800"}`}>
          {message}
        </div>
      ) : null}

      <Button type="button" onClick={handleSend} disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send"}
      </Button>
    </div>
  );
}