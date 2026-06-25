"use client";

import { use, useEffect, useState } from "react";
import EvaluationIntroPage from "./intro";
import EvaluationQuestionClient from "./question-client";
import OpenEndedQuestionsPage from "./open-ended";

type PageState = "intro" | "questions" | "open-ended" | "complete";

export default function EvaluatePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [pageState, setPageState] = useState<PageState>("intro");
  const [totalQuestions, setTotalQuestions] = useState(0);

  // Listen for hash changes to navigate between pages
  useEffect(() => {
    function handleHashChange() {
      if (window.location.hash === "#start-evaluation") {
        setPageState("questions");
        window.location.hash = "";
      } else if (window.location.hash === "#open-ended") {
        setPageState("open-ended");
        window.location.hash = "";
      } else if (window.location.hash === "#complete") {
        setPageState("complete");
        window.location.hash = "";
      }
    }

    window.addEventListener("hashchange", handleHashChange);
    handleHashChange(); // Check on mount

    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  if (pageState === "intro") {
    return (
      <EvaluationIntroPage
        token={token}
        onQuestionCountLoaded={(count) => setTotalQuestions(count)}
      />
    );
  }

  if (pageState === "open-ended") {
    return (
      <OpenEndedQuestionsPage
        token={token}
        totalQuestions={totalQuestions + 1}
        onPrevious={() => setPageState("questions")}
        onSubmit={(strengths, improvements) => {
          sessionStorage.setItem(
            "evaluation-open-ended",
            JSON.stringify({ strengths, improvements })
          );
          window.location.hash = "#complete";
        }}
        isSubmitting={false}
      />
    );
  }

  if (pageState === "complete") {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="rounded-lg border border-slate-200 overflow-hidden shadow-lg">
          <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 px-6 py-12 text-white">
            <h1 className="text-3xl font-semibold tracking-tight">Thank You</h1>
          </div>
          <div className="p-8 space-y-4">
            <p className="text-sm text-slate-600">
              Your evaluation has been submitted successfully.
            </p>
            <p className="text-sm text-slate-500">
              Your feedback is valuable and will be used to support professional growth. Thank you for taking the time
              to provide thoughtful input.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <EvaluationQuestionClient
      token={token}
      onNavigateToOpenEnded={() => setPageState("open-ended")}
    />
  );
}
