"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "../../../../components/ui/button";

type Props = {
  cycleId: string;
};

type ApiSuccess = {
  reviewMarkdown: string;
};

type ApiError = {
  error?: string;
};

type SavedReviewPayload = {
  reviewMarkdown: string;
  savedAt: string;
};

export default function AiReviewControls({ cycleId }: Props) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [reviewMarkdown, setReviewMarkdown] = useState("");
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState("");

  const storageKey = useMemo(() => `ai-review:${cycleId}`, [cycleId]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        return;
      }

      const saved = JSON.parse(raw) as Partial<SavedReviewPayload>;
      if (typeof saved.reviewMarkdown === "string" && saved.reviewMarkdown.trim().length > 0) {
        setReviewMarkdown(saved.reviewMarkdown);
      }
      if (typeof saved.savedAt === "string") {
        setSavedAt(saved.savedAt);
      }
    } catch {
      setError("Saved AI review could not be loaded.");
    }
  }, [storageKey]);

  async function handleGenerate() {
    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/evaluations/${cycleId}/ai-feedback`, {
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as ApiError;
        throw new Error(payload.error ?? "Unable to generate AI review.");
      }

      const payload = (await response.json()) as ApiSuccess;
      setReviewMarkdown(payload.reviewMarkdown);
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to generate AI review.";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }

  function handlePrint() {
    if (!reviewMarkdown) {
      return;
    }

    const win = window.open("", "_blank", "noopener,noreferrer,width=900,height=700");
    if (!win) {
      setError("Popup blocked. Please allow popups to print the AI review.");
      return;
    }

    const escaped = reviewMarkdown
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    win.document.write(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>AI Performance Review</title>
  <style>
    body { font-family: Georgia, "Times New Roman", serif; margin: 32px; line-height: 1.5; color: #111827; }
    h1 { font-size: 22px; margin-bottom: 16px; }
    pre { white-space: pre-wrap; font-family: Georgia, "Times New Roman", serif; font-size: 14px; }
  </style>
</head>
<body>
  <h1>AI Performance Review</h1>
  <pre>${escaped}</pre>
</body>
</html>`);

    win.document.close();
    win.focus();
    win.print();
  }

  function handleSaveReview() {
    if (!reviewMarkdown) {
      return;
    }

    const payload: SavedReviewPayload = {
      reviewMarkdown,
      savedAt: new Date().toISOString(),
    };

    try {
      window.localStorage.setItem(storageKey, JSON.stringify(payload));
      setSavedAt(payload.savedAt);
      setError("");
    } catch {
      setError("Unable to save AI review on this device.");
    }
  }

  function handleLoadSaved() {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setError("No saved AI review found for this evaluation cycle.");
        return;
      }

      const saved = JSON.parse(raw) as Partial<SavedReviewPayload>;
      if (typeof saved.reviewMarkdown !== "string" || saved.reviewMarkdown.trim().length === 0) {
        setError("Saved AI review is invalid. Please generate a new one.");
        return;
      }

      setReviewMarkdown(saved.reviewMarkdown);
      setSavedAt(typeof saved.savedAt === "string" ? saved.savedAt : "");
      setError("");
    } catch {
      setError("Saved AI review could not be loaded.");
    }
  }

  function handleClearSaved() {
    window.localStorage.removeItem(storageKey);
    setSavedAt("");
    setError("");
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-900">AI Performance Review</p>

      <div className="flex flex-wrap gap-2">
        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? "Generating..." : "Generate AI Review"}
        </Button>

        <Button variant="outline" onClick={handleSaveReview} disabled={!reviewMarkdown}>
          Save AI Review
        </Button>

        <Button variant="outline" onClick={handleLoadSaved}>
          Load Saved Review
        </Button>

        <Button variant="outline" onClick={handlePrint} disabled={!reviewMarkdown}>
          Print AI Review
        </Button>

        <Button variant="outline" onClick={handleClearSaved}>
          Clear Saved
        </Button>
      </div>

      {savedAt ? (
        <p className="text-xs text-slate-500">Saved on this device: {new Date(savedAt).toLocaleString()}</p>
      ) : null}

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

      {reviewMarkdown ? (
        <div className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
          {reviewMarkdown}
        </div>
      ) : (
        <p className="text-sm text-slate-600">
          Generate the AI review when you are ready to conduct the performance meeting.
        </p>
      )}
    </div>
  );
}
