"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

function ResetPasswordPageContent() {
  const searchParams = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsError(false);
    setMessage(null);

    if (!token) {
      setIsError(true);
      setMessage("Missing reset token.");
      return;
    }

    if (password.length < 8) {
      setIsError(true);
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setIsError(true);
      setMessage("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const payload = (await response.json()) as { error?: string; message?: string };
      if (!response.ok) {
        setIsError(true);
        setMessage(payload.error || "Could not reset password.");
      } else {
        setMessage(payload.message || "Password reset complete. You can sign in now.");
      }
    } catch {
      setIsError(true);
      setMessage("Could not reset password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#1A1A2E] px-4 py-10">
      <div className="mx-auto w-full max-w-md space-y-6">
        <header className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C8102E]">Gracie Barra Lindale</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Set New Password</h1>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white px-6 py-6 shadow-xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1A1A2E]" htmlFor="password">New Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#C8102E]"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1A1A2E]" htmlFor="confirmPassword">Confirm Password</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#C8102E]"
                required
              />
            </div>

            {message ? (
              <p className={`text-sm ${isError ? "text-rose-700" : "text-emerald-700"}`}>{message}</p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || !password || !confirmPassword}
              className="inline-flex w-full items-center justify-center rounded-md bg-[#C8102E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a40d25] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Updating..." : "Update Password"}
            </button>
          </form>

          <div className="mt-4">
            <Link href="/admin/login" className="text-sm font-medium text-[#1A1A2E] underline underline-offset-2 hover:text-[#C8102E]">
              Back to login
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#1A1A2E] px-4 py-10" />}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}