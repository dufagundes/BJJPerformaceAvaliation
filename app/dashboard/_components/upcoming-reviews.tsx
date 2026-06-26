import Link from "next/link";
import type { UpcomingReview } from "../mock-data";
import { Avatar } from "./avatar";
import { CardHeader, DashboardCard } from "./dashboard-card";
import { StatusBadge } from "./status-badge";

export function UpcomingReviews({ reviews }: { reviews: UpcomingReview[] }) {
  return (
    <DashboardCard>
      <CardHeader title="Upcoming Reviews" />
      <div className="divide-y divide-slate-100">
        {reviews.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-600">No pending evaluations found.</p>
        ) : null}
        {reviews.map((review) => (
          <Link key={`${review.name}-${review.date}`} href={review.href} className="flex items-center gap-3 px-5 py-4 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-indigo-100">
            <Avatar initials={review.initials} className="bg-gradient-to-br from-indigo-600 to-blue-600" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-950">{review.name}</p>
              <p className="truncate text-xs text-slate-500">{review.role}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2">
              <span className="text-xs font-medium text-slate-500">{review.date}</span>
              <StatusBadge status={review.status} />
            </div>
          </Link>
        ))}
      </div>
    </DashboardCard>
  );
}