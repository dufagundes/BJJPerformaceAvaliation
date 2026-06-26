import type { ReviewStatus } from "../mock-data";
import { cn } from "../../../lib/utils";

const badgeStyles: Record<ReviewStatus, string> = {
  "Due Soon": "border-orange-200 bg-orange-50 text-orange-700",
  Scheduled: "border-blue-200 bg-blue-50 text-blue-700",
  Completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  Overdue: "border-red-200 bg-red-50 text-red-700",
};

export function StatusBadge({ status }: { status: ReviewStatus }) {
  return (
    <span className={cn("inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold", badgeStyles[status])}>
      {status}
    </span>
  );
}