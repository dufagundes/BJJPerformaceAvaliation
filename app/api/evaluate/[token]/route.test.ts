import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, POST } from "./route";

const { findUniqueMock, getEvaluationFormQuestionsMock } = vi.hoisted(() => {
  return {
    findUniqueMock: vi.fn(),
    getEvaluationFormQuestionsMock: vi.fn(),
  };
});

vi.mock("../../../../lib/prisma", () => {
  return {
    prisma: {
      reviewer: {
        findUnique: findUniqueMock,
      },
    },
  };
});

vi.mock("../../../../lib/evaluationFormQuestions", () => {
  return {
    getEvaluationFormQuestions: getEvaluationFormQuestionsMock,
  };
});

describe("/api/evaluate/[token] token behavior", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    getEvaluationFormQuestionsMock.mockReset();
  });

  it("GET returns 410 when cycle deadline has passed", async () => {
    findUniqueMock.mockResolvedValue({
      id: "reviewer-1",
      type: "PARENT_STUDENT",
      status: "PENDING",
      tokenExpiresAt: new Date("2099-01-01T00:00:00.000Z"),
      cycle: {
        deadline: new Date("2020-01-01T00:00:00.000Z"),
        subject: {
          name: "Head Instructor",
          staffProfile: {
            title: "Head Instructor",
          },
        },
      },
    });

    const response = await GET(new Request("http://localhost/api/evaluate/token-1"), {
      params: Promise.resolve({ token: "token-1" }),
    });

    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(410);
    expect(payload.error).toBe("This evaluation link has expired.");
    expect(getEvaluationFormQuestionsMock).not.toHaveBeenCalled();
  });

  it("POST returns 410 when cycle deadline has passed", async () => {
    findUniqueMock.mockResolvedValue({
      id: "reviewer-1",
      type: "PEER",
      status: "PENDING",
      cycleId: "cycle-1",
      tokenExpiresAt: new Date("2099-01-01T00:00:00.000Z"),
      cycle: {
        deadline: new Date("2020-01-01T00:00:00.000Z"),
        subject: {
          staffProfile: {
            title: "Head Instructor",
          },
        },
      },
    });

    const response = await POST(
      new Request("http://localhost/api/evaluate/token-1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers: { q1: 75 } }),
      }),
      {
        params: Promise.resolve({ token: "token-1" }),
      },
    );

    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(410);
    expect(payload.error).toBe("This evaluation link has expired.");
    expect(getEvaluationFormQuestionsMock).not.toHaveBeenCalled();
  });

  it("GET returns 409 after submission (no form or answers can be retrieved)", async () => {
    findUniqueMock.mockResolvedValue({
      id: "reviewer-1",
      type: "PEER",
      status: "COMPLETED",
      tokenExpiresAt: new Date("2099-01-01T00:00:00.000Z"),
      cycle: {
        deadline: new Date("2099-01-01T00:00:00.000Z"),
        subject: {
          name: "Head Instructor",
          staffProfile: {
            title: "Head Instructor",
          },
        },
      },
    });

    const response = await GET(new Request("http://localhost/api/evaluate/token-1"), {
      params: Promise.resolve({ token: "token-1" }),
    });

    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(409);
    expect(payload.error).toBe(
      "This evaluation has already been submitted. Thank you for your participation.",
    );
    expect(getEvaluationFormQuestionsMock).not.toHaveBeenCalled();
  });

  it("POST returns 409 for re-submit attempts", async () => {
    findUniqueMock.mockResolvedValue({
      id: "reviewer-1",
      type: "PARENT_STUDENT",
      status: "COMPLETED",
      cycleId: "cycle-1",
      tokenExpiresAt: new Date("2099-01-01T00:00:00.000Z"),
      cycle: {
        deadline: new Date("2099-01-01T00:00:00.000Z"),
        subject: {
          staffProfile: {
            title: "Head Instructor",
          },
        },
      },
    });

    const response = await POST(
      new Request("http://localhost/api/evaluate/token-1", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ answers: { q1: 75 } }),
      }),
      {
        params: Promise.resolve({ token: "token-1" }),
      },
    );

    const payload = (await response.json()) as { error?: string };

    expect(response.status).toBe(409);
    expect(payload.error).toBe(
      "This evaluation has already been submitted. Thank you for your participation.",
    );
    expect(getEvaluationFormQuestionsMock).not.toHaveBeenCalled();
  });
});
