import type { Metadata } from "next";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { EvalProAppShell } from "./_components/app-shell";
import { GoalsTracking } from "./_components/goals-tracking";
import { MetricCard } from "./_components/metric-card";
import { PerformanceOverview } from "./_components/performance-overview";
import { QuickActions } from "./_components/quick-actions";
import { RecentFeedback } from "./_components/recent-feedback";
import { ReviewCycleProgress } from "./_components/review-cycle-progress";
import { UpcomingReviews } from "./_components/upcoming-reviews";
import { getDashboardData } from "./dashboard-data";
import { goalStatuses, quickActions } from "./mock-data";
import { authOptions } from "../../lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "EvalPro Dashboard",
  description: "Employee evaluation and performance review dashboard",
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "U";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1];
  return `${first}${second ?? ""}`.toUpperCase();
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const dashboardData = await getDashboardData({
    name: session.user.name ?? "Admin User",
    role: "HR Manager",
    initials: getInitials(session.user.name ?? "Admin User"),
  });

  return (
    <EvalProAppShell user={dashboardData.user}>
      <div className="mx-auto max-w-[1500px] space-y-6">
        <section aria-label="Evaluation metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {dashboardData.metrics.map((metric) => (
            <MetricCard key={metric.title} metric={metric} />
          ))}
        </section>

        <section aria-label="Performance and upcoming reviews" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          <PerformanceOverview
            ratings={dashboardData.ratingDistribution}
            averageRating={dashboardData.averageRating}
            ratingResponseCount={dashboardData.ratingResponseCount}
          />
          <UpcomingReviews reviews={dashboardData.upcomingReviews} />
        </section>

        <section aria-label="Cycle progress and feedback" className="grid gap-6 lg:grid-cols-3">
          <ReviewCycleProgress progress={dashboardData.reviewCycleProgress} />
          <GoalsTracking goals={goalStatuses} />
          <RecentFeedback feedback={dashboardData.recentFeedback} />
        </section>

        <QuickActions actions={quickActions} />
      </div>
    </EvalProAppShell>
  );
}