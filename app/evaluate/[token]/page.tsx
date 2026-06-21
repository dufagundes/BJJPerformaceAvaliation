import EvaluationFormClient from "./evaluation-form-client";

export default async function EvaluatePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <EvaluationFormClient token={token} />;
}
