import type { Metric, MetricColor } from "../mock-data";
import { cn } from "../../../lib/utils";
import { DashboardCard } from "./dashboard-card";
import { Icon } from "./icons";

const colorStyles: Record<MetricColor, { icon: string; accent: string; chart: string; background: string }> = {
  blue: {
    icon: "bg-blue-50 text-blue-700 ring-blue-100",
    accent: "text-blue-700",
    chart: "#2563eb",
    background: "bg-blue-50/60",
  },
  violet: {
    icon: "bg-violet-50 text-violet-700 ring-violet-100",
    accent: "text-violet-700",
    chart: "#7c3aed",
    background: "bg-violet-50/60",
  },
  emerald: {
    icon: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    accent: "text-emerald-700",
    chart: "#059669",
    background: "bg-emerald-50/60",
  },
  rose: {
    icon: "bg-rose-50 text-rose-700 ring-rose-100",
    accent: "text-rose-700",
    chart: "#e11d48",
    background: "bg-rose-50/60",
  },
};

function MiniLineChart({ data, color }: { data: number[]; color: string }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data
    .map((value, index) => {
      const x = (index / (data.length - 1)) * 96 + 2;
      const y = 34 - ((value - min) / range) * 26;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 38" className="h-10 w-24" role="img" aria-label="Metric trend chart">
      <polyline points={points} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function MetricCard({ metric }: { metric: Metric }) {
  const styles = colorStyles[metric.color];

  return (
    <DashboardCard className={cn("relative overflow-hidden p-5", styles.background)}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-600">{metric.title}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{metric.value}</p>
        </div>
        <div className={cn("flex h-11 w-11 items-center justify-center rounded-lg ring-1", styles.icon)}>
          <Icon name={metric.icon} className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className={cn("text-sm font-semibold", styles.accent)}>{metric.trend}</p>
          <p className="mt-1 text-xs text-slate-500">{metric.trendLabel}</p>
        </div>
        <MiniLineChart data={metric.chartData} color={styles.chart} />
      </div>
    </DashboardCard>
  );
}