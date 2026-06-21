import { NextResponse } from "next/server";
import { isAdminApiRequestAuthorized, unauthorizedAdminResponse } from "../../../../../lib/adminAuth";

export async function POST(request: Request) {
  if (!(await isAdminApiRequestAuthorized(request))) {
    return unauthorizedAdminResponse();
  }

  return NextResponse.json(
    {
      error: "Legacy /api/admin/evaluators/send-requests endpoint is deprecated. Use /api/admin/evaluations/start.",
    },
    { status: 410 },
  );
}
