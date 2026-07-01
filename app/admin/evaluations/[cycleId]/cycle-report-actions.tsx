"use client";

type ReviewerExportRow = {
  name: string;
  email: string;
  audience: string;
  status: string;
};

function escapeCsvValue(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export default function CycleReportActions({
  subjectName,
  reviewers,
}: {
  subjectName: string;
  reviewers: ReviewerExportRow[];
}) {
  function handlePrintReport() {
    window.print();
  }

  function handleDownloadReviewerCsv() {
    const header = ["Name", "Email", "Audience", "Status"];
    const rows = reviewers.map((reviewer) => [reviewer.name, reviewer.email, reviewer.audience, reviewer.status]);
    const csv = [header, ...rows]
      .map((row) => row.map((value) => escapeCsvValue(value)).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${subjectName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-reviewers.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <button
        type="button"
        onClick={handlePrintReport}
        className="rounded-xl bg-[#0B1F3A] px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#102b50]"
      >
        Print / Save PDF
      </button>
      <button
        type="button"
        onClick={handleDownloadReviewerCsv}
        className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
      >
        Download Reviewer CSV
      </button>
    </div>
  );
}