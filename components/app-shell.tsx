import Link from "next/link";
import type { ReactNode } from "react";

const navItems = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin", label: "Admin" },
  { href: "/admin/staff", label: "Staff" },
  { href: "/admin/contacts", label: "Contacts" },
  { href: "/admin/evaluations/new", label: "New Cycle" },
  { href: "/admin/cycles", label: "Cycles" },
  { href: "/admin/settings", label: "Settings" },
  { href: "/admin/scorecard", label: "Scorecard" },
  { href: "/evaluate", label: "Reviewer Access" },
];

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link href="/" className="text-lg font-semibold tracking-tight text-slate-900">
              GB Staff Performance
            </Link>
            <p className="text-sm text-slate-500">Quarterly scorecards, evaluator workflows, and coaching summaries</p>
          </div>

          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                className="rounded-full border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {children}
    </div>
  );
}