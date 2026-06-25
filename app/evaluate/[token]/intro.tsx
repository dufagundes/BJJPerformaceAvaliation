"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";

type LoadState = "loading" | "ready" | "error";

export default function EvaluationIntroPage({
  token,
  onQuestionCountLoaded,
}: {
  token: string;
  onQuestionCountLoaded?: (count: number) => void;
}) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [staffFirstName, setStaffFirstName] = useState<string>("");
  const [totalQuestions, setTotalQuestions] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;

    async function loadEvaluationInfo() {
      try {
        console.log(`[intro.tsx] Fetching evaluation data for token: ${token}`);
        const response = await fetch(`/api/evaluate/${token}`, {
          method: "GET",
          cache: "no-store",
        });

        console.log(`[intro.tsx] API response status: ${response.status}`);

        if (!isMounted) return;

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`[intro.tsx] API error response:`, errorBody);
          setLoadState("error");
          return;
        }

        const data = (await response.json()) as {
          staffFirstName?: string;
          questions?: Array<{ order: number }>;
        };

        console.log(`[intro.tsx] Loaded data:`, data);

        setStaffFirstName(data.staffFirstName ?? "this staff member");
        setTotalQuestions(data.questions?.length ?? 0);
        if (onQuestionCountLoaded && data.questions) {
          onQuestionCountLoaded(data.questions.length);
        }
        setLoadState("ready");
      } catch (error) {
        console.error(`[intro.tsx] Error loading evaluation:`, error);
        if (isMounted) {
          setLoadState("error");
        }
      }
    }

    void loadEvaluationInfo();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const handleStart = useCallback(() => {
    // Navigate to the question page
    // We'll use the existing evaluation form for now
    window.location.hash = "#start-evaluation";
  }, []);

  if (loadState === "loading") {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="py-12">
            <p className="text-center text-sm text-slate-600">Loading evaluation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loadState === "error") {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Unable to Load Evaluation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">
              There was an error loading your evaluation. Please check your link and try again.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="overflow-hidden border-slate-200 shadow-lg">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-12 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">Performance Evaluation</p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Thank you for taking time to evaluate {staffFirstName}
          </h1>
        </div>

        <CardContent className="space-y-8 p-8">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">About this evaluation</h2>

            <div className="space-y-3 text-sm leading-relaxed text-slate-700">
              <p>
                Your honest feedback is valuable and helps us understand strengths and areas for growth. This evaluation is
                completely anonymous — your individual responses will not be identified or shared.
              </p>

              <p>
                All feedback is combined with responses from other reviewers and analyzed as a group, ensuring your privacy
                while providing meaningful insights.
              </p>

              <p>
                <strong>What to expect:</strong> {totalQuestions} questions about your experience and observations. Most
                reviewers complete this in 5-10 minutes.
              </p>

              <p>
                You can review your answers before submitting. Once submitted, your evaluation cannot be changed, but you can
                always contact us with questions.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-sky-200 bg-sky-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-sky-900">Submission</p>
            <p className="mt-2 text-sm text-sky-800">
              This link is personal to you. You can start the evaluation and continue later, but your final response can
              only be submitted once.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <Button
              onClick={handleStart}
              className="w-full px-5 py-3 text-base bg-slate-900 text-white hover:bg-slate-800"
            >
              Begin Evaluation
            </Button>

            <p className="text-center text-xs text-slate-500">
              Your progress will be saved as you move through the questions.
            </p>
          </div>
        </CardContent>
      </Card>

      <p className="mt-6 text-center text-xs text-slate-500">
        Need help? If you experience any issues, please contact the evaluation administrator.
      </p>
    </div>
  );
}
