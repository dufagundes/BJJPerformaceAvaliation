"use client";

import { useState } from "react";
import { Button } from "../../../components/ui/button";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";

type ApiResponse = {
  success?: boolean;
  message?: string;
  error?: string;
  sid?: string;
};

export default function SendTestSmsButton() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);
  const [phoneNumbers, setPhoneNumbers] = useState("");
  const [smsMessage, setSmsMessage] = useState("");

  const normalizePhoneNumbers = (input: string): string[] => {
    return input
      .split(/[\s,;]+/)
      .map((num) => num.trim())
      .filter((num) => num.length > 0);
  };

  const handleSend = async () => {
    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    const numbers = normalizePhoneNumbers(phoneNumbers);
    if (numbers.length === 0) {
      setIsError(true);
      setMessage("Please enter at least one phone number.");
      setIsSubmitting(false);
      return;
    }

    if (!smsMessage.trim()) {
      setIsError(true);
      setMessage("Please enter a message to send.");
      setIsSubmitting(false);
      return;
    }

    try {
      const failedNumbers: string[] = [];
      const successCount = { count: 0 };

      await Promise.all(
        numbers.map(async (phoneNumber) => {
          try {
            const response = await fetch("/api/admin/test-sms", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                to: phoneNumber,
                message: smsMessage,
              }),
            });

            const payload = (await response.json()) as ApiResponse;

            if (!response.ok || payload.success === false) {
              failedNumbers.push(`${phoneNumber}: ${payload.error || "Unknown error"}`);
            } else {
              successCount.count++;
            }
          } catch (error) {
            failedNumbers.push(`${phoneNumber}: ${error instanceof Error ? error.message : "Failed to send"}`);
          }
        })
      );

      if (successCount.count > 0) {
        let resultMessage = `✓ Successfully sent ${successCount.count} SMS message${successCount.count !== 1 ? "s" : ""}.`;
        if (failedNumbers.length > 0) {
          resultMessage += ` Failed: ${failedNumbers.join("; ")}`;
          setIsError(true);
        } else {
          setIsError(false);
        }
        setMessage(resultMessage);
      } else {
        setIsError(true);
        setMessage(`Failed to send SMS: ${failedNumbers.join("; ")}`);
      }
    } catch (error) {
      setIsError(true);
      setMessage(`Failed to send SMS: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="test-sms-recipients">Recipient phone numbers</Label>
        <Textarea
          id="test-sms-recipients"
          value={phoneNumbers}
          onChange={(event) => setPhoneNumbers(event.target.value)}
          placeholder="+14155552671&#10;+1-415-555-2672&#10;415.555.2673"
          className="min-h-24"
        />
        <p className="text-sm text-slate-600">Add one or more phone numbers, separated by a new line, comma, semicolon, or space. Include country code (e.g., +1 for USA).</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="test-sms-message">SMS Message</Label>
        <Textarea
          id="test-sms-message"
          value={smsMessage}
          onChange={(event) => setSmsMessage(event.target.value)}
          placeholder="Enter your test message here..."
          className="min-h-24"
        />
        <p className="text-sm text-slate-600">Message length: {smsMessage.length} characters</p>
      </div>

      {message ? (
        <div className={`rounded-md px-3 py-2 text-sm ${isError ? "border border-rose-300 bg-rose-50 text-rose-800" : "border border-emerald-300 bg-emerald-50 text-emerald-800"}`}>
          {message}
        </div>
      ) : null}

      <Button
        type="button"
        onClick={handleSend}
        disabled={isSubmitting || phoneNumbers.trim().length === 0 || smsMessage.trim().length === 0}
      >
        {isSubmitting ? "Sending..." : "Send SMS"}
      </Button>
    </div>
  );
}
