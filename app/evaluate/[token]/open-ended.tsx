"use client";

import { FormEvent, useState } from "react";
import EvaluationProgress from "../../../components/EvaluationProgress";
import { Button } from "../../../components/ui/button";
import { Card, CardContent } from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";

export default function OpenEndedQuestionsPage({
  token,
  totalQuestions,
  onPrevious,
  onSubmit,
  isSubmitting,
}: {
  token: string;
  totalQuestions: number;
  onPrevious: () => void;
  onSubmit: (strengths: string, improvements: string) => void;
  isSubmitting: boolean;
}) {
  const [strengths, setStrengths] = useState<string>("");
  const [improvements, setImprovements] = useState<string>("");
  const [showWarning, setShowWarning] = useState(false);
  const [localIsSubmitting, setLocalIsSubmitting] = useState(false);

  const MAX_LENGTH = 1000;
  const MIN_LENGTH = 20;

  const strengthsCount = strengths.length;
  const improvementsCount = improvements.length;

  const bothEmpty = strengthsCount === 0 && improvementsCount === 0;
  const bothValid = strengthsCount >= MIN_LENGTH && improvementsCount >= MIN_LENGTH;
  const canSubmit = bothEmpty || bothValid;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      return;
    }

    if (bothEmpty && !showWarning) {
      setShowWarning(true);
      return;
    }

    setLocalIsSubmitting(true);
    try {
      const likertAnswersStr = sessionStorage.getItem("evaluation-likert-answers");
      const likertAnswers = likertAnswersStr ? JSON.parse(likertAnswersStr) : {};
      const allAnswers = {
        ...likertAnswers,
        strengths_text: strengths,
        improvements_text: improvements,
      };
      const response = await fetch(`/api/evaluate/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: allAnswers }),
      });
      if (!response.ok) throw new Error(`API error: ${response.status}`);
      sessionStorage.removeItem("evaluation-likert-answers");
      onSubmit(strengths, improvements);
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to submit evaluation. Please try again.");
      setLocalIsSubmitting(false);
    }
  };

  const handleStrengthsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_LENGTH) {
      setStrengths(value);
      setShowWarning(false);
    }
  };

  const handleImprovementsChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_LENGTH) {
      setImprovements(value);
      setShowWarning(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl">
      <EvaluationProgress currentQuestion={totalQuestions} totalQuestions={totalQuestions} />

      <Card className="mt-8 overflow-hidden border-slate-200 shadow-lg">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-8 text-white">
          <h2 className="text-2xl font-semibold tracking-tight">Final Feedback</h2>
          <p className="mt-2 text-sm text-slate-300">
            Thank you for completing the rating questions. Now please share your thoughts in more detail.
          </p>
        </div>

        <CardContent className="space-y-8 p-8">
          {/* Strengths Question */}
          <div className="space-y-3">
            <Label htmlFor="strengths" className="text-base font-semibold text-slate-900">
              What are this staff member's key strengths?
            </Label>
            <p className="text-sm text-slate-600">
              Please share specific examples of what this staff member does well. Consider their teaching style, 
              communication, leadership, work ethic, or any other areas where they excel.
            </p>
            <Textarea
              id="strengths"
              value={strengths}
              onChange={handleStrengthsChange}
              placeholder="Share specific examples of their strengths..."
              className="min-h-[120px] resize-none"
              disabled={isSubmitting || localIsSubmitting}
            />
            <div className="flex justify-between">
              <span className="text-xs text-slate-500">
                {strengthsCount >= MIN_LENGTH ? (
                  <span className="text-emerald-600 font-medium">✓ Sufficient</span>
                ) : (
                  <span>
                    Minimum {MIN_LENGTH} characters {strengthsCount > 0 && `(${strengthsCount}/${MIN_LENGTH})`}
                  </span>
                )}
              </span>
              <span className="text-xs text-slate-500">
                {strengthsCount}/{MAX_LENGTH}
              </span>
            </div>
          </div>

          {/* Areas for Improvement Question */}
          <div className="space-y-3">
            <Label htmlFor="improvements" className="text-base font-semibold text-slate-900">
              What is one area where this staff member could improve?
            </Label>
            <p className="text-sm text-slate-600">
              Please be constructive and specific. What skill, behavior, or approach could they develop further? 
              Consider areas like communication, time management, curriculum development, or interpersonal dynamics.
            </p>
            <Textarea
              id="improvements"
              value={improvements}
              onChange={handleImprovementsChange}
              placeholder="Share areas where they could grow or improve..."
              className="min-h-[120px] resize-none"
              disabled={isSubmitting || localIsSubmitting}
            />
            <div className="flex justify-between">
              <span className="text-xs text-slate-500">
                {improvementsCount >= MIN_LENGTH ? (
                  <span className="text-emerald-600 font-medium">✓ Sufficient</span>
                ) : (
                  <span>
                    Minimum {MIN_LENGTH} characters {improvementsCount > 0 && `(${improvementsCount}/${MIN_LENGTH})`}
                  </span>
                )}
              </span>
              <span className="text-xs text-slate-500">
                {improvementsCount}/{MAX_LENGTH}
              </span>
            </div>
          </div>

          {/* Warning Message */}
          {showWarning && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> Both fields are optional, but we strongly encourage you to provide feedback 
                in both areas. Your detailed insights are valuable. Click "Submit" again to proceed, or add more detail above.
              </p>
            </div>
          )}
        </CardContent>

        {/* Navigation Buttons */}
        <div className="border-t border-slate-200 bg-slate-50 px-8 py-4 flex justify-between gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={onPrevious}
            disabled={isSubmitting || localIsSubmitting}
            className="flex-1"
          >
            ← Previous
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || localIsSubmitting || !canSubmit}
            className="flex-1 bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {isSubmitting || localIsSubmitting ? "Submitting..." : "Submit Evaluation"}
          </Button>
        </div>
      </Card>
    </div>
  );
}
