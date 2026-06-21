"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    try {
      await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      setMessage("If that admin email exists, a reset link has been sent.");
    } catch {
      setMessage("If that admin email exists, a reset link has been sent.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#1A1A2E] px-4 py-10">
      <div className="mx-auto w-full max-w-md space-y-6">
        <header className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C8102E]">Gracie Barra Lindale</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Reset Admin Password</h1>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white px-6 py-6 shadow-xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1A1A2E]" htmlFor="email">Admin Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#C8102E]"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !email}
              className="inline-flex w-full items-center justify-center rounded-md bg-[#C8102E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a40d25] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Sending..." : "Send Reset Link"}
            </button>

            {message ? <p className="text-sm text-slate-700">{message}</p> : null}
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