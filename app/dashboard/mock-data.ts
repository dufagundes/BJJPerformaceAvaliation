export type MetricColor = "blue" | "violet" | "emerald" | "rose";

export type Metric = {
  title: string;
  value: string;
  trend: string;
  trendLabel: string;
  icon: "employees" | "progress" | "completed" | "overdue";
  color: MetricColor;
  chartData: number[];
  href: string;
};

export type ReviewStatus = "Due Soon" | "Scheduled" | "Completed" | "Overdue";

export type UpcomingReview = {
  name: string;
  role: string;
  date: string;
  status: ReviewStatus;
  initials: string;
  href: string;
};

export type RatingDistribution = {
  label: string;
  count: number;
};

export type GoalStatus = {
  label: string;
  value: number;
  color: "emerald" | "amber" | "rose";
};

export type QuickAction = {
  title: string;
  description: string;
  icon: "create" | "goal" | "feedback" | "report";
  href: string;
};

export type ReviewCycleProgressData = {
  completedPercent: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  href: string;
};

export type RecentFeedbackData = {
  quote: string;
  reviewerName: string;
  reviewerRole: string;
  reviewerInitials: string;
  rating: number;
};

export type DashboardUser = {
  name: string;
  role: string;
  initials: string;
};

export const goalStatuses: GoalStatus[] = [
  { label: "On Track", value: 65, color: "emerald" },
  { label: "At Risk", value: 20, color: "amber" },
  { label: "Behind", value: 15, color: "rose" },
];

export const quickActions: QuickAction[] = [
  { title: "Create Review", description: "Start a new evaluation cycle", icon: "create", href: "/admin/evaluations/new" },
  { title: "Add Goal", description: "Configure evaluation goals", icon: "goal", href: "/admin/scorecard" },
  { title: "Request Feedback", description: "Manage evaluator invites", icon: "feedback", href: "/admin/cycles" },
  { title: "Generate Report", description: "Open scorecard reports", icon: "report", href: "/admin/staff" },
];
