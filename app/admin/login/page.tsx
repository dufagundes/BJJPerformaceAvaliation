"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";

function AdminLoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/admin/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    if (!result || result.error) {
      setError("Invalid credentials or no admin access for this account.");
      setIsSubmitting(false);
      return;
    }

    router.push(result.url || "/admin/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-[#1A1A2E] px-4 py-10">
      <div className="mx-auto flex w-full max-w-md flex-col gap-6">
        <header className="text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#C8102E]">Gracie Barra Lindale</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Admin Login</h1>
          <p className="mt-2 text-sm text-slate-300">Sign in to manage staff evaluation cycles and reviewer invites.</p>
        </header>

        <section className="rounded-2xl border border-white/10 bg-white px-6 py-6 shadow-xl">
          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1A1A2E]" htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#C8102E]"
                placeholder="admin@graciebarralindale.com"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#1A1A2E]" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-[#C8102E]"
                placeholder="Enter your password"
                required
              />
            </div>

            {error ? (
              <p className="rounded-md border border-rose-300 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || !email || !password}
              className="inline-flex w-full items-center justify-center rounded-md bg-[#C8102E] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#a40d25] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-4 text-right">
            <Link href="/admin/forgot-password" className="text-sm font-medium text-[#1A1A2E] underline underline-offset-2 hover:text-[#C8102E]">
              Forgot password?
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-[#1A1A2E] px-4 py-10" />}>
      <AdminLoginPageContent />
    </Suspense>
  );
}