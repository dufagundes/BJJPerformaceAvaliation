import { beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const { isAdminApiRequestAuthorizedMock, findUniqueMock, calculateCycleScorecardMock } = vi.hoisted(() => {
  return {
    isAdminApiRequestAuthorizedMock: vi.fn(),
    findUniqueMock: vi.fn(),
    calculateCycleScorecardMock: vi.fn(),
  };
});

vi.mock("../../../../../lib/adminAuth", () => {
  return {
    isAdminApiRequestAuthorized: isAdminApiRequestAuthorizedMock,
    unauthorizedAdminResponse: () => new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
  };
});

vi.mock("../../../../../lib/prisma", () => {
  return {
    prisma: {
      evaluationCycle: {
        findUnique: findUniqueMock,
      },
    },
  };
});

vi.mock("../../../../../lib/weightedScorecard", () => {
  return {
    calculateCycleScorecard: calculateCycleScorecardMock,
  };
});

describe("POST /api/admin/progress/generate-report", () => {
  beforeEach(() => {
    isAdminApiRequestAuthorizedMock.mockReset();
    findUniqueMock.mockReset();
    calculateCycleScorecardMock.mockReset();

    isAdminApiRequestAuthorizedMock.mockResolvedValue(true);
  });

  it("blocks report generation when only one evaluator group has submitted", async () => {
    findUniqueMock.mockResolvedValue({
      id: "cycle-1",
      subjectId: "staff-1",
      reviewers: [
        { type: "PARENT_STUDENT", status: "COMPLETED" },
        { type: "PARENT_STUDENT", status: "PENDING" },
        { type: "PEER", status: "PENDING" },
      ],
    });

    const request = new Request("http://localhost/api/admin/progress/generate-report", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        cycleId: "cycle-1",
        staffMemberId: "staff-1",
      }),
    });

    const response = await POST(request);
    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(409);
    expect(payload.error).toContain("locked");
    expect(calculateCycleScorecardMock).not.toHaveBeenCalled();
  });
});
