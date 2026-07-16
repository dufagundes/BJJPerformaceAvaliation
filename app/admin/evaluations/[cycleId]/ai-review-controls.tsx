"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ExecutiveAiReport from "./executive-ai-report";
import type { ExecutiveReportData } from "./executive-ai-report";

type Props = {
  cycleId: string;
  subjectName: string;
  reportData: ExecutiveReportData;
};

type ApiSuccess = {
  reviewMarkdown: string;
  appendixMarkdown?: string;
};

type ApiError = {
  error?: string;
};

type SavedReviewPayload = {
  reviewMarkdown: string;
  appendixMarkdown?: string;
  savedAt: string;
};

type ReportTab = {
  id: "overview" | "strengths" | "development" | "actionPlan" | "meetingNotes";
  label: string;
  icon: string;
  headings: string[];
};

const tabs: ReportTab[] = [
  {
    id: "overview",
    label: "Overview",
    icon: "bi-speedometer2",
    headings: ["Overall Performance Summary", "Manager Feedback", "Future Growth and Potential"],
  },
  { id: "strengths", label: "Strengths", icon: "bi-stars", headings: ["Key Strengths"] },
  { id: "development", label: "Development", icon: "bi-graph-up-arrow", headings: ["Development Opportunities"] },
  { id: "actionPlan", label: "Action Plan", icon: "bi-list-check", headings: ["Development Action Plan"] },
  { id: "meetingNotes", label: "Meeting Notes", icon: "bi-chat-square-text", headings: ["Meeting Talking Points"] },
];

function isUnavailableFallback(value: string): boolean {
  return value.includes("AI feedback is currently unavailable");
}

function sectionPattern(heading: string): RegExp {
  return new RegExp(`^#{1,3}\\s+${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`, "im");
}

function extractSection(markdown: string, heading: string): string {
  const match = markdown.match(sectionPattern(heading));
  if (!match || match.index === undefined) {
    return "";
  }

  const start = match.index + match[0].length;
  const rest = markdown.slice(start);
  const nextHeading = rest.search(/^#{1,3}\s+/m);
  return (nextHeading >= 0 ? rest.slice(0, nextHeading) : rest).trim();
}

function getTabContent(markdown: string, tab: ReportTab): string {
  return tab.headings.map((heading) => extractSection(markdown, heading)).filter(Boolean).join("\n\n");
}

function getReadableItems(content: string): string[] {
  return content
    .split(/\n+/)
    .map((line) => line.replace(/^[-*]\s+/, "").replace(/^\d+[.)]\s+/, "").trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

function getSummary(content: string): string {
  const firstItem = getReadableItems(content)[0];
  if (!firstItem) {
    return "Generate the AI report to populate this section.";
  }

  return firstItem.length > 220 ? `${firstItem.slice(0, 217)}...` : firstItem;
}

function getConfidenceLevel(reviewMarkdown: string): { label: string; percent: number; tone: string } {
  if (!reviewMarkdown) {
    return { label: "Pending", percent: 0, tone: "bg-secondary" };
  }

  const populatedSections = tabs.filter((tab) => getTabContent(reviewMarkdown, tab).length > 0).length;
  const percent = Math.round((populatedSections / tabs.length) * 100);
  if (percent >= 80) {
    return { label: "High", percent, tone: "bg-success" };
  }

  if (percent >= 50) {
    return { label: "Medium", percent, tone: "bg-warning" };
  }

  return { label: "Low", percent, tone: "bg-danger" };
}

function getProgressWidthClass(percent: number): string {
  if (percent >= 100) {
    return "w-100";
  }

  if (percent >= 75) {
    return "w-75";
  }

  if (percent >= 50) {
    return "w-50";
  }

  if (percent >= 25) {
    return "w-25";
  }

  return "invisible";
}

function toFileName(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "ai-performance-report";
}

async function downloadReportPdf(
  title: string,
  reportElement: HTMLElement | null,
  onError: (message: string) => void,
) {
  if (!reportElement) {
    return;
  }

  try {
    const html2pdf = (await import("html2pdf.js")).default;
    await html2pdf()
      .set({
        margin: 0.35,
        filename: `${toFileName(title)}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#f8f9fa" },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
        pagebreak: { mode: ["avoid-all", "css", "legacy"], avoid: [".report-card"] },
      })
      .from(reportElement)
      .save();
  } catch {
    onError("Unable to download the PDF report from this browser.");
  }
}

export default function AiReviewControls({ cycleId, subjectName, reportData }: Props) {
  const [activeTab, setActiveTab] = useState<ReportTab["id"]>("overview");
  const [isGenerating, setIsGenerating] = useState(false);
  const [reviewMarkdown, setReviewMarkdown] = useState("");
  const [appendixMarkdown, setAppendixMarkdown] = useState("");
  const [error, setError] = useState("");
  const [savedAt, setSavedAt] = useState("");
  const [showFullReport, setShowFullReport] = useState(false);
  const reportRef = useRef<HTMLDivElement | null>(null);

  const storageKey = useMemo(() => `ai-review:${cycleId}`, [cycleId]);
  const activeTabConfig = tabs.find((tab) => tab.id === activeTab) ?? tabs[0];
  const activeContent = getTabContent(reviewMarkdown, activeTabConfig);
  const activeItems = getReadableItems(activeContent);
  const confidence = getConfidenceLevel(reviewMarkdown);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        return;
      }

      const saved = JSON.parse(raw) as Partial<SavedReviewPayload>;
      if (
        typeof saved.reviewMarkdown === "string" &&
        saved.reviewMarkdown.trim().length > 0 &&
        !isUnavailableFallback(saved.reviewMarkdown)
      ) {
        setReviewMarkdown(saved.reviewMarkdown);
      }
      if (typeof saved.appendixMarkdown === "string") {
        setAppendixMarkdown(saved.appendixMarkdown);
      }
      if (typeof saved.savedAt === "string") {
        setSavedAt(saved.savedAt);
      }
    } catch {
      setError("Saved AI evaluation could not be loaded.");
    }
  }, [storageKey]);

  function saveReview(markdown: string, appendix?: string) {
    const payload: SavedReviewPayload = {
      reviewMarkdown: markdown,
      appendixMarkdown: appendix,
      savedAt: new Date().toISOString(),
    };

    window.localStorage.setItem(storageKey, JSON.stringify(payload));
    setSavedAt(payload.savedAt);
  }

  async function handleGenerate() {
    setIsGenerating(true);
    setError("");

    try {
      const response = await fetch(`/api/admin/evaluations/${cycleId}/ai-feedback`, {
        method: "POST",
      });

      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as ApiError;
        throw new Error(payload.error ?? "Unable to generate AI evaluation.");
      }

      const payload = (await response.json()) as ApiSuccess;
      setReviewMarkdown(payload.reviewMarkdown);
      if (payload.appendixMarkdown) {
        setAppendixMarkdown(payload.appendixMarkdown);
      }
      saveReview(payload.reviewMarkdown, payload.appendixMarkdown);
      setActiveTab("overview");
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : "Unable to generate AI evaluation.";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleLoadSaved() {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (!raw) {
        setError("No saved AI evaluation found for this evaluation cycle.");
        return;
      }

      const saved = JSON.parse(raw) as Partial<SavedReviewPayload>;
      if (
        typeof saved.reviewMarkdown !== "string" ||
        saved.reviewMarkdown.trim().length === 0 ||
        isUnavailableFallback(saved.reviewMarkdown)
      ) {
        setError("Saved AI evaluation is invalid. Please generate a new one.");
        return;
      }

      setReviewMarkdown(saved.reviewMarkdown);
      if (typeof saved.appendixMarkdown === "string") {
        setAppendixMarkdown(saved.appendixMarkdown);
      }
      setSavedAt(typeof saved.savedAt === "string" ? saved.savedAt : "");
      setError("");
    } catch {
      setError("Saved AI evaluation could not be loaded.");
    }
  }

  async function handleShareReport() {
    if (!reviewMarkdown) {
      return;
    }

    const fullReport = appendixMarkdown ? `${reviewMarkdown}\n\n${appendixMarkdown}` : reviewMarkdown;

    try {
      if (navigator.share) {
        await navigator.share({ title: `${subjectName} AI Performance Report`, text: fullReport });
        return;
      }

      await navigator.clipboard.writeText(fullReport);
      setError("");
    } catch {
      setError("Unable to share the report from this browser.");
    }
  }

  function handleClearSaved() {
    window.localStorage.removeItem(storageKey);
    setSavedAt("");
    setError("");
  }

  function handleDownloadPdf() {
    setShowFullReport(true);
    window.setTimeout(() => {
      void downloadReportPdf(`${subjectName} AI Performance Report`, reportRef.current, setError);
    }, 0);
  }

  function handlePrintReport() {
    setShowFullReport(true);
    window.setTimeout(() => window.print(), 0);
  }

  return (
    <>
      <section id="ai-review-assistant" className="card border-0 shadow-sm">
        <div className="card-header bg-white">
          <div className="d-flex align-items-start justify-content-between gap-3">
            <div>
              <h2 className="h5 mb-1 text-primary-emphasis">
                <i className="bi bi-stars me-2" aria-hidden="true" />
                AI Summary
              </h2>
              <p className="mb-0 small text-secondary">Summarized for quick manager decisions.</p>
            </div>
            <span className="badge rounded-pill text-bg-light border">{confidence.label}</span>
          </div>
        </div>

        <div className="card-body">
          <div className="d-grid gap-2 mb-3">
            <button type="button" className="btn btn-primary" onClick={handleGenerate} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                  Generating
                </>
              ) : (
                <>
                  <i className="bi bi-magic me-2" aria-hidden="true" />
                  Generate AI
                </>
              )}
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => setShowFullReport(true)} disabled={!reviewMarkdown}>
              <i className="bi bi-file-earmark-text me-2" aria-hidden="true" />
              View Full Report
            </button>
          </div>

          <div className="mb-3">
            <div className="d-flex justify-content-between small text-secondary mb-1">
              <span>Confidence Level</span>
              <span>{confidence.percent}%</span>
            </div>
            <div className="progress" role="progressbar" aria-label="AI report confidence" aria-valuenow={confidence.percent} aria-valuemin={0} aria-valuemax={100}>
              <div className={`progress-bar ${confidence.tone} ${getProgressWidthClass(confidence.percent)}`} />
            </div>
          </div>

          {savedAt ? <p className="small text-secondary">Saved on this device: {new Date(savedAt).toLocaleString()}</p> : null}
          {error ? <div className="alert alert-danger py-2 small" role="alert">{error}</div> : null}

          <ul className="nav nav-tabs flex-nowrap overflow-auto" role="tablist">
            {tabs.map((tab) => (
              <li className="nav-item" role="presentation" key={tab.id}>
                <button
                  type="button"
                  className={`nav-link text-nowrap ${activeTab === tab.id ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <i className={`bi ${tab.icon} me-2`} aria-hidden="true" />
                  {tab.label}
                </button>
              </li>
            ))}
          </ul>

          <div className="border border-top-0 rounded-bottom p-3">
            <article className="card bg-light border-0 mb-3">
              <div className="card-body p-3">
                <p className="text-uppercase small fw-semibold text-secondary mb-1">Summary</p>
                <p className="mb-0 small">{getSummary(activeContent)}</p>
              </div>
            </article>

            {activeItems.length > 0 ? (
              <div className="row g-2">
                {activeItems.slice(0, 4).map((item, index) => (
                  <div className="col-12" key={`${activeTab}-${index}`}>
                    <article className="card h-100">
                      <div className="card-body p-3">
                        <div className="d-flex gap-2">
                          <span className="badge rounded-pill text-bg-primary align-self-start">{index + 1}</span>
                          <p className="mb-0 small">{item}</p>
                        </div>
                      </div>
                    </article>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <i className="bi bi-file-earmark-plus display-6 text-secondary" aria-hidden="true" />
                <p className="mt-2 mb-0 small text-secondary">Generate the AI report to populate these tabs.</p>
              </div>
            )}

            {activeItems.length > 4 ? (
              <details className="mt-3">
                <summary className="btn btn-sm btn-outline-secondary">Show additional details</summary>
                <div className="mt-2 list-group">
                  {activeItems.slice(4).map((item, index) => (
                    <div className="list-group-item small" key={`${activeTab}-extra-${index}`}>{item}</div>
                  ))}
                </div>
              </details>
            ) : null}
          </div>
        </div>
      </section>

      <section className="card border-0 shadow-sm">
        <div className="card-header bg-white">
          <h2 className="h5 mb-1 text-primary-emphasis">
            <i className="bi bi-briefcase me-2" aria-hidden="true" />
            Manager Tools
          </h2>
          <p className="mb-0 small text-secondary">Meeting actions stay available while the evaluation details scroll.</p>
        </div>
        <div className="card-body">
          <div className="list-group mb-3">
            <button type="button" className="list-group-item list-group-item-action d-flex align-items-center justify-content-between" onClick={() => setActiveTab("meetingNotes")}>
              <span><i className="bi bi-chat-dots me-2" aria-hidden="true" />Meeting Talking Points</span>
              <i className="bi bi-chevron-right" aria-hidden="true" />
            </button>
            <button type="button" className="list-group-item list-group-item-action d-flex align-items-center justify-content-between" onClick={() => setActiveTab("actionPlan")}>
              <span><i className="bi bi-clipboard-check me-2" aria-hidden="true" />Action Plan</span>
              <i className="bi bi-chevron-right" aria-hidden="true" />
            </button>
          </div>

          <div className="d-grid gap-2">
            <button type="button" className="btn btn-outline-primary" onClick={handleDownloadPdf} disabled={!reviewMarkdown}>
              <i className="bi bi-download me-2" aria-hidden="true" />
              Download PDF
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={() => void handleShareReport()} disabled={!reviewMarkdown}>
              <i className="bi bi-share me-2" aria-hidden="true" />
              Share Report
            </button>
            <button type="button" className="btn btn-outline-secondary" onClick={handlePrintReport} disabled={!reviewMarkdown}>
              <i className="bi bi-printer me-2" aria-hidden="true" />
              Print Report
            </button>
            <button type="button" className="btn btn-link text-secondary" onClick={handleLoadSaved}>
              Load saved report
            </button>
            <button type="button" className="btn btn-link text-danger" onClick={handleClearSaved}>
              Clear saved report
            </button>
          </div>
        </div>
      </section>

      {showFullReport ? (
        <>
          <div className="modal fade show d-block" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="full-ai-report-title">
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h2 id="full-ai-report-title" className="modal-title h5">Full AI Report</h2>
                  <button type="button" className="btn-close" aria-label="Close" onClick={() => setShowFullReport(false)} />
                </div>
                <div className="modal-body bg-light p-0">
                  <ExecutiveAiReport data={reportData} reviewMarkdown={reviewMarkdown} reportRef={reportRef} />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-outline-secondary" onClick={() => setShowFullReport(false)}>Close</button>
                  <button type="button" className="btn btn-outline-secondary" onClick={handlePrintReport}>
                    <i className="bi bi-printer me-2" aria-hidden="true" />
                    Print Report
                  </button>
                  <button type="button" className="btn btn-primary" onClick={handleDownloadPdf}>
                    <i className="bi bi-download me-2" aria-hidden="true" />
                    Download PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" />
        </>
      ) : null}
    </>
  );
}