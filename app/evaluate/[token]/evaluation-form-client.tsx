"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Label } from "../../../components/ui/label";
import { Textarea } from "../../../components/ui/textarea";
import { cn } from "../../../lib/utils";

type QuestionType = "MULTIPLE_CHOICE" | "TEXT";

type QuestionOption = {
  label: string;
  score: number;
};

type Question = {
  id: string;
  text: string;
  type: QuestionType;
  isRequired: boolean;
  options: QuestionOption[];
  order: number;
};

type LoadState = "loading" | "ready" | "invalid" | "used" | "error";
type Answers = Record<string, string | number>;

function createInitialAnswers(questions: Question[]): Answers {
  return questions.reduce<Answers>((accumulator, question) => {
    accumulator[`q${question.order}`] = question.type === "TEXT" ? "" : Number.NaN;
    return accumulator;
  }, {});
}

export default function EvaluationFormClient({ token }: { token: string }) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [staffFirstName, setStaffFirstName] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [submitError, setSubmitError] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadEvaluator() {
      try {
        const response = await fetch(`/api/evaluate/${token}`, {
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

        if (!response.ok) {
          setLoadState("error");
          return;
        }

        const data = (await response.json()) as { staffFirstName?: string; questions?: Question[] };
        const nextQuestions = (data.questions ?? []).sort((left, right) => left.order - right.order);

        setStaffFirstName(data.staffFirstName ?? "this staff member");
        setQuestions(nextQuestions);
        setAnswers(createInitialAnswers(nextQuestions));
        setLoadState("ready");
      } catch {
        if (isMounted) {
          setLoadState("error");
        }
      }
    }

    void loadEvaluator();

    return () => {
      isMounted = false;
    };
  }, [token]);

  const isFormComplete = useMemo(() => {
    return questions.every((question) => {
      const value = answers[`q${question.order}`];

      if (question.type === "TEXT") {
        if (!question.isRequired) {
          return true;
        }

        return typeof value === "string" && value.trim().length > 0;
      }

      return typeof value === "number" && Number.isFinite(value);
    });
  }, [answers, questions]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isFormComplete) {
      setSubmitError("Please answer all questions before submitting.");
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/evaluate/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers }),
      });

      if (response.status === 409) {
        setLoadState("used");
        setIsSubmitting(false);
        return;
      }

      if (!response.ok) {
        setSubmitError("Could not submit your evaluation. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setSubmitError("Could not submit your evaluation. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function renderError(title: string, message: string) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{message}</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (loadState === "loading") {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-md">
          <Card>
            <CardContent className="py-8">
              <p className="text-center text-sm text-slate-600">Loading evaluation form...</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  if (loadState === "invalid") {
    return renderError("Invalid Link", "This evaluation link is invalid.");
  }

  if (loadState === "used") {
    return renderError(
      "Already Submitted",
      "This evaluation has already been submitted. Thank you for your participation.",
    );
  }

  if (loadState === "error") {
    return renderError("Something Went Wrong", "Unable to load this evaluation form right now.");
  }

  if (submitted) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-md">
          <Card>
            <CardHeader>
              <CardTitle>Thank You</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">Your evaluation has been submitted successfully.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:py-10">
      <div className="mx-auto max-w-3xl">
        <Card className="overflow-hidden border-slate-200 shadow-lg">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 px-6 py-8 text-white">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-300">Evaluation Access</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">You are evaluating {staffFirstName}</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-300">
              Please choose the answer that best matches your experience and share feedback where requested.
            </p>
          </div>

          <CardContent className="space-y-8 p-6 sm:p-8">
            <form className="space-y-6" onSubmit={handleSubmit}>
              {questions.map((question) => {
                const answerKey = `q${question.order}`;
                const value = answers[answerKey];

                return (
                  <section key={question.id} className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <Label className="text-base font-medium leading-6 text-slate-900">
                      {question.order}. {question.text}
                      {!question.isRequired ? (
                        <span className="ml-2 text-xs font-normal uppercase tracking-wide text-slate-500">Optional</span>
                      ) : null}
                    </Label>

                    {question.type === "TEXT" ? (
                      <Textarea
                        value={typeof value === "string" ? value : ""}
                        onChange={(event) => {
                          setAnswers((previous) => ({ ...previous, [answerKey]: event.target.value }));
                        }}
                        className="min-h-28 rounded-xl"
                        placeholder="Share your feedback"
                      />
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                        {question.options.map((option) => {
                          const selected = value === option.score;
                          return (
                            <button
                              type="button"
                              key={`${question.id}-${option.label}-${option.score}`}
                              onClick={() => {
                                setAnswers((previous) => ({ ...previous, [answerKey]: option.score }));
                              }}
                              className={cn(
                                "rounded-xl border px-4 py-3 text-left text-sm transition",
                                selected
                                  ? "border-slate-900 bg-slate-900 text-white shadow-md"
                                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
                              )}
                            >
                              <div className="font-semibold">{option.label}</div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </section>
                );
              })}

              {submitError ? <p className="text-sm text-red-600">{submitError}</p> : null}

              <div className="pt-2">
                <Button type="submit" disabled={!isFormComplete || isSubmitting} className="w-full sm:w-auto">
                  {isSubmitting ? "Submitting..." : "Submit Evaluation"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
