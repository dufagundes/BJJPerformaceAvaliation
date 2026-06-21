"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import { Label } from "../../../../components/ui/label";
import { STAFF_ROLES } from "../../../../lib/staffRoles";

export default function StaffForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [message, setMessage] = useState<string>("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setIsError(false);

    try {
      const response = await fetch("/api/admin/staff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, role }),
      });

      const data = (await response.json()) as { error?: string };

      if (!response.ok) {
        setIsError(true);
        setMessage(data.error ?? "Could not register staff member.");
        setIsSubmitting(false);
        return;
      }

      setMessage("Staff member created successfully.");
      router.push("/admin/staff");
      router.refresh();
    } catch {
      setIsError(true);
      setMessage("Could not register staff member.");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="name">Full name</Label>
        <Input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Professor Jane Smith" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="jane@school.com" />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <select
          id="role"
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          <option value="">Select a role</option>
          {STAFF_ROLES.map((staffRole) => (
            <option key={staffRole} value={staffRole}>
              {staffRole}
            </option>
          ))}
        </select>
      </div>

      {message ? (
        <div className={`rounded-md px-3 py-2 text-sm ${isError ? "border border-rose-300 bg-rose-50 text-rose-800" : "border border-emerald-300 bg-emerald-50 text-emerald-800"}`}>
          {message}
        </div>
      ) : null}

      <Button type="submit" disabled={isSubmitting || !name || !email || !role}>
        {isSubmitting ? "Saving..." : "Save Staff Member"}
      </Button>
    </form>
  );
}
