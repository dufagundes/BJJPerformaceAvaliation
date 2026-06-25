import { ReactNode } from "react";

export default function EvaluateLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Minimal header with just logo/branding - no main app navigation */}
      <div className="border-b border-slate-200 bg-white px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-lg font-semibold text-slate-900">Staff Evaluation</h1>
          <p className="text-xs text-slate-500">Secure evaluation link</p>
        </div>
      </div>

      {/* Main content - children pages render here */}
      <div className="px-4 py-8 sm:px-6 sm:py-12">{children}</div>
    </div>
  );
}
