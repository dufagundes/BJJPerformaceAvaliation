import { CardHeader, DashboardCard } from "./dashboard-card";

type ProgressProps = {
  completedPercent: number;
  completed: number;
  inProgress: number;
  notStarted: number;
};

export function ReviewCycleProgress({ progress }: { progress: ProgressProps }) {
  return (
    <DashboardCard>
      <CardHeader title="Review Cycle Progress" />
      <div className="p-5">
        <div className="flex items-center justify-center">
          <div
            className="grid h-36 w-36 place-items-center rounded-full"
            style={{ background: `conic-gradient(#4f46e5 0deg ${progress.completedPercent * 3.6}deg, #e2e8f0 ${progress.completedPercent * 3.6}deg 360deg)` }}
            aria-label={`${progress.completedPercent}% completed`}
          >
            <div className="grid h-24 w-24 place-items-center rounded-full bg-white shadow-inner">
              <div className="text-center">
                <p className="text-3xl font-semibold text-slate-950">{progress.completedPercent}%</p>
                <p className="text-xs font-medium text-slate-500">Completed</p>
              </div>
            </div>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-emerald-50 p-3">
            <dt className="text-xs text-emerald-700">Completed</dt>
            <dd className="mt-1 text-lg font-semibold text-emerald-900">{progress.completed}</dd>
          </div>
          <div className="rounded-lg bg-blue-50 p-3">
            <dt className="text-xs text-blue-700">In Progress</dt>
            <dd className="mt-1 text-lg font-semibold text-blue-900">{progress.inProgress}</dd>
          </div>
          <div className="rounded-lg bg-slate-100 p-3">
            <dt className="text-xs text-slate-600">Not Started</dt>
            <dd className="mt-1 text-lg font-semibold text-slate-900">{progress.notStarted}</dd>
          </div>
        </dl>

        <button
          type="button"
          className="mt-5 w-full rounded-md bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 active:scale-[0.99]"
        >
          View full report
        </button>
      </div>
    </DashboardCard>
  );
}