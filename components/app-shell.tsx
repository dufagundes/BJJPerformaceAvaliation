"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { EvalProAppShell } from "../app/dashboard/_components/app-shell";

type SessionPayload = {
  user?: {
    name?: string | null;
    role?: string | null;
  };
};

const fallbackShellUser = {
  name: "Admin User",
  role: "Administrator",
  initials: "AU",
};

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "A";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1];
  return `${first}${second ?? ""}`.toUpperCase();
}

export default function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [shellUser, setShellUser] = useState(fallbackShellUser);
  const isEvaluationForm = /^\/evaluate\/[^/]+/.test(pathname);
  const isStandaloneDashboard = pathname === "/dashboard";
  const isAuthPage = /^\/admin\/(login|forgot-password|reset-password)/.test(pathname);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const response = await fetch("/api/auth/session", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const session = (await response.json()) as SessionPayload;
        const name = session.user?.name?.trim();
        if (!name || !isMounted) {
          return;
        }

        setShellUser({
          name,
          role: session.user?.role === "ADMIN" ? "Administrator" : session.user?.role ?? "Team Member",
          initials: initialsFor(name),
        });
      } catch {
        // Keep the fallback shell user if session loading fails.
      }
    }

    void loadSession();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isEvaluationForm || isStandaloneDashboard || isAuthPage) {
    return <>{children}</>;
  }

  return (
    <EvalProAppShell
      user={shellUser}
      title="EvalPro Workspace"
      subtitle="Manage employees, evaluations, feedback, reports, and administration settings."
    >
      {children}
    </EvalProAppShell>
  );
}