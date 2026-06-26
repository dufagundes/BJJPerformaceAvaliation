import type { ReactElement, SVGProps } from "react";

type IconName =
  | "analytics"
  | "bell"
  | "completed"
  | "create"
  | "dashboard"
  | "employees"
  | "feedback"
  | "goal"
  | "goals"
  | "help"
  | "menu"
  | "overdue"
  | "progress"
  | "report"
  | "reports"
  | "reviews"
  | "search"
  | "settings"
  | "star"
  | "x";

type IconProps = SVGProps<SVGSVGElement> & {
  name: IconName;
};

const paths: Record<IconName, ReactElement> = {
  analytics: <path d="M4 19V9m6 10V5m6 14v-7m4 7H3" />,
  bell: <path d="M18 16H6l1.5-2.5V10a4.5 4.5 0 0 1 9 0v3.5L18 16Zm-8 3h4" />,
  completed: <path d="M4 12.5 9 17l11-12" />,
  create: <path d="M5 19h14M7 15l8.5-8.5 2 2L9 17H7v-2Z" />,
  dashboard: <path d="M4 5h7v7H4V5Zm9 0h7v4h-7V5ZM4 14h7v5H4v-5Zm9-3h7v8h-7v-8Z" />,
  employees: <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7-1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM4 19a5 5 0 0 1 10 0m1-4a4.5 4.5 0 0 1 5 4" />,
  feedback: <path d="M5 6h14v9H8l-3 3V6Zm4 4h6m-6 3h4" />,
  goal: <path d="M12 20a8 8 0 1 1 8-8m-4 0a4 4 0 1 1-4-4m1 3 6-6m-1 0h3v3" />,
  goals: <path d="M5 6h14M5 12h14M5 18h9m-9-9 2 2 3-4m-5 8 2 2 3-4" />,
  help: <path d="M12 19v.01M9.7 9a2.4 2.4 0 1 1 4.3 1.5c-.9.8-2 1.2-2 2.7" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  overdue: <path d="M12 8v5l3 2m5-3a8 8 0 1 1-16 0 8 8 0 0 1 16 0Z" />,
  progress: <path d="M4 13a8 8 0 1 1 8 8H4v-8Zm8-5v5l3 2" />,
  report: <path d="M6 4h9l3 3v13H6V4Zm8 0v4h4M9 13h6M9 17h4" />,
  reports: <path d="M6 4h9l3 3v13H6V4Zm8 0v4h4M9 13h6M9 17h4" />,
  reviews: <path d="M5 5h14v14H5V5Zm4 5h6m-6 4h4m-5-8v2m8-2v2" />,
  search: <path d="m19 19-4-4m2-5a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z" />,
  settings: <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-5v3m0 12v3M4.2 6.2l2.1 2.1m11.4 7.4 2.1 2.1m0-11.6-2.1 2.1M6.3 15.7l-2.1 2.1" />,
  star: <path d="m12 3 2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7L6.8 19l1-5.8L3.6 9.1l5.8-.8L12 3Z" />,
  x: <path d="m6 6 12 12M18 6 6 18" />,
};

export function Icon({ name, className, ...props }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
      {...props}
    >
      {paths[name]}
    </svg>
  );
}