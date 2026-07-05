"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";
import { parseContactsCsv, type CsvContactRow, contactsCsvTemplate } from "../../../lib/contactsCsv";

type ContactRow = {
  id: string;
  type: "STUDENT" | "PARENT";
  name: string;
  email: string;
  studentName: string | null;
  isActive: boolean;
};

type ImportResult = {
  importedCount: number;
  skipped: Array<{ email: string; reason: string }>;
};

export default function ContactsClient() {
  const [contacts, setContacts] = useState<ContactRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const [type, setType] = useState<"STUDENT" | "PARENT">("STUDENT");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [studentName, setStudentName] = useState("");
  const [status, setStatus] = useState<"ACTIVE" | "INACTIVE">("ACTIVE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    type: "STUDENT" | "PARENT";
    name: string;
    email: string;
    studentName: string;
    status: "ACTIVE" | "INACTIVE";
  }>({
    type: "STUDENT",
    name: "",
    email: "",
    studentName: "",
    status: "ACTIVE",
  });

  const [csvRows, setCsvRows] = useState<CsvContactRow[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  async function loadContacts() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/contacts", { cache: "no-store" });
      const data = (await response.json()) as { contacts?: ContactRow[]; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not load contacts.");
      }

      setContacts(data.contacts ?? []);
      setMessage("");
      setIsError(false);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Could not load contacts.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadContacts();
  }, []);

  const activeCount = useMemo(() => contacts.filter((contact) => contact.isActive).length, [contacts]);

  async function handleCreateContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("/api/admin/contacts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type,
          name,
          email,
          studentName: type === "PARENT" ? studentName : undefined,
          status,
        }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not create contact.");
      }

      setName("");
      setEmail("");
      setStudentName("");
      setStatus("ACTIVE");
      setMessage("Contact created successfully.");
      await loadContacts();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Could not create contact.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function startEdit(contact: ContactRow) {
    setEditingId(contact.id);
    setEditForm({
      type: contact.type,
      name: contact.name,
      email: contact.email,
      studentName: contact.studentName ?? "",
      status: contact.isActive ? "ACTIVE" : "INACTIVE",
    });
  }

  async function saveEdit(contactId: string) {
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch(`/api/admin/contacts/${contactId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(editForm),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not update contact.");
      }

      setEditingId(null);
      setMessage("Contact updated.");
      await loadContacts();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Could not update contact.");
    }
  }

  async function updateContactStatus(contactId: string, nextStatus: "ACTIVE" | "INACTIVE") {
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch(`/api/admin/contacts/${contactId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? `Could not ${nextStatus === "ACTIVE" ? "activate" : "deactivate"} contact.`);
      }

      setMessage(`Contact ${nextStatus === "ACTIVE" ? "activated" : "deactivated"}.`);
      await loadContacts();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : `Could not ${nextStatus === "ACTIVE" ? "activate" : "deactivate"} contact.`);
    }
  }

  function handleTemplateDownload() {
    const blob = new Blob([contactsCsvTemplate], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "contacts-template.csv";
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  async function handleCsvFile(file: File) {
    const text = await file.text();
    const parsed = parseContactsCsv(text);
    setCsvRows(parsed.rows);
    setCsvErrors(parsed.errors);
    setImportResult(null);
  }

  async function confirmImport() {
    if (csvRows.length === 0) {
      return;
    }

    setIsImporting(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("/api/admin/contacts/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ rows: csvRows }),
      });

      const data = (await response.json()) as { error?: string; importedCount: number; skipped: Array<{ email: string; reason: string }> };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not import contacts.");
      }

      setImportResult({
        importedCount: data.importedCount,
        skipped: data.skipped,
      });
      setMessage(`Import completed. ${data.importedCount} contacts added.`);
      await loadContacts();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Could not import contacts.");
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Contacts</h1>
          <p className="mt-1 text-sm text-slate-600">Manage parent and student contacts used for random evaluation invites.</p>
          <p className="mt-2 text-sm text-slate-700">Active contacts in pool: {activeCount}</p>
        </div>

        {message ? (
          <div className={`rounded-md px-3 py-2 text-sm ${isError ? "border border-rose-300 bg-rose-50 text-rose-800" : "border border-emerald-300 bg-emerald-50 text-emerald-800"}`}>
            {message}
          </div>
        ) : null}

        <section className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Add Contact</CardTitle>
            </CardHeader>
            <CardContent>
              <form className="space-y-4" onSubmit={handleCreateContact}>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <div className="flex flex-wrap gap-3">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input type="radio" checked={type === "STUDENT"} onChange={() => setType("STUDENT")} />
                      Student
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700">
                      <input type="radio" checked={type === "PARENT"} onChange={() => setType("PARENT")} />
                      Parent
                    </label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-name">Full Name</Label>
                  <Input id="contact-name" value={name} onChange={(event) => setName(event.target.value)} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="contact-email">Email</Label>
                  <Input id="contact-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
                </div>

                {type === "PARENT" ? (
                  <div className="space-y-2">
                    <Label htmlFor="student-name">Student Name</Label>
                    <Input id="student-name" value={studentName} onChange={(event) => setStudentName(event.target.value)} required />
                  </div>
                ) : null}

                <div className="space-y-2">
                  <Label htmlFor="contact-status">Status</Label>
                  <select
                    id="contact-status"
                    value={status}
                    onChange={(event) => setStatus(event.target.value as "ACTIVE" | "INACTIVE")}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="INACTIVE">Inactive</option>
                  </select>
                </div>

                <Button type="submit" disabled={isSubmitting || !name || !email || (type === "PARENT" && !studentName)}>
                  {isSubmitting ? "Saving..." : "Add Contact"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>CSV Upload</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-slate-600">Required columns: type, name, email. Optional: student_name (required for Parent rows).</p>

                <Button type="button" variant="outline" onClick={handleTemplateDownload}>
                  Download CSV Template
                </Button>

                <div className="space-y-2">
                  <Label htmlFor="csv-file">Upload CSV</Label>
                  <Input
                    id="csv-file"
                    type="file"
                    accept=".csv,text/csv"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) {
                        void handleCsvFile(file);
                      }
                    }}
                  />
                </div>

                {csvErrors.length > 0 ? (
                  <div className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-800">
                    {csvErrors.map((error) => (
                      <p key={error}>{error}</p>
                    ))}
                  </div>
                ) : null}

                {csvRows.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-900">Preview ({csvRows.length} rows)</p>
                    <div className="max-h-56 overflow-auto rounded-md border border-slate-200">
                      <table className="min-w-full border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-slate-600">
                            <th className="px-3 py-2">Type</th>
                            <th className="px-3 py-2">Name</th>
                            <th className="px-3 py-2">Email</th>
                            <th className="px-3 py-2">Student Name</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvRows.map((row, index) => (
                            <tr key={`${row.email}-${index}`} className="border-b border-slate-100 last:border-0">
                              <td className="px-3 py-2">{row.type}</td>
                              <td className="px-3 py-2">{row.name}</td>
                              <td className="px-3 py-2">{row.email}</td>
                              <td className="px-3 py-2">{row.studentName ?? "-"}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <Button type="button" onClick={() => void confirmImport()} disabled={isImporting || csvErrors.length > 0}>
                      {isImporting ? "Importing..." : "Confirm Import"}
                    </Button>
                  </div>
                ) : null}

                {importResult ? (
                  <div className="space-y-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                    <p>Imported: {importResult.importedCount}</p>
                    {importResult.skipped.length > 0 ? (
                      <div>
                        <p className="font-medium text-slate-900">Skipped duplicates/invalid rows:</p>
                        {importResult.skipped.slice(0, 10).map((item, index) => (
                          <p key={`${item.email}-${index}`}>{item.email}: {item.reason}</p>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Contact List</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-sm text-slate-600">Loading contacts...</p>
            ) : contacts.length === 0 ? (
              <p className="text-sm text-slate-600">No contacts yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-4">Name</th>
                      <th className="py-2 pr-4">Type</th>
                      <th className="py-2 pr-4">Student Name</th>
                      <th className="py-2 pr-4">Email</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((contact) => {
                      const isEditing = editingId === contact.id;
                      return (
                        <tr key={contact.id} className="border-b border-slate-100 last:border-0">
                          <td className="py-3 pr-4">
                            {isEditing ? (
                              <Input value={editForm.name} onChange={(event) => setEditForm((prev) => ({ ...prev, name: event.target.value }))} />
                            ) : (
                              contact.name
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            {isEditing ? (
                              <select
                                value={editForm.type}
                                onChange={(event) => setEditForm((prev) => ({ ...prev, type: event.target.value as "STUDENT" | "PARENT" }))}
                                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                              >
                                <option value="STUDENT">Student</option>
                                <option value="PARENT">Parent</option>
                              </select>
                            ) : (
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${contact.type === "PARENT" ? "border border-sky-200 bg-sky-50 text-sky-700" : "border border-violet-200 bg-violet-50 text-violet-700"}`}>
                                {contact.type === "PARENT" ? "Parent" : "Student"}
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            {isEditing ? (
                              <Input value={editForm.studentName} onChange={(event) => setEditForm((prev) => ({ ...prev, studentName: event.target.value }))} disabled={editForm.type !== "PARENT"} />
                            ) : (
                              contact.studentName ?? "-"
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            {isEditing ? (
                              <Input type="email" value={editForm.email} onChange={(event) => setEditForm((prev) => ({ ...prev, email: event.target.value }))} />
                            ) : (
                              contact.email
                            )}
                          </td>
                          <td className="py-3 pr-4">
                            {isEditing ? (
                              <select
                                value={editForm.status}
                                onChange={(event) => setEditForm((prev) => ({ ...prev, status: event.target.value as "ACTIVE" | "INACTIVE" }))}
                                className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm"
                              >
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                              </select>
                            ) : (
                              <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${contact.isActive ? "border border-emerald-200 bg-emerald-50 text-emerald-700" : "border border-slate-200 bg-slate-100 text-slate-600"}`}>
                                {contact.isActive ? "Active" : "Inactive"}
                              </span>
                            )}
                          </td>
                          <td className="py-3">
                            <div className="flex flex-wrap gap-2">
                              {isEditing ? (
                                <>
                                  <Button type="button" onClick={() => void saveEdit(contact.id)}>Save</Button>
                                  <Button type="button" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                                </>
                              ) : (
                                <>
                                  <Button type="button" variant="outline" onClick={() => startEdit(contact)}>Edit</Button>
                                  {contact.isActive ? (
                                    <Button type="button" variant="outline" onClick={() => void updateContactStatus(contact.id, "INACTIVE")}>Deactivate</Button>
                                  ) : (
                                    <Button type="button" variant="outline" onClick={() => void updateContactStatus(contact.id, "ACTIVE")}>Activate</Button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
