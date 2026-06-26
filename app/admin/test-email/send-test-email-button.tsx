"use client";

import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";

type ApiResponse = {
  ok?: boolean;
  message?: string;
  error?: string;
  recipients?: string[];
  delivery?: {
    error?: string;
  };
};

export default function SendTestEmailButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [recipients, setRecipients] = useState("");

  const handleSend = async () => {
    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    try {
      const response = await fetch("/api/admin/test-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipients }),
      });
      const payload = (await response.json()) as ApiResponse;

      if (!response.ok || payload.ok === false) {
        setIsError(true);
        setMessage(payload.error || payload.delivery?.error || "Failed to send test email.");
      } else {
        setMessage(payload.message || "Test email sent.");
      }
    } catch {
      setIsError(true);
      setMessage("Failed to send test email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="test-email-recipients">Recipient emails</Label>
        <Textarea
          id="test-email-recipients"
          value={recipients}
          onChange={(event) => setRecipients(event.target.value)}
          placeholder="name@example.com\nsecond@example.com"
          className="min-h-32"
        />
        <p className="text-sm text-slate-600">Add one or more emails, separated by a new line, comma, semicolon, or space.</p>
      </div>

      {message ? (
        <div className={`rounded-md px-3 py-2 text-sm ${isError ? "border border-rose-300 bg-rose-50 text-rose-800" : "border border-emerald-300 bg-emerald-50 text-emerald-800"}`}>
          {message}
        </div>
      ) : null}

      <Button type="button" onClick={handleSend} disabled={isSubmitting || recipients.trim().length === 0}>
        {isSubmitting ? "Sending..." : "Send"}
      </Button>
    </div>
  );
}