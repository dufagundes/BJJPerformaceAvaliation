import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type {
  DashboardUser,
  Metric,
  RatingDistribution,
  RecentFeedbackData,
  ReviewCycleProgressData,
  ReviewStatus,
  UpcomingReview,
} from "./mock-data";

export type DashboardData = {
  user: DashboardUser;
  metrics: Metric[];
  ratingDistribution: RatingDistribution[];
  averageRating: number;
  ratingResponseCount: number;
  upcomingReviews: UpcomingReview[];
  reviewCycleProgress: ReviewCycleProgressData;
  recentFeedback: RecentFeedbackData;
};

const emptyDistribution: RatingDistribution[] = [
  { label: "5 - Excellent", count: 0 },
  { label: "4 - Very Good", count: 0 },
  { label: "3 - Good", count: 0 },
  { label: "2 - Fair", count: 0 },
  { label: "1 - Poor", count: 0 },
];

function formatCount(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "U";
  const second = parts.length > 1 ? parts[parts.length - 1]?.[0] : parts[0]?.[1];
  return `${first}${second ?? ""}`.toUpperCase();
}

function formatShortDate(value: Date): string {
  return value.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

function getReviewStatus(deadline: Date, now: Date): ReviewStatus {
  if (deadline.getTime() < now.getTime()) {
    return "Overdue";
  }

  const threeDays = 1000 * 60 * 60 * 24 * 3;
  if (deadline.getTime() - now.getTime() <= threeDays) {
    return "Due Soon";
  }

  return "Scheduled";
}

function normalizeAnswerToRating(value: number): number {
  if (value <= 5) {
    return Math.max(1, Math.min(5, value));
  }

  return Math.max(1, Math.min(5, value / 20));
}

function readRatings(answers: Prisma.JsonValue): number[] {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) {
    return [];
  }

  return Object.entries(answers)
    .filter(([key, value]) => key.startsWith("q") && typeof value === "number" && Number.isFinite(value))
    .map(([, value]) => normalizeAnswerToRating(value as number));
}

function buildDistribution(values: number[]): { averageRating: number; ratingDistribution: RatingDistribution[] } {
  const counts = new Map<number, number>([
    [5, 0],
    [4, 0],
    [3, 0],
    [2, 0],
    [1, 0],
  ]);

  for (const value of values) {
    const bucket = Math.max(1, Math.min(5, Math.round(value)));
    counts.set(bucket, (counts.get(bucket) ?? 0) + 1);
  }

  const averageRating = values.length > 0 ? Number.parseFloat((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(1)) : 0;
  const labels = ["Excellent", "Very Good", "Good", "Fair", "Poor"];
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating, index) => ({
    label: `${rating} - ${labels[index]}`,
    count: counts.get(rating) ?? 0,
  }));

  return { averageRating, ratingDistribution };
}

function buildTrend(value: number, total: number): string {
  if (total === 0) {
    return "0%";
  }

  return `${Math.round((value / total) * 100)}%`;
}

function buildChartData(value: number): number[] {
  return [0, Math.max(0, Math.round(value * 0.25)), Math.max(0, Math.round(value * 0.45)), Math.max(0, Math.round(value * 0.7)), value];
}

function fallbackFeedback(): RecentFeedbackData {
  return {
    quote: "No written feedback has been submitted yet. Completed evaluation comments will appear here as soon as evaluators share them.",
    reviewerName: "Evaluation System",
    reviewerRole: "Latest feedback",
    reviewerInitials: "ES",
    rating: 0,
  };
}

export async function getDashboardData(user: DashboardUser): Promise<DashboardData> {
  const now = new Date();
  const [totalEmployees, inProgressCycles, completedCycles, completedResponses, reviewers, responses, latestFeedback] = await Promise.all([
    prisma.staffMember.count({ where: { isActive: true, user: { isActive: true } } }),
    prisma.evaluationCycle.count({ where: { status: "IN_PROGRESS" } }),
    prisma.evaluationCycle.count({ where: { status: "COMPLETED" } }),
    prisma.evaluationResponse.count(),
    prisma.reviewer.findMany({
      select: {
        id: true,
        status: true,
        tokenExpiresAt: true,
        cycle: {
          select: {
            id: true,
            deadline: true,
            subject: {
              select: {
                name: true,
                staffProfile: { select: { title: true } },
              },
            },
          },
        },
      },
    }),
    prisma.evaluationResponse.findMany({ select: { answers: true } }),
    prisma.evaluationResponse.findFirst({
      where: { OR: [{ strengths_text: { not: null } }, { improvements_text: { not: null } }] },
      orderBy: { submittedAt: "desc" },
      select: {
        strengths_text: true,
        improvements_text: true,
        reviewer: {
          select: {
            type: true,
            user: { select: { name: true, staffProfile: { select: { title: true } } } },
            contact: { select: { name: true, type: true } },
          },
        },
      },
    }),
  ]);

  const pendingReviewers = reviewers.filter((reviewer) => reviewer.status === "PENDING");
  const overdueReviewers = pendingReviewers.filter((reviewer) => reviewer.cycle.deadline.getTime() < now.getTime()).length;
  const totalAssignments = reviewers.length;
  const staffWithoutOpenCycle = Math.max(totalEmployees - inProgressCycles, 0);

  const metrics: Metric[] = [
    {
      title: "Total Employees",
      value: formatCount(totalEmployees),
      trend: buildTrend(totalEmployees, Math.max(totalEmployees, 1)),
      trendLabel: "active staff",
      icon: "employees",
      color: "blue",
      chartData: buildChartData(totalEmployees),
      href: "/admin/staff",
    },
    {
      title: "Reviews In Progress",
      value: formatCount(inProgressCycles),
      trend: buildTrend(inProgressCycles, Math.max(inProgressCycles + completedCycles, 1)),
      trendLabel: "open cycles",
      icon: "progress",
      color: "violet",
      chartData: buildChartData(inProgressCycles),
      href: "/admin/cycles",
    },
    {
      title: "Completed Reviews",
      value: formatCount(completedResponses),
      trend: buildTrend(completedResponses, Math.max(totalAssignments, 1)),
      trendLabel: "submitted responses",
      icon: "completed",
      color: "emerald",
      chartData: buildChartData(completedResponses),
      href: "/admin/cycles",
    },
    {
      title: "Overdue Reviews",
      value: formatCount(overdueReviewers),
      trend: buildTrend(overdueReviewers, Math.max(pendingReviewers.length, 1)),
      trendLabel: "pending past deadline",
      icon: "overdue",
      color: "rose",
      chartData: buildChartData(overdueReviewers),
      href: "/admin/cycles",
    },
  ];

  const allRatings = responses.flatMap((response) => readRatings(response.answers));
  const ratingSummary = buildDistribution(allRatings);

  const upcomingReviews: UpcomingReview[] = pendingReviewers
    .sort((first, second) => first.cycle.deadline.getTime() - second.cycle.deadline.getTime())
    .slice(0, 5)
    .map((reviewer) => ({
      name: reviewer.cycle.subject.name,
      role: reviewer.cycle.subject.staffProfile?.title ?? "Staff Member",
      date: formatShortDate(reviewer.cycle.deadline),
      status: getReviewStatus(reviewer.cycle.deadline, now),
      initials: initialsFor(reviewer.cycle.subject.name),
      href: `/admin/evaluations/${reviewer.cycle.id}`,
    }));

  const completedPercent = totalAssignments > 0 ? Math.round((completedResponses / totalAssignments) * 100) : 0;
  const reviewCycleProgress: ReviewCycleProgressData = {
    completedPercent,
    completed: completedResponses,
    inProgress: pendingReviewers.length,
    notStarted: staffWithoutOpenCycle,
    href: "/admin/cycles",
  };

  const feedbackText = latestFeedback?.strengths_text?.trim() || latestFeedback?.improvements_text?.trim();
  const reviewerName = latestFeedback?.reviewer.user?.name || latestFeedback?.reviewer.contact?.name || "Evaluation System";
  const reviewerRole = latestFeedback?.reviewer.user?.staffProfile?.title || latestFeedback?.reviewer.contact?.type || "Evaluator";
  const recentFeedback: RecentFeedbackData = feedbackText
    ? {
        quote: feedbackText,
        reviewerName,
        reviewerRole,
        reviewerInitials: initialsFor(reviewerName),
        rating: 5,
      }
    : fallbackFeedback();

  return {
    user,
    metrics,
    ratingDistribution: ratingSummary.ratingDistribution.length > 0 ? ratingSummary.ratingDistribution : emptyDistribution,
    averageRating: ratingSummary.averageRating,
    ratingResponseCount: allRatings.length,
    upcomingReviews,
    reviewCycleProgress,
    recentFeedback,
  };
}