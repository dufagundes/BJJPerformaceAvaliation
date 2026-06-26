"use client";

import { useState, type ReactNode } from "react";
import { Header } from "./header";
import { Sidebar } from "./sidebar";
import type { DashboardUser } from "../mock-data";

export function EvalProAppShell({
  children,
  user,
  title,
  subtitle,
}: {
  children: ReactNode;
  user: DashboardUser;
  title?: string;
  subtitle?: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950 lg:flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0 flex-1">
        <Header onMenuClick={() => setSidebarOpen(true)} user={user} title={title} subtitle={subtitle} />
        <div className="px-4 py-6 sm:px-6 lg:px-8">{children}</div>
      </div>
    </div>
  );
}