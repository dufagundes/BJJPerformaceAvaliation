import { Avatar } from "./avatar";
import { CardHeader, DashboardCard } from "./dashboard-card";
import { Icon } from "./icons";

type FeedbackProps = {
  quote: string;
  reviewerName: string;
  reviewerRole: string;
  reviewerInitials: string;
  rating: number;
};

export function RecentFeedback({ feedback }: { feedback: FeedbackProps }) {
  return (
    <DashboardCard>
      <CardHeader title="Recent Feedback" />
      <div className="p-5">
        <div className="mb-4 flex gap-1 text-amber-400" aria-label={`${feedback.rating} out of 5 stars`}>
          {Array.from({ length: 5 }, (_, index) => (
            <Icon key={index} name="star" className="h-4 w-4 fill-current" />
          ))}
        </div>
        <blockquote className="text-sm leading-6 text-slate-700">&ldquo;{feedback.quote}&rdquo;</blockquote>

        <div className="mt-5 flex items-center gap-3">
          <Avatar initials={feedback.reviewerInitials} className="bg-slate-800" />
          <div>
            <p className="text-sm font-semibold text-slate-950">{feedback.reviewerName}</p>
            <p className="text-xs text-slate-500">{feedback.reviewerRole}</p>
          </div>
        </div>

        <div className="mt-5 flex justify-center gap-2" aria-label="Feedback carousel position">
          <span className="h-2 w-6 rounded-full bg-indigo-600" />
          <span className="h-2 w-2 rounded-full bg-slate-300" />
          <span className="h-2 w-2 rounded-full bg-slate-300" />
        </div>
      </div>
    </DashboardCard>
  );
}