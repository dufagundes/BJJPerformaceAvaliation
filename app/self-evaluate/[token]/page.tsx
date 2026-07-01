"use client";

import { use, useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import type { SelfEvaluationQuestion } from "../../../lib/selfEvaluationQuestions";

type LoadState = "loading" | "ready" | "invalid" | "used" | "expired" | "error" | "complete";
type Answers = Record<string, string>;

function createInitialAnswers(questions: SelfEvaluationQuestion[]): Answers {
  return questions.reduce<Answers>((accumulator, question) => {
    accumulator[`q${question.order}`] = "";
    return accumulator;
  }, {});
}

export default function SelfEvaluatePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [staffName, setStaffName] = useState("");
  const [cycleName, setCycleName] = useState("");
  const [questions, setQuestions] = useState<SelfEvaluationQuestion[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadSelfEvaluation() {
      try {
        const response = await fetch(`/api/self-evaluate/${token}`, {
          method: "GET",
          cache: "no-store",
        });

        if (!isMounted) {
          return;
        }

        if (response.status === 404) {
          setLoadState("invalid");
          return;
        }

        if (response.status === 409) {
          setLoadState("used");
          return;
        }

        if (response.status === 410) {
          setLoadState("expired");
          return;
        }

        if (!response.ok) {
          setLoadState("error");
          return;
        }

        const data = (await response.json()) as {
          staffName?: string;
          cycleName?: string;
          questions?: SelfEvaluationQuestion[];
        };
        const nextQuestions = (data.questions ?? []).sort((left, right) => left.order - right.order);
        setStaffName(data.staffName ?? "");
        setCycleName(data.cycleName ?? "");
        setQuestions(nextQuestions);
        setAnswers(createInitialAnswers(nextQuestions));
        setLoadState("ready");
      } catch {
        if (isMounted) {
          setLoadState("error");
        }
      }
    }

    void loadSelfEvaluation();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const answeredCount = questions.filter((question) => answers[`q${question.order}`]?.trim().length > 0).length;
  const completionPercent = questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;
  const canSubmit = questions.length > 0 && answeredCount === questions.length;

  function renderMessage(title: string, message: string) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-600">{message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  async function handleSubmit() {
    if (!canSubmit || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await fetch(`/api/self-evaluate/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers }),
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error ?? "Unable to submit self evaluation.");
      }

      setLoadState("complete");
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to submit self evaluation.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadState === "loading") {
    return renderMessage("Loading Self Evaluation", "Preparing your reflection form...");
  }

  if (loadState === "invalid") {
    return renderMessage("Invalid Link", "This self evaluation link is invalid.");
  }

  if (loadState === "used") {
    return renderMessage("Already Submitted", "This self evaluation has already been submitted. Thank you for your reflection.");
  }

  if (loadState === "expired") {
    return renderMessage("Link Expired", "This self evaluation link has expired.");
  }

  if (loadState === "error") {
    return renderMessage("Something Went Wrong", "Unable to load this self evaluation right now.");
  }

  if (loadState === "complete") {
    return renderMessage("Thank You", "Your self evaluation has been submitted successfully and will help guide your review conversation.");
  }

  return (
    <main className="mx-auto max-w-3xl">
      <Card className="overflow-hidden border-slate-200 shadow-lg">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-8 text-white">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-200">Qualitative self evaluation</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight">{staffName || "Self Evaluation"}</h2>
          <p className="mt-2 text-sm text-slate-300">{cycleName}</p>
          <p className="mt-4 max-w-2xl text-sm text-slate-200">
            This is not a scorecard. Use this space to reflect on your accomplishments, strengths, challenges,
            improvement areas, support needs, and goals before your manager meeting.
          </p>
        </div>

        <CardContent className="space-y-6 p-6 sm:p-8">
          <div>
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">Progress</span>
              <span className="text-slate-500">{answeredCount}/{questions.length}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${completionPercent}%` }} />
            </div>
          </div>

          {questions.map((question) => {
            const answerKey = `q${question.order}`;
            const value = answers[answerKey] ?? "";

            return (
              <section key={question.order} className="rounded-2xl border border-slate-200 bg-white p-4">
                <Label htmlFor={answerKey} className="block text-base font-semibold text-slate-900">
                  {question.order}. {question.text}
                </Label>
                <Textarea
                  id={answerKey}
                  value={value}
                  onChange={(event) => setAnswers((previous) => ({ ...previous, [answerKey]: event.target.value.slice(0, 2000) }))}
                  className="mt-3 min-h-32 resize-y rounded-xl"
                  placeholder="Write your reflection here..."
                  disabled={isSubmitting}
                />
                <p className="mt-2 text-right text-xs text-slate-500">{value.length}/2000</p>
              </section>
            );
          })}

          {submitError ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{submitError}</p> : null}

          <div className="sticky bottom-0 -mx-6 border-t border-slate-200 bg-white/95 px-6 py-4 backdrop-blur sm:-mx-8 sm:px-8">
            <Button type="button" onClick={() => void handleSubmit()} disabled={!canSubmit || isSubmitting} className="w-full">
              {isSubmitting ? "Submitting..." : "Submit Self Evaluation"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}