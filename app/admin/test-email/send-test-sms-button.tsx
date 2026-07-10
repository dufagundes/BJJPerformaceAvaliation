"use client";

import { useState } from "react";
import { normalizePhoneNumber } from "@/lib/phoneUtils";
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

  const normalizePhoneNumbers = (input: string): { valid: string[]; invalid: string[] } => {
    const lines = input.split(/[\n]+/).filter((line) => line.trim().length > 0);
    const valid: string[] = [];
    const invalid: string[] = [];

    lines.forEach((line) => {
      // Handle comma/semicolon-separated numbers on same line
      const numbers = line.split(/[,;]/).map((n) => n.trim()).filter((n) => n.length > 0);
      
      numbers.forEach((phoneNumber) => {
        const normalized = normalizePhoneNumber(phoneNumber, "1"); // Force US country code
        if (normalized) {
          valid.push(normalized);
        } else {
          invalid.push(phoneNumber);
        }
      });
    });

    return { valid, invalid };
  };

  const handleSend = async () => {
    setIsSubmitting(true);
    setMessage(null);
    setIsError(false);

    const { valid: validNumbers, invalid: invalidNumbers } = normalizePhoneNumbers(phoneNumbers);
    
    if (invalidNumbers.length > 0) {
      setIsError(true);
      setMessage(
        `Invalid phone numbers (must be US format like 415-555-2671 or +1415555267): ${invalidNumbers.join(", ")}`
      );
      setIsSubmitting(false);
      return;
    }

    if (validNumbers.length === 0) {
      setIsError(true);
      setMessage("Please enter at least one valid US phone number (e.g., 415-555-2671 or +14155552671).");
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
        validNumbers.map(async (phoneNumber) => {
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
        <Label htmlFor="test-sms-recipients">Recipient phone numbers (US only)</Label>
        <Textarea
          id="test-sms-recipients"
          value={phoneNumbers}
          onChange={(event) => setPhoneNumbers(event.target.value)}
          placeholder="4155552671&#10;415-555-2672&#10;(415) 555-2673&#10;+1 415 555 2674"
          className="min-h-24"
        />
        <p className="text-sm text-slate-600">US phone numbers only. Accepts formats: 4155552671, 415-555-2671, (415) 555-2671, or +1415555267. One per line or comma/semicolon separated.</p>
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
