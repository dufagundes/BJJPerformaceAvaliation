"use client";

import { FormEvent, useEffect, useState } from "react";
import { Button } from "../../../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Input } from "../../../components/ui/input";
import { Label } from "../../../components/ui/label";

type SchoolRow = {
  id: string;
  name: string;
  isActive: boolean;
  createdAt: string;
  _count: {
    users: number;
    contacts: number;
    evaluationCycles: number;
  };
  users: Array<{
    id: string;
    name: string;
    email: string;
  }>;
};

export default function SchoolsClient({ currentSchoolName }: { currentSchoolName: string }) {
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [schoolName, setSchoolName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function loadSchools() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/admin/schools", { cache: "no-store" });
      const data = (await response.json()) as { schools?: SchoolRow[]; error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not load schools.");
      }
      setSchools(data.schools ?? []);
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Could not load schools.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadSchools();
  }, []);

  async function handleCreateSchool(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("/api/admin/schools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolName, adminName, adminEmail, adminPassword }),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not create school.");
      }

      setSchoolName("");
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
      setMessage("School and administrator account created.");
      await loadSchools();
    } catch (error) {
      setIsError(true);
      setMessage(error instanceof Error ? error.message : "Could not create school.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <main className="px-4 py-8">
      <div className="mx-auto max-w-5xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Schools & Admins</h1>
          <p className="mt-1 text-sm text-slate-600">
            Current workspace: {currentSchoolName}. Create pilot schools and their first administrator account.
          </p>
        </div>

        {message ? (
          <div className={`rounded-md px-3 py-2 text-sm ${isError ? "border border-rose-300 bg-rose-50 text-rose-800" : "border border-emerald-300 bg-emerald-50 text-emerald-800"}`}>
            {message}
          </div>
        ) : null}

        <Card>
          <CardHeader>
            <CardTitle>Create School</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={handleCreateSchool}>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="school-name">School name</Label>
                <Input id="school-name" value={schoolName} onChange={(event) => setSchoolName(event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-name">Administrator name</Label>
                <Input id="admin-name" value={adminName} onChange={(event) => setAdminName(event.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">Administrator email</Label>
                <Input id="admin-email" type="email" value={adminEmail} onChange={(event) => setAdminEmail(event.target.value)} required />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="admin-password">Temporary password</Label>
                <Input id="admin-password" type="password" minLength={8} value={adminPassword} onChange={(event) => setAdminPassword(event.target.value)} required />
              </div>
              <div className="md:col-span-2">
                <Button type="submit" disabled={isSaving || !schoolName || !adminName || !adminEmail || adminPassword.length < 8}>
                  {isSaving ? "Creating..." : "Create School & Admin"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Registered Schools</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <p className="text-sm text-slate-600">Loading schools...</p> : null}
            {!isLoading && schools.length === 0 ? <p className="text-sm text-slate-600">No schools registered yet.</p> : null}
            {!isLoading && schools.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-4 font-medium">School</th>
                      <th className="py-2 pr-4 font-medium">Admins</th>
                      <th className="py-2 pr-4 font-medium">Users</th>
                      <th className="py-2 pr-4 font-medium">Contacts</th>
                      <th className="py-2 font-medium">Cycles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schools.map((school) => (
                      <tr key={school.id} className="border-b border-slate-100 text-slate-700 last:border-b-0">
                        <td className="py-3 pr-4 font-medium text-slate-900">{school.name}</td>
                        <td className="py-3 pr-4">
                          {school.users.map((admin) => admin.email).join(", ") || "-"}
                        </td>
                        <td className="py-3 pr-4">{school._count.users}</td>
                        <td className="py-3 pr-4">{school._count.contacts}</td>
                        <td className="py-3">{school._count.evaluationCycles}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}