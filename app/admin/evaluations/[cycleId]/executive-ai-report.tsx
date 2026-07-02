import type { CSSProperties, RefObject } from "react";

export type ExecutiveReportScoreItem = {
  label: string;
  evaluator: string;
  score: number | null;
};

export type ExecutiveReportData = {
  schoolName: string;
  schoolLogoText: string;
  employeeName: string;
  employeeEmail: string;
  employeeInitials: string;
  position: string;
  cycleName: string;
  evaluationDate: string;
  generatedDate: string;
  evaluationType: string;
  responsesReceived: number;
  responsesExpected: number;
  completionPercent: number;
  overallScore: number | null;
  performanceLabel: string;
  evaluatorScores: ExecutiveReportScoreItem[];
  strengths: ExecutiveReportScoreItem[];
  developmentPriorities: ExecutiveReportScoreItem[];
  previousScore: number | null;
  targetScore: number;
};

type Props = {
  data: ExecutiveReportData;
  reviewMarkdown: string;
  reportRef: RefObject<HTMLDivElement | null>;
};

type ReportSection = {
  id: "overview" | "strengths" | "development" | "actionPlan" | "meetingNotes" | "managerFeedback" | "future";
  headings: string[];
};

const reportSections: ReportSection[] = [
  { id: "overview", headings: ["Overall Performance Summary"] },
  { id: "strengths", headings: ["Key Strengths"] },
  { id: "development", headings: ["Development Opportunities"] },
  { id: "managerFeedback", headings: ["Manager Feedback"] },
  { id: "actionPlan", headings: ["Development Action Plan"] },
  { id: "future", headings: ["Future Growth and Potential"] },
  { id: "meetingNotes", headings: ["Meeting Talking Points"] },
];

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

function getSectionContent(markdown: string, sectionId: ReportSection["id"]): string {
  const section = reportSections.find((item) => item.id === sectionId);
  if (!section) {
    return "";
  }

  return section.headings.map((heading) => extractSection(markdown, heading)).filter(Boolean).join("\n\n");
}

function getReadableItems(content: string): string[] {
  return content
    .split(/\n+/)
    .map((line) => line.replace(/^[-*]\s+/, "").replace(/^\d+[.)]\s+/, "").trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"));
}

function clampScore(score: number | null): number {
  return Math.max(0, Math.min(100, score ?? 0));
}

function formatScore(score: number | null): string {
  return score === null ? "N/A" : score.toFixed(1);
}

function truncateWords(value: string, maxWords: number): string {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) {
    return value.trim();
  }

  return `${words.slice(0, maxWords).join(" ")}...`;
}

function splitActions(items: string[]): [string[], string[], string[]] {
  const normalized = items.length > 0 ? items : ["Review the evaluation with the employee.", "Confirm development goals.", "Schedule follow-up coaching."];
  return [normalized.slice(0, 3), normalized.slice(3, 6), normalized.slice(6, 9)];
}

function getInsightCards(data: ExecutiveReportData, reviewMarkdown: string) {
  const development = data.developmentPriorities[0];
  const peerScore = data.evaluatorScores.find((item) => item.label === "Peers")?.score ?? null;
  const parentScore = data.evaluatorScores.find((item) => item.label === "Parents")?.score ?? null;
  const managerFeedback = getReadableItems(getSectionContent(reviewMarkdown, "managerFeedback"))[0];
  const recommendation = getReadableItems(getSectionContent(reviewMarkdown, "actionPlan"))[0];

  let hiddenPattern = "Evaluator patterns will become clearer as more responses are submitted.";
  if (peerScore !== null && parentScore !== null) {
    const gap = Math.abs(peerScore - parentScore).toFixed(1);
    hiddenPattern = parentScore > peerScore
      ? `Parents rate this employee ${gap} points higher than peers.`
      : `Peers rate this employee ${gap} points higher than parents.`;
  }

  return [
    { title: "Biggest Opportunity", icon: "bi-bullseye", text: development ? development.label : "No scored development priority has been identified yet." },
    { title: "Hidden Pattern", icon: "bi-diagram-3", text: hiddenPattern },
    { title: "Potential Cause", icon: "bi-search", text: managerFeedback || "Use manager discussion to confirm the root cause behind the scoring pattern." },
    { title: "Recommendation", icon: "bi-compass", text: recommendation || "Focus the review on one measurable behavior change and one support commitment." },
  ];
}

function MiniTrendChart({ previous, current, target }: { previous: number | null; current: number | null; target: number }) {
  const previousY = 110 - clampScore(previous);
  const currentY = 110 - clampScore(current);
  const targetY = 110 - clampScore(target);

  return (
    <svg className="w-100" viewBox="0 0 280 130" role="img" aria-label="Performance trend line chart">
      <line x1="24" y1="20" x2="24" y2="112" stroke="#d8dee8" />
      <line x1="24" y1="112" x2="260" y2="112" stroke="#d8dee8" />
      <line x1="24" y1={targetY} x2="260" y2={targetY} stroke="#f59e0b" strokeDasharray="5 5" />
      <text x="202" y={targetY - 6} fill="#9a5b00" fontSize="10">Target</text>
      {previous !== null ? <polyline points={`52,${previousY} 150,${currentY} 246,${targetY}`} fill="none" stroke="#0b3a75" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" /> : null}
      {previous !== null ? <circle cx="52" cy={previousY} r="6" fill="#0b3a75" /> : null}
      {current !== null ? <circle cx="150" cy={currentY} r="7" fill="#198754" /> : null}
      <circle cx="246" cy={targetY} r="6" fill="#f59e0b" />
      <text x="34" y="126" fill="#65758b" fontSize="10">Previous</text>
      <text x="132" y="126" fill="#65758b" fontSize="10">Current</text>
      <text x="232" y="126" fill="#65758b" fontSize="10">Target</text>
    </svg>
  );
}

function ScoreBar({ item, tone = "primary" }: { item: ExecutiveReportScoreItem; tone?: "primary" | "success" | "warning" }) {
  const barClass = tone === "success" ? "bg-success" : tone === "warning" ? "bg-warning" : "bg-primary";

  return (
    <div className="mb-3">
      <div className="d-flex justify-content-between gap-3 small mb-1">
        <span className="fw-semibold text-slate-900">{item.label}</span>
        <span className="text-secondary">{formatScore(item.score)}{item.score === null ? "" : "%"}</span>
      </div>
      <div className="progress report-progress" role="progressbar" aria-valuenow={item.score ?? 0} aria-valuemin={0} aria-valuemax={100}>
        <div className={`progress-bar ${barClass}`} style={{ width: `${clampScore(item.score)}%` }} />
      </div>
    </div>
  );
}

export default function ExecutiveAiReport({ data, reviewMarkdown, reportRef }: Props) {
  const overviewItems = getReadableItems(getSectionContent(reviewMarkdown, "overview"));
  const summaryText = truncateWords(overviewItems.join(" ") || "Generate the AI report to populate the executive summary.", 150);
  const actionColumns = splitActions(getReadableItems(getSectionContent(reviewMarkdown, "actionPlan")));
  const meetingItems = getReadableItems(getSectionContent(reviewMarkdown, "meetingNotes"));
  const finalRecommendation = truncateWords(getReadableItems(getSectionContent(reviewMarkdown, "future")).join(" ") || summaryText, 100);
  const insightCards = getInsightCards(data, reviewMarkdown);
  const responseLabel = `${data.responsesReceived} of ${data.responsesExpected}`;
  const circleStyle = { "--value": data.completionPercent } as CSSProperties;

  return (
    <article ref={reportRef} id="executive-ai-report" className="executive-report mx-auto bg-light p-3 p-md-4">
      <style>{`
        .executive-report { max-width: 1200px; color: #102033; }
        .executive-report .report-card { border: 1px solid #dce3ec; border-radius: 12px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); background: #fff; break-inside: avoid; }
        .executive-report .report-kicker { color: #64748b; font-size: .72rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
        .executive-report .report-navy { color: #0b1f3a; }
        .executive-report .report-progress { height: .55rem; background-color: #e9eef5; }
        .executive-report .logo-mark, .executive-report .employee-mark { display: inline-flex; align-items: center; justify-content: center; border-radius: 14px; background: #0b1f3a; color: #fff; font-weight: 700; }
        .executive-report .logo-mark { width: 58px; height: 58px; }
        .executive-report .employee-mark { width: 86px; height: 86px; border-radius: 50%; font-size: 1.35rem; }
        .executive-report .circle-chart { width: 116px; height: 116px; border-radius: 50%; background: conic-gradient(#0b1f3a calc(var(--value) * 1%), #e9eef5 0); display: grid; place-items: center; }
        .executive-report .circle-chart::before { content: ""; width: 78px; height: 78px; border-radius: 50%; background: #fff; position: absolute; }
        .executive-report .circle-chart > span { position: relative; z-index: 1; }
        .executive-report .strength-row { border-left: 4px solid #198754; }
        .executive-report .priority-row { border-left: 4px solid #f59e0b; }
        @media print {
          body * { visibility: hidden !important; }
          #executive-ai-report, #executive-ai-report * { visibility: visible !important; }
          #executive-ai-report { position: absolute; inset: 0; max-width: none; width: 100%; padding: 0 !important; background: #fff !important; }
          .modal, .modal-dialog, .modal-content, .modal-body { position: static !important; display: block !important; overflow: visible !important; height: auto !important; max-height: none !important; }
          .report-card { box-shadow: none !important; break-inside: avoid; page-break-inside: avoid; }
          .report-actions, .modal-header, .modal-footer, .modal-backdrop { display: none !important; }
          @page { size: letter; margin: 0.45in; }
        }
      `}</style>

      <header className="report-card p-4 p-lg-5 mb-4">
        <div className="row g-4 align-items-center">
          <div className="col-lg-7">
            <div className="d-flex align-items-center gap-3 mb-4">
              <div className="logo-mark">{data.schoolLogoText}</div>
              <div>
                <p className="report-kicker mb-1">AI Performance Report</p>
                <h1 className="h3 report-navy mb-0">{data.schoolName}</h1>
              </div>
            </div>
            <div className="d-flex align-items-center gap-4">
              <div className="employee-mark">{data.employeeInitials}</div>
              <div>
                <h2 className="display-6 fw-semibold report-navy mb-1">{data.employeeName}</h2>
                <p className="mb-1 text-secondary">{data.position}</p>
                <span className="badge rounded-pill text-bg-primary">{data.evaluationType}</span>
              </div>
            </div>
          </div>
          <div className="col-lg-5">
            <dl className="row g-3 mb-0">
              <div className="col-6"><dt className="report-kicker">Evaluation Cycle</dt><dd className="fw-semibold mb-0">{data.cycleName}</dd></div>
              <div className="col-6"><dt className="report-kicker">Evaluation Date</dt><dd className="fw-semibold mb-0">{data.evaluationDate}</dd></div>
              <div className="col-6"><dt className="report-kicker">Generated Date</dt><dd className="fw-semibold mb-0">{data.generatedDate}</dd></div>
              <div className="col-6"><dt className="report-kicker">Responses</dt><dd className="fw-semibold mb-0">{responseLabel}</dd></div>
            </dl>
          </div>
        </div>
      </header>

      <section className="row g-4 mb-4" aria-label="Executive KPI Cards">
        <div className="col-md-6 col-xl-3"><article className="report-card h-100 p-4"><p className="report-kicker">Overall Score</p><p className="display-5 fw-bold report-navy mb-1">{formatScore(data.overallScore)} <span className="fs-6 text-secondary">/100</span></p><span className="badge rounded-pill text-bg-light border mb-3">{data.performanceLabel}</span><ScoreBar item={{ label: "Score gauge", evaluator: "Overall", score: data.overallScore }} /></article></div>
        <div className="col-md-6 col-xl-3"><article className="report-card h-100 p-4"><p className="report-kicker">Response Summary</p><div className="d-flex align-items-center justify-content-center my-2"><div className="circle-chart position-relative" style={circleStyle}><span className="fw-bold report-navy">{data.completionPercent}%</span></div></div><p className="text-center fw-semibold mb-0">{responseLabel} received</p></article></div>
        <div className="col-md-6 col-xl-3"><article className="report-card h-100 p-4"><p className="report-kicker">Scores by Evaluator</p>{data.evaluatorScores.map((item) => <ScoreBar key={item.label} item={item} />)}</article></div>
        <div className="col-md-6 col-xl-3"><article className="report-card h-100 p-4"><p className="report-kicker">Performance Trend</p><MiniTrendChart previous={data.previousScore} current={data.overallScore} target={data.targetScore} /></article></div>
      </section>

      <section className="report-card p-4 mb-4 border-primary-subtle" aria-labelledby="executive-summary-title"><p className="report-kicker">Executive Summary</p><h2 id="executive-summary-title" className="h4 report-navy mb-3">AI Summary</h2><p className="lead fs-6 mb-0">{summaryText}</p></section>

      <section className="report-card p-4 mb-4" aria-labelledby="strengths-title">
        <div className="d-flex align-items-center gap-2 mb-3"><i className="bi bi-stars text-success fs-4" aria-hidden="true" /><h2 id="strengths-title" className="h4 report-navy mb-0">Strengths</h2></div>
        <div className="row g-3">{data.strengths.slice(0, 6).map((item) => <div className="col-md-6" key={`${item.evaluator}-${item.label}`}><div className="strength-row bg-success-subtle rounded-3 p-3 h-100"><div className="d-flex justify-content-between gap-3"><div><p className="fw-semibold mb-1">{item.label}</p><p className="small text-secondary mb-0">{item.evaluator}</p></div><span className="badge text-bg-success align-self-start">{formatScore(item.score)}</span></div></div></div>)}</div>
      </section>

      <section className="report-card p-4 mb-4" aria-labelledby="development-title">
        <div className="d-flex align-items-center gap-2 mb-3"><i className="bi bi-exclamation-diamond text-warning fs-4" aria-hidden="true" /><h2 id="development-title" className="h4 report-navy mb-0">Development Priorities</h2></div>
        <div className="row g-3">{data.developmentPriorities.slice(0, 6).map((item, index) => <div className="col-md-6" key={`${item.evaluator}-${item.label}`}><div className="priority-row bg-warning-subtle rounded-3 p-3 h-100"><div className="d-flex gap-3"><span className="badge rounded-pill text-bg-warning align-self-start">{index + 1}</span><div className="flex-grow-1"><p className="fw-semibold mb-1">{item.label}</p><p className="small text-secondary mb-0">{item.evaluator} | Score {formatScore(item.score)}</p></div></div></div></div>)}</div>
      </section>

      <section className="row g-4 mb-4" aria-label="AI Insights">{insightCards.map((insight) => <div className="col-md-6 col-xl-3" key={insight.title}><article className="report-card h-100 p-4"><i className={`bi ${insight.icon} text-primary fs-3`} aria-hidden="true" /><h2 className="h6 report-navy mt-3">{insight.title}</h2><p className="small text-secondary mb-0">{truncateWords(insight.text, 28)}</p></article></div>)}</section>

      <section className="report-card p-4 mb-4" aria-labelledby="action-plan-title">
        <h2 id="action-plan-title" className="h4 report-navy mb-3">Action Plan</h2>
        <div className="row g-4">{["Immediate Priorities (Next 30 Days)", "Short-Term Goals (Next 90 Days)", "Ongoing Development"].map((title, columnIndex) => <div className="col-lg-4" key={title}><div className="border rounded-3 p-3 h-100"><h3 className="h6 report-navy">{title}</h3><ul className="list-unstyled mb-0">{actionColumns[columnIndex].map((action, index) => <li className="d-flex gap-2 py-2 border-bottom" key={`${title}-${index}`}><i className="bi bi-check2-square text-primary" aria-hidden="true" /><span className="small">{action}<br /><span className="text-secondary">Owner: Manager | Target: Review cycle</span></span></li>)}</ul></div></div>)}</div>
      </section>

      <section className="report-card p-4 mb-4" aria-labelledby="meeting-guide-title"><h2 id="meeting-guide-title" className="h4 report-navy mb-3">Meeting Guide</h2><div className="row g-4"><div className="col-md-3"><p className="report-kicker">Estimated Duration</p><p className="h5 report-navy">45 minutes</p></div><div className="col-md-9"><div className="row g-3">{["Discussion Topics", "Questions for the Manager", "Conversation Starters"].map((title, index) => <div className="col-lg-4" key={title}><h3 className="h6 report-navy">{title}</h3><ul className="small mb-0 ps-3">{(meetingItems.length > 0 ? meetingItems : ["Discuss score patterns.", "Explore support needs.", "Review action plan."]).slice(index * 2, index * 2 + 2).map((item) => <li key={item}>{item}</li>)}</ul></div>)}</div></div></div></section>

      <section className="report-card p-4 mb-4" aria-labelledby="agreement-title"><h2 id="agreement-title" className="h4 report-navy mb-3">Agreement Section</h2><div className="row g-4 align-items-end"><div className="col-md-4"><div className="border-bottom pb-4" /><p className="small text-secondary mt-2 mb-0">Employee Signature</p></div><div className="col-md-4"><div className="border-bottom pb-4" /><p className="small text-secondary mt-2 mb-0">Manager Signature</p></div><div className="col-md-4"><div className="border-bottom pb-4" /><p className="small text-secondary mt-2 mb-0">Date</p></div></div><div className="d-flex flex-wrap gap-4 mt-4 small">{["Feedback reviewed", "Goals agreed", "Action plan approved"].map((label) => <label className="d-flex align-items-center gap-2" key={label}><input type="checkbox" /> {label}</label>)}</div></section>

      <section className="report-card p-4 border-primary-subtle" aria-labelledby="final-recommendation-title"><p className="report-kicker">Final Recommendation</p><h2 id="final-recommendation-title" className="h4 report-navy mb-3">Growth Recommendation</h2><p className="mb-0">{finalRecommendation}</p></section>
    </article>
  );
}
