"use client";

import { useState, useEffect, FormEvent } from "react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";

type SmsTemplate = {
  invite: string;
  reminder: string;
  completion: string;
};

type CharacterCount = {
  segments: number;
  characters: number;
};

export default function SmsTemplatesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const [templates, setTemplates] = useState<SmsTemplate | null>(null);
  const [defaults, setDefaults] = useState<SmsTemplate | null>(null);
  const [characterCounts, setCharacterCounts] = useState<Record<string, CharacterCount>>({});

  useEffect(() => {
    async function loadTemplates() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/admin/settings/sms-templates");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Could not load templates");
        }

        setTemplates(data.templates || {});
        setDefaults(data.defaults || {});
        setCharacterCounts(data.characterCounts || {});
      } catch (error) {
        setIsError(true);
        setMessage(error instanceof Error ? error.message : "Failed to load templates");
      } finally {
        setIsLoading(false);
      }
    }

    loadTemplates();
  }, []);

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setIsError(false);

    try {
      const formData = new FormData(event.currentTarget);
      const updatedTemplates = {
        invite: formData.get("invite") as string,
        reminder: formData.get("reminder") as string,
        completion: formData.get("completion") as string,
      };

      const response = await fetch("/api/admin/settings/sms-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templates: updatedTemplates }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save templates");
      }

      setTemplates(data.templates);
      setMessage("✓ SMS templates saved successfully");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Failed to save templates");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <main className="px-4 py-8">
        <div className="mx-auto max-w-4xl">
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-slate-600">Loading templates...</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  const displayTemplates = templates || defaults || { invite: "", reminder: "", completion: "" };

  return (
    <main className="space-y-6 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500 mb-4">
          <ol className="flex items-center gap-2">
            <li><a href="/admin/settings" className="hover:text-blue-700">Admin Settings</a></li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-slate-900">SMS Templates</li>
          </ol>
        </nav>

        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-slate-900">SMS Templates</h1>
          <p className="mt-2 text-slate-600">Customize SMS messages sent to reviewers. Always include {`{link}`} so recipients can access the evaluation.</p>
        </div>

        {message && (
          <div className={`rounded-md border px-4 py-3 mb-4 text-sm ${isError ? "border-rose-300 bg-rose-50 text-rose-800" : "border-emerald-300 bg-emerald-50 text-emerald-800"}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleUpdate} className="space-y-6">
          {/* Invitation Template */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invitation SMS</CardTitle>
              <p className="text-sm text-slate-600 mt-2">Sent when first inviting reviewers to complete an evaluation</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="invite">Message Template</Label>
                <Textarea
                  id="invite"
                  name="invite"
                  defaultValue={displayTemplates.invite}
                  className="min-h-24"
                  required
                />
                <p className="text-xs text-slate-500 mt-2">
                  Available placeholders: {"{name}, {days}, {link}"}
                </p>
              </div>
              {characterCounts.invite && (
                <div className="text-sm text-slate-600">
                  <p>{characterCounts.invite.characters} characters = {characterCounts.invite.segments} SMS segment{characterCounts.invite.segments !== 1 ? "s" : ""}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Reminder Template */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Reminder SMS</CardTitle>
              <p className="text-sm text-slate-600 mt-2">Sent to reviewers who haven't responded yet</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="reminder">Message Template</Label>
                <Textarea
                  id="reminder"
                  name="reminder"
                  defaultValue={displayTemplates.reminder}
                  className="min-h-24"
                  required
                />
                <p className="text-xs text-slate-500 mt-2">
                  Available placeholders: {"{name}, {days}, {link}"}
                </p>
              </div>
              {characterCounts.reminder && (
                <div className="text-sm text-slate-600">
                  <p>{characterCounts.reminder.characters} characters = {characterCounts.reminder.segments} SMS segment{characterCounts.reminder.segments !== 1 ? "s" : ""}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Completion Template */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Completion SMS</CardTitle>
              <p className="text-sm text-slate-600 mt-2">Sent after evaluator submits the form (optional)</p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="completion">Message Template</Label>
                <Textarea
                  id="completion"
                  name="completion"
                  defaultValue={displayTemplates.completion}
                  className="min-h-24"
                  required
                />
                <p className="text-xs text-slate-500 mt-2">
                  Available placeholders: {"{name}"}
                </p>
              </div>
              {characterCounts.completion && (
                <div className="text-sm text-slate-600">
                  <p>{characterCounts.completion.characters} characters = {characterCounts.completion.segments} SMS segment{characterCounts.completion.segments !== 1 ? "s" : ""}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save SMS Templates"}
            </Button>
          </div>
        </form>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">SMS Format Tips</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-semibold text-slate-900">Character Limits</p>
              <p className="text-slate-600">SMS messages are limited to 160 characters per segment. Longer messages split into multiple segments (costs more).</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Keep It Short</p>
              <p className="text-slate-600">Mobile users prefer concise messages. Include the {`{link}`} placeholder so they can click to respond.</p>
            </div>
            <div>
              <p className="font-semibold text-slate-900">Required: Magic Link</p>
              <p className="text-slate-600">Always include {`{link}`} in your SMS templates. This is the evaluation link recipients need to respond.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
