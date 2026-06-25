import { beforeEach, describe, expect, it, vi } from "vitest";
import { calculateCycleScorecard } from "./weightedScorecard";

const { findUniqueMock, getScorecardWeightsMock } = vi.hoisted(() => {
  return {
    findUniqueMock: vi.fn(),
    getScorecardWeightsMock: vi.fn(),
  };
});

vi.mock("./prisma", () => {
  return {
    prisma: {
      evaluationCycle: {
        findUnique: findUniqueMock,
      },
    },
  };
});

vi.mock("./scorecardWeights", () => {
  return {
    getScorecardWeights: getScorecardWeightsMock,
  };
});

describe("calculateCycleScorecard", () => {
  beforeEach(() => {
    findUniqueMock.mockReset();
    getScorecardWeightsMock.mockReset();
  });

  it("applies fixed 70/30 weighting when both groups have responses", async () => {
    getScorecardWeightsMock.mockResolvedValue({
      groups: [
        { id: "g-parent", name: "PARENT_STUDENT", weight: 0.7 },
        { id: "g-peer", name: "PEER", weight: 0.3 },
      ],
      sessions: [
        {
          id: "s-parent",
          name: "Parents Session",
          audienceType: "PARENT_STUDENT",
          weight: 1,
          factors: [
            { id: "p1", questionText: "Q1", order: 1, weight: 0.5 },
            { id: "p2", questionText: "Q2", order: 2, weight: 0.5 },
          ],
        },
        {
          id: "s-peer",
          name: "Peers Session",
          audienceType: "PEER",
          weight: 1,
          factors: [
            { id: "r1", questionText: "Q1", order: 1, weight: 0.5 },
            { id: "r2", questionText: "Q2", order: 2, weight: 0.5 },
          ],
        },
      ],
    });

    findUniqueMock.mockResolvedValue({
      id: "cycle-1",
      subject: { name: "Head Instructor" },
      reviewers: [
        {
          id: "parent-1",
          type: "PARENT_STUDENT",
          status: "COMPLETED",
          response: { answers: { q1: 100, q2: 60 } },
        },
        {
          id: "peer-1",
          type: "PEER",
          status: "COMPLETED",
          response: { answers: { q1: 40, q2: 60 } },
        },
      ],
    });

    const result = await calculateCycleScorecard("cycle-1");

    expect(result.finalScore).toBe(71);
  });

  it("does not redistribute missing group weight", async () => {
    getScorecardWeightsMock.mockResolvedValue({
      groups: [
        { id: "g-parent", name: "PARENT_STUDENT", weight: 0.7 },
        { id: "g-peer", name: "PEER", weight: 0.3 },
      ],
      sessions: [
        {
          id: "s-parent",
          name: "Parents Session",
          audienceType: "PARENT_STUDENT",
          weight: 1,
          factors: [{ id: "p1", questionText: "Q1", order: 1, weight: 1 }],
        },
        {
          id: "s-peer",
          name: "Peers Session",
          audienceType: "PEER",
          weight: 1,
          factors: [{ id: "r1", questionText: "Q1", order: 1, weight: 1 }],
        },
      ],
    });

    findUniqueMock.mockResolvedValue({
      id: "cycle-2",
      subject: { name: "Head Instructor" },
      reviewers: [
        {
          id: "parent-1",
          type: "PARENT_STUDENT",
          status: "COMPLETED",
          response: { answers: { q1: 80 } },
        },
      ],
    });

    const result = await calculateCycleScorecard("cycle-2");

    expect(result.finalScore).toBe(56);
    expect(result.notes).toContain("No responses received from Peers.");
  });

  it("includes stored open-ended strengths and improvements in qualitative feedback", async () => {
    getScorecardWeightsMock.mockResolvedValue({
      groups: [
        { id: "g-parent", name: "PARENT_STUDENT", weight: 0.7 },
        { id: "g-peer", name: "PEER", weight: 0.3 },
      ],
      sessions: [
        {
          id: "s-peer",
          name: "Peers Session",
          audienceType: "PEER",
          weight: 1,
          factors: [{ id: "r1", questionText: "Q1", order: 1, weight: 1 }],
        },
      ],
    });

    findUniqueMock.mockResolvedValue({
      id: "cycle-3",
      subject: { name: "Head Instructor" },
      reviewers: [
        {
          id: "peer-1",
          type: "PEER",
          status: "COMPLETED",
          response: {
            answers: { q1: 90 },
            strengths_text: "Creates a positive class culture.",
            improvements_text: "Could give more individual corrections.",
          },
        },
      ],
    });

    const result = await calculateCycleScorecard("cycle-3");

    expect(result.qualitativeFeedback).toEqual([
      { text: "Creates a positive class culture.", audience: "anonymous", category: "strength" },
      { text: "Could give more individual corrections.", audience: "anonymous", category: "improvement" },
    ]);
  });
});
