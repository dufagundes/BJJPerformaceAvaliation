import type { QuickAction } from "../mock-data";
import { DashboardCard } from "./dashboard-card";
import { Icon } from "./icons";

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  return (
    <section aria-labelledby="quick-actions-heading" className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <h2 id="quick-actions-heading" className="text-base font-semibold text-slate-950">
          Quick Actions
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map((action) => (
          <DashboardCard key={action.title} className="p-5">
            <button type="button" className="group flex w-full items-start gap-4 text-left">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 transition group-hover:bg-indigo-600 group-hover:text-white">
                <Icon name={action.icon} className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-slate-950">{action.title}</span>
                <span className="mt-1 block text-sm leading-5 text-slate-500">{action.description}</span>
              </span>
            </button>
          </DashboardCard>
        ))}
      </div>
    </section>
  );
}