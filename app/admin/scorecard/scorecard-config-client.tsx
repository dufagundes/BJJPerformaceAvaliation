"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";

type AudienceType = "ALL" | "PEER" | "PARENT_STUDENT";
type QuestionType = "MULTIPLE_CHOICE" | "TEXT";

type OptionState = {
  clientId: string;
  label: string;
  score: string;
};

type QuestionState = {
  clientId: string;
  id?: string;
  staffRole?: string;
  audienceType: AudienceType;
  text: string;
  type: QuestionType;
  isRequired: boolean;
  order: number;
  options: OptionState[];
};

const audienceLabels: Record<AudienceType, string> = {
  ALL: "All evaluators",
  PEER: "Peers only",
  PARENT_STUDENT: "Parents/Students only",
};

function toQuestionState(question: {
  id: string;
  staffRole?: string;
  audienceType: AudienceType;
  text: string;
  type: QuestionType;
  isRequired: boolean;
  order: number;
  options: Array<{ label: string; score: number }>;
}): QuestionState {
  return {
    clientId: crypto.randomUUID(),
    id: question.id,
    staffRole: question.staffRole,
    audienceType: question.audienceType,
    text: question.text,
    type: question.type,
    isRequired: question.isRequired,
    order: question.order,
    options: question.options.map((option) => ({
      clientId: crypto.randomUUID(),
      label: option.label,
      score: String(option.score),
    })),
  };
}

function createEmptyQuestion(order: number): QuestionState {
  return {
    clientId: crypto.randomUUID(),
    audienceType: "ALL",
    text: "",
    type: "MULTIPLE_CHOICE",
    isRequired: true,
    order,
    options: [createEmptyOption(), createEmptyOption()],
  };
}

function createEmptyOption(): OptionState {
  return {
    clientId: crypto.randomUUID(),
    label: "",
    score: "0",
  };
}

function parseScore(value: string): number {
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export default function ScorecardConfigClient() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [questions, setQuestions] = useState<QuestionState[]>([]);

  useEffect(() => {
    async function loadQuestions() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/admin/scorecard-config", { cache: "no-store" });
        const data = (await response.json()) as {
          questions?: Array<{
            id: string;
            staffRole?: string;
            audienceType: AudienceType;
            text: string;
            type: QuestionType;
            isRequired: boolean;
            order: number;
            options: Array<{ label: string; score: number }>;
          }>;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(data.error ?? "Could not load scorecard configuration.");
        }

        setQuestions((data.questions ?? []).map(toQuestionState));
      } catch (error) {
        setIsError(true);
        setMessage(error instanceof Error ? error.message : "Could not load scorecard configuration.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadQuestions();
  }, []);

  const groupedQuestions = useMemo(() => {
    return {
      ALL: questions.filter((question) => question.audienceType === "ALL"),
      PEER: questions.filter((question) => question.audienceType === "PEER"),
      PARENT_STUDENT: questions.filter((question) => question.audienceType === "PARENT_STUDENT"),
    };
  }, [questions]);

  function updateQuestion(clientId: string, updater: (question: QuestionState) => QuestionState) {
    setQuestions((previous) => previous.map((question) => (question.clientId === clientId ? updater(question) : question)));
  }

  function addQuestion(audienceType: AudienceType) {
    setQuestions((previous) => {
      const nextOrder =
        Math.max(
          0,
          ...previous.filter((question) => question.audienceType === audienceType).map((question) => question.order),
        ) + 1;
      return [...previous, { ...createEmptyQuestion(nextOrder), audienceType }];
    });
  }

  function removeQuestion(clientId: string) {
    setQuestions((previous) => previous.filter((question) => question.clientId !== clientId));
  }

  function addOption(questionId: string) {
    updateQuestion(questionId, (question) => ({ ...question, options: [...question.options, createEmptyOption()] }));
  }

  function removeOption(questionId: string, optionId: string) {
    updateQuestion(questionId, (question) => ({
      ...question,
      options: question.options.filter((option) => option.clientId !== optionId),
    }));
  }

  function updateOption(questionId: string, optionId: string, field: "label" | "score", value: string) {
    updateQuestion(questionId, (question) => ({
      ...question,
      options: question.options.map((option) =>
        option.clientId === optionId ? { ...option, [field]: value } : option,
      ),
    }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setIsError(false);

    const payloadQuestions = questions.map((question) => ({
      id: question.id,
      staffRole: question.staffRole,
      audienceType: question.audienceType,
      text: question.text.trim(),
      type: question.type,
      isRequired: question.isRequired,
      order: Number(question.order),
      options: question.type === "MULTIPLE_CHOICE"
        ? question.options.map((option) => ({ label: option.label.trim(), score: parseScore(option.score) }))
        : [],
    }));

    try {
      const response = await fetch("/api/admin/scorecard-config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions: payloadQuestions }),
      });

      const data = (await response.json()) as {
        error?: string;
        questions?: Array<{
          id: string;
          staffRole?: string;
          audienceType: AudienceType;
          text: string;
          type: QuestionType;
          isRequired: boolean;
          order: number;
          options: Array<{ label: string; score: number }>;
        }>;
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Could not save scorecard configuration.");
      }

      setQuestions((data.questions ?? []).map(toQuestionState));
      setMessage("Scorecard questions updated.");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Could not save scorecard configuration.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Scorecard Builder</h1>
          <p className="mt-1 text-sm text-slate-600">
            Add, remove, and tune the evaluation questions that appear in the evaluation form.
          </p>
        </div>

        {message ? (
          <div className={`rounded-md px-3 py-2 text-sm ${isError ? "border border-rose-300 bg-rose-50 text-rose-800" : "border border-emerald-300 bg-emerald-50 text-emerald-800"}`}>
            {message}
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>How It Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-slate-700">
            <p>Default scored answers follow the Head Instructor scale: Strongly Disagree, Disagree, Partially Agree, Agree, Strongly Agree.</p>
            <p>Default score mapping is 0, 25, 50, 75, 100, which corresponds to the 1-5 scale normalized to 0-100.</p>
            <p>Text questions are used for qualitative feedback only.</p>
          </CardContent>
        </Card>

        <form onSubmit={handleSubmit} className="space-y-6">
          {isLoading ? (
            <Card>
              <CardContent className="py-8">
                <p className="text-center text-sm text-slate-600">Loading scorecard questions...</p>
              </CardContent>
            </Card>
          ) : (
            (Object.keys(groupedQuestions) as AudienceType[]).map((audienceType) => (
              <Card key={audienceType}>
                <CardHeader>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle>{audienceLabels[audienceType]}</CardTitle>
                    <Button type="button" variant="outline" onClick={() => addQuestion(audienceType)}>
                      Add Question
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {groupedQuestions[audienceType].length === 0 ? (
                    <p className="text-sm text-slate-600">No questions configured for this audience yet.</p>
                  ) : null}

                  {groupedQuestions[audienceType].map((question) => (
                    <div key={question.clientId} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                      <div className="grid gap-3 lg:grid-cols-[1.2fr_220px_140px_120px] lg:items-start">
                        <div className="space-y-2">
                          <Label htmlFor={`text-${question.clientId}`}>Question text</Label>
                          <Input
                            id={`text-${question.clientId}`}
                            value={question.text}
                            onChange={(event) => updateQuestion(question.clientId, (current) => ({ ...current, text: event.target.value }))}
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`type-${question.clientId}`}>Type</Label>
                          <select
                            id={`type-${question.clientId}`}
                            value={question.type}
                            onChange={(event) =>
                              updateQuestion(question.clientId, (current) => ({
                                ...current,
                                type: event.target.value as QuestionType,
                              }))
                            }
                            className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900"
                          >
                            <option value="MULTIPLE_CHOICE">Scored Answers</option>
                            <option value="TEXT">Text</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`order-${question.clientId}`}>Order</Label>
                          <Input
                            id={`order-${question.clientId}`}
                            type="number"
                            min={1}
                            value={question.order}
                            onChange={(event) =>
                              updateQuestion(question.clientId, (current) => ({
                                ...current,
                                order: Number.parseInt(event.target.value, 10) || 1,
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap items-center gap-4">
                        <label className="flex items-center gap-2 text-sm text-slate-700">
                          <input
                            type="checkbox"
                            checked={question.isRequired}
                            onChange={(event) =>
                              updateQuestion(question.clientId, (current) => ({
                                ...current,
                                isRequired: event.target.checked,
                              }))
                            }
                          />
                          Required
                        </label>

                        <Button type="button" variant="outline" onClick={() => removeQuestion(question.clientId)}>
                          Remove Question
                        </Button>
                      </div>

                      {question.type !== "TEXT" ? (
                        <div className="mt-4 space-y-3 rounded-lg border border-dashed border-slate-300 bg-white p-4">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-sm font-semibold text-slate-900">Answers and scores</p>
                            <Button type="button" variant="outline" onClick={() => addOption(question.clientId)}>
                              Add Answer
                            </Button>
                          </div>

                          {question.options.length === 0 ? (
                            <p className="text-sm text-slate-600">No answers yet. Add at least two.</p>
                          ) : null}

                          <div className="space-y-3">
                            {question.options.map((option) => (
                              <div key={option.clientId} className="grid gap-3 md:grid-cols-[1fr_120px_120px] md:items-center">
                                <Input
                                  value={option.label}
                                  onChange={(event) => updateOption(question.clientId, option.clientId, "label", event.target.value)}
                                  placeholder="Answer label"
                                />
                                <Input
                                  type="number"
                                  step="0.01"
                                  value={option.score}
                                  onChange={(event) => updateOption(question.clientId, option.clientId, "score", event.target.value)}
                                  placeholder="Score"
                                />
                                <Button type="button" variant="outline" onClick={() => removeOption(question.clientId, option.clientId)}>
                                  Remove
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))
          )}

          {!isLoading ? (
            <div className="flex items-center justify-end">
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Scorecard Questions"}
              </Button>
            </div>
          ) : null}
        </form>
      </div>
    </main>
  );
}