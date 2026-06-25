export default function EvaluationProgress({
  currentQuestion,
  totalQuestions,
}: {
  currentQuestion: number;
  totalQuestions: number;
}) {
  const progressPercent = (currentQuestion / totalQuestions) * 100;

  return (
    <div className="mb-8 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-900">
          Question {currentQuestion} of {totalQuestions}
        </p>
        <p className="text-xs text-slate-500">{Math.round(progressPercent)}% complete</p>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full w-full bg-slate-900 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}
