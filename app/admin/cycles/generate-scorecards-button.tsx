"use client";

import { startTransition, useState } from "react";
import { Button } from "../../../components/ui/button";

type Props = {
  cycleId: string;
};

type ToastState = {
  kind: "success" | "error";
  message: string;
} | null;

export default function GenerateScorecardsButton({ cycleId }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState>(null);

  const onClick = () => {
    setIsSubmitting(true);
    setToast(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/generate-scorecards", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ cycleId }),
        });

        const data = (await response.json()) as { message?: string; error?: string };

        if (!response.ok) {
          setToast({ kind: "error", message: data.error ?? "Failed to generate scorecards." });
          setIsSubmitting(false);
          return;
        }

        setToast({ kind: "success", message: data.message ?? "Scorecards generated successfully." });
        setIsSubmitting(false);
        window.location.reload();
      } catch {
        setToast({ kind: "error", message: "Failed to generate scorecards." });
        setIsSubmitting(false);
      }
    });
  };

  return (
    <div className="space-y-3">
      <Button onClick={onClick} disabled={isSubmitting}>
        {isSubmitting ? "Generating..." : "Generate Scorecards"}
      </Button>

      {toast ? (
        <div
          className={`rounded-md px-3 py-2 text-sm ${
            toast.kind === "success"
              ? "border border-emerald-300 bg-emerald-50 text-emerald-800"
              : "border border-rose-300 bg-rose-50 text-rose-800"
          }`}
          role="status"
        >
          {toast.message}
        </div>
      ) : null}
    </div>
  );
}