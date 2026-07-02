"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "./icons";
import { cn } from "../../../lib/utils";

type SidebarProps = {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
  onToggleCollapse: () => void;
};

const navigationItems = [
  { label: "Dashboard", icon: "dashboard" as const, href: "/dashboard" },
  { label: "Students & Parents", icon: "employees" as const, href: "/admin/contacts" },
  { label: "Evaluations", icon: "reviews" as const, href: "/admin/cycles" },
  { label: "Staff & Reports", icon: "reports" as const, href: "/admin/staff" },
  { label: "Calendar", icon: "progress" as const, href: "/admin/cycles" },
  { label: "Messages", icon: "feedback" as const, href: "/pending-evaluations" },
  { label: "School Settings", icon: "settings" as const, href: "/admin/settings" },
];

const settingsItems = [
  { label: "School Contacts", href: "/admin/contacts" },
  { label: "Platform: Schools & Admins", href: "/admin/schools-admins" },
  { label: "School Scorecard Builder", href: "/admin/scorecard-builder" },
  { label: "School Evaluation Defaults", href: "/admin/evaluation-defaults" },
  { label: "Test Email", href: "/admin/test-email" },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === "/" || pathname === "/dashboard";
  }

  if (href === "/admin") {
    return pathname === "/admin" || pathname === "/admin/dashboard";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ isOpen, isCollapsed, onClose, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const settingsActive = settingsItems.some((item) => isActivePath(pathname, item.href));

  return (
    <>
      <button
        type="button"
        aria-label="Close navigation"
        className={cn("fixed inset-0 z-30 bg-slate-950/40 transition lg:hidden", isOpen ? "block" : "hidden")}
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-gradient-to-b from-slate-950 via-slate-900 to-indigo-950 px-4 py-5 text-white shadow-2xl transition-all duration-300 lg:relative lg:static lg:z-auto lg:min-h-screen lg:translate-x-0 lg:shadow-none",
          isCollapsed ? "lg:w-20 lg:px-3" : "lg:w-72",
          isOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className={cn("mb-8 flex items-center justify-between gap-3 px-2", isCollapsed ? "lg:justify-center lg:px-0" : "")}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-base font-bold text-slate-950 shadow-sm">
              EP
            </div>
            <div className={cn(isCollapsed ? "lg:hidden" : "")}>
              <p className="text-lg font-semibold tracking-tight">EvalPro</p>
              <p className="text-xs text-slate-300">Employee Evaluation</p>
            </div>
          </div>
          <button
            type="button"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "hidden rounded-md p-2 text-slate-300 transition hover:bg-white/10 hover:text-white lg:inline-flex",
              isCollapsed ? "lg:absolute lg:right-2 lg:top-5 lg:bg-white/10" : "",
            )}
            onClick={onToggleCollapse}
          >
            <i className={cn("bi", isCollapsed ? "bi-chevron-right" : "bi-chevron-left")} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Close sidebar"
            className="rounded-md p-2 text-slate-300 transition hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onClose}
          >
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <nav aria-label="Main navigation" className={cn("flex-1 space-y-1", isCollapsed ? "lg:flex lg:flex-col lg:items-center" : "")}>
          {navigationItems.map((item) => (
            (() => {
              const active = isActivePath(pathname, item.href);

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={onClose}
                  title={isCollapsed ? item.label : undefined}
                  aria-label={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition",
                    isCollapsed ? "lg:h-11 lg:w-11 lg:justify-center lg:px-0" : "",
                    active
                      ? "bg-white text-slate-950 shadow-sm"
                      : "text-slate-300 hover:bg-white/10 hover:text-white",
                  )}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon name={item.icon} className="h-5 w-5 shrink-0" />
                  <span className={cn(isCollapsed ? "lg:hidden" : "")}>{item.label}</span>
                </Link>
              );
            })()
          ))}

          <div className={cn("pt-2", isCollapsed ? "lg:hidden" : "")}>
            <div className={cn("mt-1 space-y-1 border-l border-white/10 pl-4", settingsActive ? "block" : "hidden lg:block")}>
              {settingsItems.map((item) => {
                const active = isActivePath(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "block rounded-md px-3 py-2 text-sm transition",
                      active ? "bg-white/15 font-semibold text-white" : "text-slate-400 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        <div className={cn("rounded-lg border border-white/10 bg-white/10 p-4 shadow-sm backdrop-blur", isCollapsed ? "lg:p-2" : "")}>
          <div className={cn("mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white", isCollapsed ? "lg:mx-auto lg:mb-0" : "")}>
            <Icon name="help" className="h-5 w-5" />
          </div>
          <p className={cn("text-sm font-semibold", isCollapsed ? "lg:hidden" : "")}>Need support?</p>
          <p className={cn("mt-1 text-xs leading-5 text-slate-300", isCollapsed ? "lg:hidden" : "")}>Get help setting up evaluation cycles and team reports.</p>
          <button
            type="button"
            className={cn("mt-4 w-full rounded-md bg-white px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 active:scale-[0.99]", isCollapsed ? "lg:hidden" : "")}
          >
            Contact Support
          </button>
        </div>
      </aside>
    </>
  );
}