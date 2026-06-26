import type { Metadata } from "next";
import { EvalProAppShell } from "./_components/app-shell";
import { GoalsTracking } from "./_components/goals-tracking";
import { MetricCard } from "./_components/metric-card";
import { PerformanceOverview } from "./_components/performance-overview";
import { QuickActions } from "./_components/quick-actions";
import { RecentFeedback } from "./_components/recent-feedback";
import { ReviewCycleProgress } from "./_components/review-cycle-progress";
import { UpcomingReviews } from "./_components/upcoming-reviews";
import {
  goalStatuses,
  metrics,
  quickActions,
  ratingDistribution,
  recentFeedback,
  reviewCycleProgress,
  upcomingReviews,
} from "./mock-data";

export const metadata: Metadata = {
  title: "EvalPro Dashboard",
  description: "Employee evaluation and performance review dashboard",
};

export default function DashboardPage() {
  return (
    <EvalProAppShell>
      <div className="mx-auto max-w-[1500px] space-y-6">
        <section aria-label="Evaluation metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} metric={metric} />
          ))}
        </section>

        <section aria-label="Performance and upcoming reviews" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <PerformanceOverview ratings={ratingDistribution} />
          <UpcomingReviews reviews={upcomingReviews} />
        </section>

        <section aria-label="Cycle progress and feedback" className="grid gap-6 lg:grid-cols-3">
          <ReviewCycleProgress progress={reviewCycleProgress} />
          <GoalsTracking goals={goalStatuses} />
          <RecentFeedback feedback={recentFeedback} />
        </section>

        <QuickActions actions={quickActions} />
      </div>
    </EvalProAppShell>
  );
}