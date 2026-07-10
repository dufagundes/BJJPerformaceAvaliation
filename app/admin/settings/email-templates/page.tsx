"use client";

import { useState, useEffect, FormEvent } from "react";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";

type EmailTemplate = {
  templateType: "invitation" | "reminder" | "self_evaluation";
  subject: string;
  htmlContent: string;
  textContent: string;
};

export default function EmailTemplatesPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [defaults, setDefaults] = useState<Record<string, EmailTemplate>>({});
  const [activeTab, setActiveTab] = useState<"invitation" | "reminder" | "self_evaluation">("invitation");

  useEffect(() => {
    async function loadTemplates() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/admin/settings/email-templates");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error ?? "Could not load templates");
        }

        setTemplates(data.templates || []);
        setDefaults(data.defaults || {});
      } catch (error) {
        setIsError(true);
        setMessage(error instanceof Error ? error.message : "Failed to load templates");
      } finally {
        setIsLoading(false);
      }
    }

    loadTemplates();
  }, []);

  const currentTemplate = templates.find((t) => t.templateType === activeTab) || defaults[activeTab];

  const handleUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setIsError(false);

    try {
      const formData = new FormData(event.currentTarget);
      const updatedTemplate: EmailTemplate = {
        templateType: activeTab,
        subject: formData.get("subject") as string,
        htmlContent: formData.get("htmlContent") as string,
        textContent: formData.get("textContent") as string,
      };

      const response = await fetch("/api/admin/settings/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templates: [updatedTemplate] }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error ?? "Failed to save template");
      }

      setTemplates((prev) => {
        const filtered = prev.filter((t) => t.templateType !== activeTab);
        return [...filtered, data.templates[0]];
      });

      setMessage("✓ Template saved successfully");
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Failed to save template");
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

  const labels: Record<string, { title: string; description: string }> = {
    invitation: {
      title: "Invitation Template",
      description: "Sent when first inviting reviewers to complete an evaluation",
    },
    reminder: {
      title: "Reminder Template",
      description: "Sent to reviewers who haven't responded yet",
    },
    self_evaluation: {
      title: "Self Evaluation Template",
      description: "Sent to staff members for their self reflection",
    },
  };

  return (
    <main className="space-y-6 px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <nav aria-label="Breadcrumb" className="text-sm text-slate-500 mb-4">
          <ol className="flex items-center gap-2">
            <li><a href="/admin/settings" className="hover:text-blue-700">Admin Settings</a></li>
            <li aria-hidden="true">/</li>
            <li className="font-medium text-slate-900">Email Templates</li>
          </ol>
        </nav>

        <div className="mb-6">
          <h1 className="text-3xl font-semibold text-slate-900">Email Templates</h1>
          <p className="mt-2 text-slate-600">Customize email messages. Always include the magic link {`{magicLink}`} so recipients can access the evaluation.</p>
        </div>

        {message && (
          <div className={`rounded-md border px-4 py-3 mb-4 text-sm ${isError ? "border-rose-300 bg-rose-50 text-rose-800" : "border-emerald-300 bg-emerald-50 text-emerald-800"}`}>
            {message}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Email Template Editor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Tabs */}
              <div className="flex gap-2 border-b border-slate-200">
                {(["invitation", "reminder", "self_evaluation"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setActiveTab(type)}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition ${
                      activeTab === type
                        ? "border-blue-600 text-blue-600"
                        : "border-transparent text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    {labels[type].title}
                  </button>
                ))}
              </div>

              {currentTemplate && (
                <form onSubmit={handleUpdate} className="space-y-4">
                  <div>
                    <p className="text-sm text-slate-600 mb-4">{labels[activeTab].description}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Email Subject</Label>
                    <input
                      id="subject"
                      name="subject"
                      type="text"
                      defaultValue={currentTemplate.subject}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm font-mono"
                      required
                    />
                    <p className="text-xs text-slate-500">Available placeholders: {"{reviewerName}, {subjectName}, {staffName}, {cycleName}, {schoolName}, {deadline}, {daysRemaining}, {magicLink}"}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="htmlContent">HTML Template</Label>
                      <Textarea
                        id="htmlContent"
                        name="htmlContent"
                        defaultValue={currentTemplate.htmlContent}
                        className="min-h-96 font-mono text-sm"
                        required
                      />
                      <p className="text-xs text-slate-500">Professional HTML formatting for email clients</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="textContent">Plain Text Template</Label>
                      <Textarea
                        id="textContent"
                        name="textContent"
                        defaultValue={currentTemplate.textContent}
                        className="min-h-96 font-mono text-sm"
                        required
                      />
                      <p className="text-xs text-slate-500">Fallback text version for plain text clients</p>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" disabled={isSaving}>
                      {isSaving ? "Saving..." : "Save Template"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Available Placeholders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <p className="font-semibold text-slate-900 mb-2">Reviewer Invitations</p>
                <ul className="space-y-1 text-slate-600 font-mono">
                  <li>{"{reviewerName}"} - Reviewer's name</li>
                  <li>{"{subjectName}"} - Staff member being evaluated</li>
                  <li>{"{schoolName}"} - School name</li>
                  <li>{"{deadline}"} - Evaluation deadline</li>
                  <li>{"{magicLink}"} - Evaluation link (required)</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-900 mb-2">Reminder Emails</p>
                <ul className="space-y-1 text-slate-600 font-mono">
                  <li>{"{reviewerName}"} - Reviewer's name</li>
                  <li>{"{subjectName}"} - Staff member being evaluated</li>
                  <li>{"{schoolName}"} - School name</li>
                  <li>{"{daysRemaining}"} - Days until deadline</li>
                  <li>{"{magicLink}"} - Evaluation link (required)</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-slate-900 mb-2">Self Evaluations</p>
                <ul className="space-y-1 text-slate-600 font-mono">
                  <li>{"{staffName}"} - Staff member name</li>
                  <li>{"{cycleName}"} - Evaluation cycle name</li>
                  <li>{"{schoolName}"} - School name</li>
                  <li>{"{deadline}"} - Deadline date</li>
                  <li>{"{magicLink}"} - Self-eval link (required)</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
