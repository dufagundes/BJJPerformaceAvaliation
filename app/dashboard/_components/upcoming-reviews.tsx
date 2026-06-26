import type { UpcomingReview } from "../mock-data";
import { Avatar } from "./avatar";
import { CardHeader, DashboardCard } from "./dashboard-card";
import { StatusBadge } from "./status-badge";

export function UpcomingReviews({ reviews }: { reviews: UpcomingReview[] }) {
  return (
    <DashboardCard>
      <CardHeader title="Upcoming Reviews" />
      <div className="divide-y divide-slate-100">
        {reviews.map((review) => (
          <div key={`${review.name}-${review.date}`} className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50">
            <Avatar initials={review.initials} className="bg-gradient-to-br from-indigo-600 to-blue-600" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-950">{review.name}</p>
              <p className="truncate text-xs text-slate-500">{review.role}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className="text-xs font-medium text-slate-500">{review.date}</span>
              <StatusBadge status={review.status} />
            </div>
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}