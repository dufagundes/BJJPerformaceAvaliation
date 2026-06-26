"use client";

import { Avatar } from "./avatar";
import { Icon } from "./icons";
import type { DashboardUser } from "../mock-data";

type HeaderProps = {
  onMenuClick: () => void;
  user: DashboardUser;
  title?: string;
  subtitle?: string;
};

export function Header({ onMenuClick, user, title, subtitle }: HeaderProps) {
  const firstName = user.name.split(" ")[0] ?? user.name;

  return (
    <header className="border-b border-slate-200 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            aria-label="Open navigation"
            onClick={onMenuClick}
            className="mt-1 rounded-md border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50 active:scale-[0.98] lg:hidden"
          >
            <Icon name="menu" className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-950">{title ?? `Good morning, ${firstName}!`}</h1>
            <p className="mt-1 text-sm text-slate-600">{subtitle ?? "Here's what's happening with your team today."}</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block sm:w-80">
            <span className="sr-only">Search employees, reviews, or reports</span>
            <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search employees, reviews..."
              className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white focus:ring-4 focus:ring-indigo-100"
            />
          </label>

          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="View notifications"
              className="relative flex h-11 w-11 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:scale-[0.98]"
            >
              <Icon name="bell" className="h-5 w-5" />
              <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500" />
            </button>

            <button
              type="button"
              className="flex min-w-0 items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2 text-left transition hover:border-indigo-200 hover:bg-indigo-50 active:scale-[0.99]"
              aria-label="Open user profile menu"
            >
              <Avatar initials={user.initials} className="h-9 w-9 bg-indigo-600" />
              <span className="hidden min-w-0 sm:block">
                <span className="block truncate text-sm font-semibold text-slate-950">{user.name}</span>
                <span className="block truncate text-xs text-slate-500">{user.role}</span>
              </span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}