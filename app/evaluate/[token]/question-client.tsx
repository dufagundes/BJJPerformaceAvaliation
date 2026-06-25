"use client";

import { useEffect, useState } from "react";
import EvaluationProgress from "../../../components/EvaluationProgress";
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

export default function EvaluationQuestionClient({
  token,
  onNavigateToOpenEnded,
}: {
  token: string;
  onNavigateToOpenEnded?: () => void;
}) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Answers>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

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

        const data = (await response.json()) as { questions?: Question[] };
        const nextQuestions = (data.questions ?? []).sort((left, right) => left.order - right.order);

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

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const currentAnswerValue = currentQuestion ? answers[`q${currentQuestion.order}`] : undefined;
  const isCurrentAnswered =
    currentQuestion?.type === "TEXT"
      ? typeof currentAnswerValue === "string" && currentAnswerValue.trim().length > 0
      : typeof currentAnswerValue === "number" && Number.isFinite(currentAnswerValue);

  function renderError(title: string, message: string) {
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

  if (loadState === "loading") {
    return (
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-sm text-slate-600">Loading evaluation form...</p>
          </CardContent>
        </Card>
      </div>
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


  if (!currentQuestion) {
    return renderError("No Questions", "Unable to load evaluation questions.");
  }

  const answerKey = `q${currentQuestion.order}`;
  const value = answers[answerKey];

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="overflow-hidden border-slate-200 shadow-lg">
        <CardContent className="space-y-6 p-6 sm:p-8">
          <EvaluationProgress currentQuestion={currentQuestionIndex + 1} totalQuestions={questions.length} />

          <div className="space-y-8">
            {/* Question Display */}
            <div className="space-y-4">
              <Label className="block text-lg font-medium leading-6 text-slate-900">
                {currentQuestion.text}
                {!currentQuestion.isRequired ? (
                  <span className="ml-2 text-xs font-normal uppercase tracking-wide text-slate-500">Optional</span>
                ) : null}
              </Label>

              {currentQuestion.type === "TEXT" ? (
                <Textarea
                  value={typeof value === "string" ? value : ""}
                  onChange={(event) => {
                    setAnswers((previous) => ({ ...previous, [answerKey]: event.target.value }));
                  }}
                  className="min-h-32 rounded-xl"
                  placeholder="Share your feedback"
                />
              ) : (
                <div className="grid gap-3 sm:grid-cols-1">
                  {currentQuestion.options.map((option) => {
                    const selected = value === option.score;
                    return (
                      <button
                        type="button"
                        key={`${currentQuestion.id}-${option.label}-${option.score}`}
                        onClick={() => {
                          setAnswers((previous) => ({ ...previous, [answerKey]: option.score }));
                        }}
                        className={cn(
                          "rounded-xl border-2 px-4 py-4 text-left transition",
                          selected
                            ? "border-slate-900 bg-slate-900 text-white shadow-md"
                            : "border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50",
                        )}
                      >
                        <div className="font-semibold">{option.label}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Navigation Buttons */}
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                disabled={isFirstQuestion}
              >
                ← Previous
              </Button>

              {isLastQuestion ? (
                <Button
                  type="button"
                  onClick={() => {
                    sessionStorage.setItem(
                      "evaluation-likert-answers",
                      JSON.stringify(answers)
                    );
                    onNavigateToOpenEnded?.();
                  }}
                  disabled={!isCurrentAnswered}
                >
                  Next →
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={() => setCurrentQuestionIndex(currentQuestionIndex + 1)}
                  disabled={!isCurrentAnswered}
                >
                  Next →
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
