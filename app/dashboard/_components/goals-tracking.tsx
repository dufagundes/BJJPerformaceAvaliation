import type { GoalStatus } from "../mock-data";
import { cn } from "../../../lib/utils";
import { CardHeader, DashboardCard } from "./dashboard-card";

const barStyles: Record<GoalStatus["color"], string> = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
};

export function GoalsTracking({ goals }: { goals: GoalStatus[] }) {
  return (
    <DashboardCard>
      <CardHeader
        title="Goals Tracking"
        action={
          <select
            aria-label="Goals period"
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            defaultValue="This Quarter"
          >
            <option>This Quarter</option>
            <option>Last Quarter</option>
            <option>This Year</option>
          </select>
        }
      />
      <div className="space-y-5 p-5">
        {goals.map((goal) => (
          <div key={goal.label}>
            <div className="mb-2 flex items-center justify-between gap-4 text-sm">
              <span className="font-medium text-slate-700">{goal.label}</span>
              <span className="font-semibold text-slate-950">{goal.value}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-100">
              <div className={cn("h-full rounded-full", barStyles[goal.color])} style={{ width: `${goal.value}%` }} />
            </div>
          </div>
        ))}

        <button
          type="button"
          className="w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700 active:scale-[0.99]"
        >
          View goals
        </button>
      </div>
    </DashboardCard>
  );
}