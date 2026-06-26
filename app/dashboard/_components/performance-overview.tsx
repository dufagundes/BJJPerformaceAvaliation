import type { RatingDistribution } from "../mock-data";
import { CardHeader, DashboardCard } from "./dashboard-card";

export function PerformanceOverview({
  ratings,
  averageRating,
  ratingResponseCount,
}: {
  ratings: RatingDistribution[];
  averageRating: number;
  ratingResponseCount: number;
}) {
  const max = Math.max(...ratings.map((item) => item.count));
  const progressDegrees = Math.round((Math.min(averageRating, 5) / 5) * 360);

  return (
    <DashboardCard className="lg:col-span-2">
      <CardHeader
        title="Performance Overview"
        action={
          <select
            aria-label="Performance period"
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-100"
            defaultValue="This Quarter"
          >
            <option>This Quarter</option>
            <option>Last Quarter</option>
            <option>This Year</option>
          </select>
        }
      />
      <div className="grid gap-6 p-5 md:grid-cols-[220px_1fr] md:items-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <div
            className="grid h-40 w-40 place-items-center rounded-full"
            style={{ background: `conic-gradient(#2563eb 0deg ${progressDegrees}deg, #e2e8f0 ${progressDegrees}deg 360deg)` }}
            aria-label={`Average rating ${averageRating} out of 5`}
          >
            <div className="grid h-28 w-28 place-items-center rounded-full bg-white shadow-inner">
              <div className="text-center">
                <p className="text-4xl font-semibold text-slate-950">{averageRating.toFixed(1)}</p>
                <p className="text-xs font-medium text-slate-500">Average Rating</p>
              </div>
            </div>
          </div>
          <p className="text-sm text-slate-600">Based on {ratingResponseCount} rating answers</p>
        </div>

        <div className="space-y-4">
          {ratings.map((item) => (
            <div key={item.label} className="grid grid-cols-[112px_1fr_32px] items-center gap-3 text-sm">
              <span className="font-medium text-slate-700">{item.label}</span>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-indigo-600" style={{ width: `${max > 0 ? (item.count / max) * 100 : 0}%` }} />
              </div>
              <span className="text-right font-semibold text-slate-950">{item.count}</span>
            </div>
          ))}
        </div>
      </div>
    </DashboardCard>
  );
}