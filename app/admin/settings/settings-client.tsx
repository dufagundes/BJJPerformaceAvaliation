"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";

type AdminConfig = {
  id: string;
  defaultCycleDurationDays: number;
  defaultContactsToInvite: number;
  reminderScheduleDaysBefore: number[];
};

type ScorecardFactorWeight = {
  id: string;
  questionText: string;
  order: number;
  weight: number;
};

type ScorecardSessionWeight = {
  id: string;
  name: string;
  audienceType: "PEER" | "PARENT_STUDENT";
  weight: number;
  factors: ScorecardFactorWeight[];
};

type ScorecardGroupWeight = {
  id: string;
  name: "PEER" | "PARENT_STUDENT";
  weight: number;
};

type ScorecardWeights = {
  groups: ScorecardGroupWeight[];
  sessions: ScorecardSessionWeight[];
};

const WEIGHT_DECIMAL_SCALE = 6;
const WEIGHT_SUM_EPSILON = 0.00001;

const adminTools = [
  {
    title: "Contacts",
    description: "Manage parent and student contacts used for evaluation invitations.",
    href: "/admin/contacts",
  },
  {
    title: "Platform: Schools & Admins",
    description: "Create schools and administrator logins.",
    href: "/admin/schools",
  },
  {
    title: "School Scorecard Builder",
    description: "Edit this school's evaluation questions, audiences, options, and scorecard setup.",
    href: "/admin/scorecard",
  },
  {
    title: "App Settings",
    description: "Configure evaluation defaults, reminders, and score weights.",
    href: "/admin/settings",
  },
  {
    title: "Test Email",
    description: "Send a test message to confirm outbound email delivery.",
    href: "/admin/test-email",
  },
];

function normalizeWeight(value: number): number {
  return Number.parseFloat(Number(value).toFixed(WEIGHT_DECIMAL_SCALE));
}

function parseInputWeight(value: string): number {
  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }
  return normalizeWeight(parsed);
}

function isExactOne(value: number): boolean {
  return Math.abs(normalizeWeight(value) - 1) <= WEIGHT_SUM_EPSILON;
}

function formatWeight(value: number): string {
  return normalizeWeight(value).toFixed(4);
}

function getGroupLabel(name: "PEER" | "PARENT_STUDENT"): string {
  return name === "PEER" ? "Peers" : "Parents/Students";
}

export default function SettingsClient() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [weightError, setWeightError] = useState<string>("");

  const [defaultCycleDurationDays, setDefaultCycleDurationDays] = useState(15);
  const [defaultContactsToInvite, setDefaultContactsToInvite] = useState(5);
  const [reminderScheduleText, setReminderScheduleText] = useState("3,1");
  const [scorecardWeights, setScorecardWeights] = useState<ScorecardWeights | null>(null);

  useEffect(() => {
    async function loadConfig() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/admin/settings", { cache: "no-store" });
        const data = (await response.json()) as {
          config?: AdminConfig;
          scorecardWeights?: ScorecardWeights | null;
          scorecardWeightsError?: string;
          error?: string;
        };
        if (!response.ok) {
          throw new Error(data.error ?? "Could not load settings.");
        }

        const config = data.config;
        if (config) {
          setDefaultCycleDurationDays(config.defaultCycleDurationDays);
          setDefaultContactsToInvite(config.defaultContactsToInvite);
          setReminderScheduleText(config.reminderScheduleDaysBefore.join(", "));
        }

        if (data.scorecardWeights) {
          setScorecardWeights(data.scorecardWeights);
        } else if (data.scorecardWeightsError) {
          setWeightError(data.scorecardWeightsError);
        }
      } catch (error) {
        setIsError(true);
        setMessage(error instanceof Error ? error.message : "Could not load settings.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadConfig();
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setIsError(false);

    const reminderScheduleDaysBefore = reminderScheduleText
      .split(",")
      .map((part) => Number(part.trim()))
      .filter((value) => Number.isInteger(value) && value >= 0);

    if (!scorecardWeights) {
      setIsError(true);
      setIsSaving(false);
      setMessage("Scorecard weights are unavailable. Run migrations and reload settings.");
      return;
    }

    const groupTotal = normalizeWeight(scorecardWeights.groups.reduce((sum, group) => sum + group.weight, 0));
    const sessionTotals = new Map<string, number>();
    const factorTotals = new Map<string, number>();

    for (const session of scorecardWeights.sessions) {
      const sessionKey = session.audienceType;
      sessionTotals.set(sessionKey, normalizeWeight((sessionTotals.get(sessionKey) ?? 0) + session.weight));
      factorTotals.set(
        session.id,
        normalizeWeight(session.factors.reduce((sum, factor) => sum + factor.weight, 0)),
      );
    }

    const hasInvalidTotals =
      !isExactOne(groupTotal) ||
      Array.from(sessionTotals.values()).some((value) => !isExactOne(value)) ||
      Array.from(factorTotals.values()).some((value) => !isExactOne(value));

    if (hasInvalidTotals) {
      setIsError(true);
      setIsSaving(false);
      setMessage("Cannot save until all scorecard weight totals equal exactly 1.00.");
      return;
    }

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          defaultCycleDurationDays,
          defaultContactsToInvite,
          reminderScheduleDaysBefore,
          scorecardWeights: {
            groups: scorecardWeights.groups.map((group) => ({
              id: group.id,
              name: group.name,
              weight: normalizeWeight(group.weight),
            })),
            sessions: scorecardWeights.sessions.map((session) => ({
              id: session.id,
              name: session.name,
              audienceType: session.audienceType,
              weight: normalizeWeight(session.weight),
              factors: session.factors.map((factor) => ({
                id: factor.id,
                weight: normalizeWeight(factor.weight),
              })),
            })),
          },
        }),
      });

      const data = (await response.json()) as { error?: string; scorecardWeights?: ScorecardWeights };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not save settings.");
      }

      if (data.scorecardWeights) {
        setScorecardWeights(data.scorecardWeights);
      }

      setMessage("Evaluation defaults updated.");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Could not save settings.");
    } finally {
      setIsSaving(false);
    }
  }

  const groupWeightTotal = scorecardWeights
    ? normalizeWeight(scorecardWeights.groups.reduce((sum, group) => sum + group.weight, 0))
    : 0;

  const hasZeroWeight =
    !!scorecardWeights &&
    (scorecardWeights.groups.some((group) => group.weight === 0) ||
      scorecardWeights.sessions.some(
        (session) =>
          session.weight === 0 || session.factors.some((factor) => factor.weight === 0),
      ));

  function updateGroupWeight(groupId: string, value: string) {
    const nextWeight = parseInputWeight(value);
    setScorecardWeights((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        groups: prev.groups.map((group) =>
          group.id === groupId ? { ...group, weight: nextWeight } : group,
        ),
      };
    });
  }

  function updateSessionWeight(sessionId: string, value: string) {
    const nextWeight = parseInputWeight(value);
    setScorecardWeights((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        sessions: prev.sessions.map((session) =>
          session.id === sessionId ? { ...session, weight: nextWeight } : session,
        ),
      };
    });
  }

  function updateFactorWeight(sessionId: string, factorId: string, value: string) {
    const nextWeight = parseInputWeight(value);
    setScorecardWeights((prev) => {
      if (!prev) {
        return prev;
      }

      return {
        ...prev,
        sessions: prev.sessions.map((session) => {
          if (session.id !== sessionId) {
            return session;
          }

          return {
            ...session,
            factors: session.factors.map((factor) =>
              factor.id === factorId ? { ...factor, weight: nextWeight } : factor,
            ),
          };
        }),
      };
    });
  }

  const canSaveScorecards = scorecardWeights
    ? isExactOne(groupWeightTotal) &&
      ["PEER", "PARENT_STUDENT"].every((groupName) => {
        const sessions = scorecardWeights.sessions.filter((session) => session.audienceType === groupName);
        const sessionTotal = normalizeWeight(sessions.reduce((sum, session) => sum + session.weight, 0));
        const factorsValid = sessions.every((session) => {
          const factorTotal = normalizeWeight(
            session.factors.reduce((sum, factor) => sum + factor.weight, 0),
          );
          return isExactOne(factorTotal);
        });

        return isExactOne(sessionTotal) && factorsValid;
      })
    : false;

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Admin Settings</h1>
          <p className="mt-1 text-sm text-slate-600">Configure default values for future evaluation cycles.</p>
        </div>

        <section className="grid gap-3 sm:grid-cols-2">
          {adminTools.map((tool) => (
            <Link
              key={tool.href}
              href={tool.href}
              className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md focus:outline-none focus:ring-4 focus:ring-indigo-100"
              aria-current={tool.href === "/admin/settings" ? "page" : undefined}
            >
              <span className="text-sm font-semibold text-slate-950">{tool.title}</span>
              <span className="mt-1 block text-sm leading-5 text-slate-600">{tool.description}</span>
            </Link>
          ))}
        </section>

        {message ? (
          <div className={`rounded-md px-3 py-2 text-sm ${isError ? "border border-rose-300 bg-rose-50 text-rose-800" : "border border-emerald-300 bg-emerald-50 text-emerald-800"}`}>
            {message}
          </div>
        ) : null}

        {hasZeroWeight ? (
          <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">
            A weight of 0 means this factor will not affect the score.
          </div>
        ) : null}

        {weightError ? (
          <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
            {weightError}
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Evaluation Defaults</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-slate-600">Loading defaults...</p>
            ) : (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <div className="space-y-2">
                  <Label htmlFor="duration-days">Default cycle duration (days)</Label>
                  <Input
                    id="duration-days"
                    type="number"
                    min={1}
                    value={defaultCycleDurationDays}
                    onChange={(event) => setDefaultCycleDurationDays(Number(event.target.value))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contacts-count">Default number of contacts to randomly invite</Label>
                  <Input
                    id="contacts-count"
                    type="number"
                    min={1}
                    value={defaultContactsToInvite}
                    onChange={(event) => setDefaultContactsToInvite(Number(event.target.value))}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reminder-days">Reminder schedule (days before deadline)</Label>
                  <Input
                    id="reminder-days"
                    value={reminderScheduleText}
                    onChange={(event) => setReminderScheduleText(event.target.value)}
                    placeholder="3,1"
                    required
                  />
                  <p className="text-xs text-slate-500">Comma-separated integers. Example: 3,1</p>
                </div>

                <Button type="submit" disabled={isSaving || !canSaveScorecards}>
                  {isSaving ? "Saving..." : "Save Defaults"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        {!isLoading && scorecardWeights ? (
          <Card>
            <CardHeader>
              <CardTitle>Scorecard Weights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-900">Group weights</h3>
                {scorecardWeights.groups.map((group) => (
                  <div key={group.id} className="grid grid-cols-[1fr_120px] items-center gap-3">
                    <Label htmlFor={`group-${group.id}`}>{getGroupLabel(group.name)}</Label>
                    <Input
                      id={`group-${group.id}`}
                      type="number"
                      step="0.000001"
                      min={0}
                      max={1}
                      value={group.weight}
                      onChange={(event) => updateGroupWeight(group.id, event.target.value)}
                    />
                  </div>
                ))}
                <p className={`text-xs ${isExactOne(groupWeightTotal) ? "text-slate-500" : "text-rose-700"}`}>
                  Total: {formatWeight(groupWeightTotal)}
                </p>
              </section>

              {(["PEER", "PARENT_STUDENT"] as const).map((groupName) => {
                const sessions = scorecardWeights.sessions.filter((session) => session.audienceType === groupName);
                const sessionTotal = normalizeWeight(sessions.reduce((sum, session) => sum + session.weight, 0));

                return (
                  <section key={groupName} className="space-y-4 rounded-md border border-slate-200 p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-900">{getGroupLabel(groupName)} session weights</h3>
                      <p className={`text-xs ${isExactOne(sessionTotal) ? "text-slate-500" : "text-rose-700"}`}>
                        Total: {formatWeight(sessionTotal)}
                      </p>
                    </div>

                    {sessions.map((session) => {
                      const factorTotal = normalizeWeight(session.factors.reduce((sum, factor) => sum + factor.weight, 0));
                      return (
                        <div key={session.id} className="space-y-3 rounded-md border border-slate-200 p-3">
                          <div className="grid grid-cols-[1fr_120px] items-center gap-3">
                            <Label htmlFor={`session-${session.id}`}>{session.name}</Label>
                            <Input
                              id={`session-${session.id}`}
                              type="number"
                              step="0.000001"
                              min={0}
                              max={1}
                              value={session.weight}
                              onChange={(event) => updateSessionWeight(session.id, event.target.value)}
                            />
                          </div>

                          <div className="space-y-2 pl-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Factor weights</p>
                            {session.factors.map((factor) => (
                              <div key={factor.id} className="grid grid-cols-[1fr_120px] items-center gap-3">
                                <Label htmlFor={`factor-${factor.id}`} className="text-xs text-slate-700">
                                  {factor.questionText}
                                </Label>
                                <Input
                                  id={`factor-${factor.id}`}
                                  type="number"
                                  step="0.000001"
                                  min={0}
                                  max={1}
                                  value={factor.weight}
                                  onChange={(event) => updateFactorWeight(session.id, factor.id, event.target.value)}
                                />
                              </div>
                            ))}
                            <p className={`text-xs ${isExactOne(factorTotal) ? "text-slate-500" : "text-rose-700"}`}>
                              Factor total: {formatWeight(factorTotal)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </section>
                );
              })}
            </CardContent>
          </Card>
        ) : null}
      </div>
    </main>
  );
}
