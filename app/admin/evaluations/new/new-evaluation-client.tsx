"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { Textarea } from "../../../../components/ui/textarea";

type StaffOption = {
  id: string;
  name: string;
  email: string;
  staffProfile: {
    title: string;
  } | null;
};

type ContactOption = {
  id: string;
  name: string;
  email: string;
  type: "STUDENT" | "PARENT";
  studentName: string | null;
  isActive: boolean;
};

type AdminConfig = {
  defaultCycleDurationDays: number;
  defaultContactsToInvite: number;
  reminderScheduleDaysBefore: number[];
};

function formatDate(value: Date): string {
  return value.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

async function readJsonResponse<T>(response: Response): Promise<T & { error?: string }> {
  const text = await response.text();
  if (!text.trim()) {
    return { error: response.ok ? undefined : `Request failed with status ${response.status}.` } as T & { error?: string };
  }

  try {
    return JSON.parse(text) as T & { error?: string };
  } catch {
    return { error: response.ok ? "The server returned an unreadable response." : `Request failed with status ${response.status}.` } as T & { error?: string };
  }
}

export default function NewEvaluationClient() {
  const router = useRouter();

  const [isLoading, setIsLoading] = useState(true);
  const [isLaunching, setIsLaunching] = useState(false);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const [config, setConfig] = useState<AdminConfig | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffOption[]>([]);
  const [activeContactsCount, setActiveContactsCount] = useState(0);

  const [description, setDescription] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [cycleDurationDays, setCycleDurationDays] = useState(15);

  const [peerSearch, setPeerSearch] = useState("");
  const [selectedPeerIds, setSelectedPeerIds] = useState<string[]>([]);

  const [contactInviteCount, setContactInviteCount] = useState(5);
  const [selectedContacts, setSelectedContacts] = useState<ContactOption[]>([]);
  const [contactsWarning, setContactsWarning] = useState<string | null>(null);
  const [isSelectingContacts, setIsSelectingContacts] = useState(false);

  useEffect(() => {
    async function loadOptions() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/admin/evaluations/options", { cache: "no-store" });
        const data = await readJsonResponse<{
          config?: AdminConfig;
          staffMembers?: StaffOption[];
          activeContactsCount?: number;
        }>(response);

        if (!response.ok) {
          throw new Error(data.error ?? "Could not load evaluation options.");
        }

        const resolvedConfig = data.config;
        const resolvedStaffMembers = data.staffMembers ?? [];

        setConfig(resolvedConfig ?? null);
        setStaffMembers(resolvedStaffMembers);
        setActiveContactsCount(data.activeContactsCount ?? 0);

        if (resolvedConfig) {
          setCycleDurationDays(resolvedConfig.defaultCycleDurationDays);
          setContactInviteCount(resolvedConfig.defaultContactsToInvite);
        }
      } catch (error) {
        setIsError(true);
        setMessage(error instanceof Error ? error.message : "Could not load evaluation options.");
      } finally {
        setIsLoading(false);
      }
    }

    void loadOptions();
  }, []);

  const subject = useMemo(
    () => staffMembers.find((member) => member.id === subjectId) ?? null,
    [staffMembers, subjectId],
  );

  const availablePeerOptions = useMemo(() => {
    const query = peerSearch.trim().toLowerCase();
    return staffMembers
      .filter((member) => member.id !== subjectId)
      .filter((member) => {
        if (!query) {
          return true;
        }

        return (
          member.name.toLowerCase().includes(query) ||
          member.email.toLowerCase().includes(query) ||
          (member.staffProfile?.title ?? "").toLowerCase().includes(query)
        );
      });
  }, [staffMembers, peerSearch, subjectId]);

  const selectedPeers = useMemo(
    () => staffMembers.filter((member) => selectedPeerIds.includes(member.id)),
    [staffMembers, selectedPeerIds],
  );

  const deadlineDate = useMemo(() => {
    const now = new Date();
    const value = new Date(now.getTime() + cycleDurationDays * 24 * 60 * 60 * 1000);
    return value;
  }, [cycleDurationDays]);

  function togglePeer(peerId: string) {
    setSelectedPeerIds((prev) => {
      if (prev.includes(peerId)) {
        return prev.filter((id) => id !== peerId);
      }
      return [...prev, peerId];
    });
  }

  async function autoSelectContacts() {
    setIsSelectingContacts(true);
    setContactsWarning(null);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("/api/admin/evaluations/random-contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          count: contactInviteCount,
        }),
      });

      const data = await readJsonResponse<{
        selected?: ContactOption[];
        warning?: string | null;
      }>(response);

      if (!response.ok) {
        throw new Error(data.error ?? "Could not select contacts.");
      }

      setSelectedContacts(data.selected ?? []);
      setContactsWarning(data.warning ?? null);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Could not select contacts.");
    } finally {
      setIsSelectingContacts(false);
    }
  }

  async function launchEvaluation() {
    setIsLaunching(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("/api/admin/evaluations/start", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          description,
          subjectId,
          cycleDurationDays,
          peerUserIds: selectedPeerIds,
          contactIds: selectedContacts.map((contact) => contact.id),
        }),
      });

      const data = await readJsonResponse<{
        cycle?: { id: string };
        deliverySummary?: {
          sent: number;
          failed: number;
          total: number;
          errors?: string[];
        };
      }>(response);
      if (!response.ok || !data.cycle?.id) {
        throw new Error(data.error ?? "Could not launch evaluation.");
      }

      const deliverySummary = data.deliverySummary;
      const query = new URLSearchParams();
      if (deliverySummary) {
        query.set("sent", String(deliverySummary.sent));
        query.set("failed", String(deliverySummary.failed));
        query.set("total", String(deliverySummary.total));
        if (deliverySummary.errors?.[0]) {
          query.set("error", deliverySummary.errors[0]);
        }
      }

      const queryString = query.size > 0 ? `?${query.toString()}` : "";

      router.push(`/admin/evaluations/${data.cycle.id}${queryString}`);
      router.refresh();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Could not launch evaluation.");
    } finally {
      setIsLaunching(false);
    }
  }

  const canLaunch =
    !!description.trim() &&
    !!subjectId &&
    Number.isInteger(cycleDurationDays) &&
    cycleDurationDays > 0 &&
    selectedPeerIds.length >= 1 &&
    selectedContacts.length > 0;

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Start New Evaluation Cycle</h1>
          <p className="mt-1 text-sm text-slate-600">Configure reviewers, randomize contacts, and launch invitation emails.</p>
        </div>

        {message ? (
          <div className={`rounded-md px-3 py-2 text-sm ${isError ? "border border-rose-300 bg-rose-50 text-rose-800" : "border border-emerald-300 bg-emerald-50 text-emerald-800"}`}>
            {message}
          </div>
        ) : null}

        {isLoading ? (
          <Card>
            <CardContent className="py-8">
              <p className="text-sm text-slate-600">Loading form options...</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Section 1 - Cycle Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cycle-description">Cycle Description</Label>
                    <Textarea
                      id="cycle-description"
                      value={description}
                      onChange={(event) => setDescription(event.target.value)}
                      placeholder="Describe this evaluation cycle and what reviewers should focus on."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject-id">Staff Member</Label>
                    <select
                      id="subject-id"
                      value={subjectId}
                      onChange={(event) => {
                        const nextSubjectId = event.target.value;
                        setSubjectId(nextSubjectId);
                        setSelectedPeerIds((prev) => prev.filter((id) => id !== nextSubjectId));
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    >
                      <option value="">Select staff member</option>
                      {staffMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.staffProfile?.title ?? "Staff"})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="cycle-duration">Cycle Duration (days)</Label>
                    <Input
                      id="cycle-duration"
                      type="number"
                      min={1}
                      value={cycleDurationDays}
                      onChange={(event) => setCycleDurationDays(Number(event.target.value))}
                    />
                    <p className="text-sm text-slate-600">Closes on {formatDate(deadlineDate)}</p>
                  </div>

                  {config ? (
                    <p className="text-xs text-slate-500">
                      Defaults: {config.defaultCycleDurationDays} day duration, {config.defaultContactsToInvite} random contacts, reminders {config.reminderScheduleDaysBefore.join(", ")} days before deadline.
                    </p>
                  ) : null}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Section 2 - Peer Evaluators</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="peer-search">Search staff</Label>
                    <Input
                      id="peer-search"
                      value={peerSearch}
                      onChange={(event) => setPeerSearch(event.target.value)}
                      placeholder="Search by name, email, or title"
                    />
                  </div>

                  <div className="max-h-56 overflow-auto rounded-md border border-slate-200 p-2">
                    {subjectId ? (
                      availablePeerOptions.length === 0 ? (
                        <p className="px-2 py-2 text-sm text-slate-600">No matching staff found.</p>
                      ) : (
                        <div className="space-y-2">
                          {availablePeerOptions.map((member) => (
                            <label key={member.id} className="flex items-start gap-2 rounded-md px-2 py-2 text-sm hover:bg-slate-50">
                              <input
                                type="checkbox"
                                checked={selectedPeerIds.includes(member.id)}
                                onChange={() => togglePeer(member.id)}
                              />
                              <span>
                                <span className="block font-medium text-slate-900">{member.name}</span>
                                <span className="block text-xs text-slate-500">{member.email} - {member.staffProfile?.title ?? "Staff"}</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      )
                    ) : (
                      <p className="px-2 py-2 text-sm text-slate-600">Choose the subject first to enable peer selection.</p>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {selectedPeers.map((peer) => (
                      <button
                        key={peer.id}
                        type="button"
                        className="inline-flex items-center rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700"
                        onClick={() => togglePeer(peer.id)}
                      >
                        {peer.name} x
                      </button>
                    ))}
                  </div>

                  <p className={`text-sm ${selectedPeerIds.length < 1 ? "text-rose-700" : "text-slate-600"}`}>
                    Minimum 1 peer required. Selected: {selectedPeerIds.length}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Section 3 - Parents and Students (Random Selection)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="contact-count">How many to invite?</Label>
                    <Input
                      id="contact-count"
                      type="number"
                      min={1}
                      value={contactInviteCount}
                      onChange={(event) => setContactInviteCount(Number(event.target.value))}
                    />
                    <p className="text-sm text-slate-600">Active contacts available: {activeContactsCount}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={() => void autoSelectContacts()} disabled={isSelectingContacts || contactInviteCount < 1}>
                      {isSelectingContacts ? "Selecting..." : "Auto-select"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void autoSelectContacts()}
                      disabled={isSelectingContacts || selectedContacts.length === 0}
                    >
                      Re-randomize
                    </Button>
                  </div>

                  {contactsWarning ? (
                    <p className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-800">{contactsWarning}</p>
                  ) : null}

                  <div className="rounded-md border border-slate-200">
                    <div className="border-b border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700">Selected contacts ({selectedContacts.length})</div>
                    <div className="max-h-56 overflow-auto p-3">
                      {selectedContacts.length === 0 ? (
                        <p className="text-sm text-slate-600">No contacts selected yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {selectedContacts.map((contact) => (
                            <div key={contact.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2">
                              <div>
                                <p className="text-sm font-medium text-slate-900">{contact.name}</p>
                                <p className="text-xs text-slate-500">{contact.email}{contact.studentName ? ` - Student: ${contact.studentName}` : ""}</p>
                              </div>
                              <span className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${contact.type === "PARENT" ? "border border-sky-200 bg-sky-50 text-sky-700" : "border border-violet-200 bg-violet-50 text-violet-700"}`}>
                                {contact.type === "PARENT" ? "Parent" : "Student"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Section 4 - Review and Launch</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-md border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
                    <p><strong>Description:</strong> {description || "-"}</p>
                    <p><strong>Subject:</strong> {subject?.name || "-"}</p>
                    <p><strong>Deadline:</strong> {formatDate(deadlineDate)}</p>
                    <p><strong>Peer count:</strong> {selectedPeers.length}</p>
                    <p><strong>Contact count:</strong> {selectedContacts.length}</p>

                    <div className="mt-3">
                      <p className="font-semibold text-slate-900">Peers</p>
                      {selectedPeers.length > 0 ? (
                        <p>{selectedPeers.map((peer) => peer.name).join(", ")}</p>
                      ) : (
                        <p>-</p>
                      )}
                    </div>

                    <div className="mt-3">
                      <p className="font-semibold text-slate-900">Randomly Selected Contacts</p>
                      {selectedContacts.length > 0 ? (
                        <p>{selectedContacts.map((contact) => contact.name).join(", ")}</p>
                      ) : (
                        <p>-</p>
                      )}
                    </div>
                  </div>

                  <Button type="button" onClick={() => void launchEvaluation()} disabled={!canLaunch || isLaunching}>
                    {isLaunching ? "Launching..." : "Launch Evaluation"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </main>
  );
}
