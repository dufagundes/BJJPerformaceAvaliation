export type MetricColor = "blue" | "violet" | "emerald" | "rose";

export type Metric = {
  title: string;
  value: string;
  trend: string;
  trendLabel: string;
  icon: "employees" | "progress" | "completed" | "overdue";
  color: MetricColor;
  chartData: number[];
};

export type ReviewStatus = "Due Soon" | "Scheduled" | "Completed" | "Overdue";

export type UpcomingReview = {
  name: string;
  role: string;
  date: string;
  status: ReviewStatus;
  initials: string;
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
};

export const metrics: Metric[] = [
  {
    title: "Total Employees",
    value: "124",
    trend: "+12%",
    trendLabel: "vs last quarter",
    icon: "employees",
    color: "blue",
    chartData: [18, 22, 21, 27, 30, 34, 38],
  },
  {
    title: "Reviews In Progress",
    value: "32",
    trend: "+8%",
    trendLabel: "active cycles",
    icon: "progress",
    color: "violet",
    chartData: [10, 12, 18, 20, 24, 28, 32],
  },
  {
    title: "Completed Reviews",
    value: "58",
    trend: "+18%",
    trendLabel: "completion rate",
    icon: "completed",
    color: "emerald",
    chartData: [22, 28, 31, 36, 42, 49, 58],
  },
  {
    title: "Overdue Reviews",
    value: "7",
    trend: "-5%",
    trendLabel: "needs attention",
    icon: "overdue",
    color: "rose",
    chartData: [14, 13, 12, 10, 9, 8, 7],
  },
];

export const ratingDistribution: RatingDistribution[] = [
  { label: "5 - Excellent", count: 28 },
  { label: "4 - Very Good", count: 34 },
  { label: "3 - Good", count: 16 },
  { label: "2 - Fair", count: 6 },
  { label: "1 - Poor", count: 2 },
];

export const upcomingReviews: UpcomingReview[] = [
  { name: "James Anderson", role: "Product Designer", date: "Jun 28", status: "Due Soon", initials: "JA" },
  { name: "Emily Carter", role: "Marketing Specialist", date: "Jun 29", status: "Due Soon", initials: "EC" },
  { name: "Michael Brown", role: "Software Engineer", date: "Jul 02", status: "Scheduled", initials: "MB" },
  { name: "Olivia Davis", role: "Sales Executive", date: "Jul 05", status: "Scheduled", initials: "OD" },
  { name: "Daniel Wilson", role: "Data Analyst", date: "Jul 08", status: "Scheduled", initials: "DW" },
];

export const goalStatuses: GoalStatus[] = [
  { label: "On Track", value: 65, color: "emerald" },
  { label: "At Risk", value: 20, color: "amber" },
  { label: "Behind", value: 15, color: "rose" },
];

export const quickActions: QuickAction[] = [
  { title: "Create Review", description: "Start a new evaluation cycle", icon: "create" },
  { title: "Add Goal", description: "Assign a measurable target", icon: "goal" },
  { title: "Request Feedback", description: "Invite 360 feedback input", icon: "feedback" },
  { title: "Generate Report", description: "Export insights for leaders", icon: "report" },
];

export const reviewCycleProgress = {
  completedPercent: 72,
  completed: 58,
  inProgress: 32,
  notStarted: 10,
};

export const recentFeedback = {
  quote:
    "Sarah consistently demonstrates strong leadership and a deep understanding of our goals. She is proactive, supportive, and a great team player.",
  reviewerName: "David Thompson",
  reviewerRole: "Team Lead",
  reviewerInitials: "DT",
  rating: 5,
};