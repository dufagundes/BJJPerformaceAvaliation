import { describe, expect, it, vi, beforeEach } from "vitest";
import { calculateScore } from "./scoreCalculator";

const { findManyMock } = vi.hoisted(() => {
  return {
    findManyMock: vi.fn(),
  };
});

vi.mock("./prisma", () => {
  return {
    prisma: {
      reviewer: {
        findMany: findManyMock,
      },
    },
  };
});

describe("calculateScore", () => {
  beforeEach(() => {
    findManyMock.mockReset();
  });

  it("calculates weighted score with all evaluator groups present", async () => {
    findManyMock.mockResolvedValue([
      {
        answers: {
          communication: 5,
          punctualityAndPreparation: 4,
          teachingEffectiveness: 5,
          conflictHandling: 4,
          professionalism: 5,
          observedStrength: "Clear communication with parents",
          improvementArea: "Needs tighter class transitions",
        },
        type: "PEER",
        response: {
          answers: {
            communication: 5,
            punctualityAndPreparation: 4,
            teachingEffectiveness: 5,
            conflictHandling: 4,
            professionalism: 5,
            observedStrength: "Clear communication with parents",
            improvementArea: "Needs tighter class transitions",
          },
        },
      },
      {
        type: "PARENT_STUDENT",
        response: {
          answers: {
          communication: 3,
          punctualityAndPreparation: 3,
          teachingEffectiveness: 4,
          conflictHandling: 3,
          professionalism: 3,
          observedStrength: "Students enjoy classes",
          improvementArea: "Needs more punctual starts",
        },
        },
      },
    ]);

    const result = await calculateScore("staff-1", "cycle-1");

    expect(findManyMock).toHaveBeenCalledWith({
      where: {
        cycleId: "cycle-1",
        status: "COMPLETED",
        cycle: {
          subjectId: "staff-1",
        },
        response: {
          isNot: null,
        },
      },
      select: {
        type: true,
        response: {
          select: {
            answers: true,
          },
        },
      },
    });

    expect(result.weightedScore).toBe(3.9);
    expect(result.strengths).toEqual([
      "Clear communication with parents",
      "Students enjoy classes",
    ]);
    expect(result.weaknesses).toEqual([
      "Needs tighter class transitions",
      "Needs more punctual starts",
    ]);
  });

  it("redistributes missing parent-student weight proportionally to available groups", async () => {
    findManyMock.mockResolvedValue([
      {
        type: "PEER",
        response: {
          answers: {
          communication: 5,
          punctualityAndPreparation: 5,
          teachingEffectiveness: 4,
          conflictHandling: 4,
          professionalism: 4,
          observedStrength: "Sets a strong professional tone",
          improvementArea: "Could provide more individual corrections",
        },
        },
      },
    ]);

    const result = await calculateScore("staff-2", "cycle-2");

    expect(result.weightedScore).toBe(4.4);
    expect(result.strengths).toEqual([
      "Sets a strong professional tone",
    ]);
    expect(result.weaknesses).toEqual([
      "Could provide more individual corrections",
    ]);
  });

  it("returns zero score when there are no valid submitted forms", async () => {
    findManyMock.mockResolvedValue([
      {
        type: "PEER",
        response: {
          answers: {
          communication: 5,
          punctualityAndPreparation: 4,
          teachingEffectiveness: null,
          conflictHandling: 4,
          professionalism: 5,
          observedStrength: "Strong rapport",
          improvementArea: "Needs clearer demos",
        },
        },
      },
    ]);

    const result = await calculateScore("staff-3", "cycle-3");

    expect(result.weightedScore).toBe(0);
    expect(result.strengths).toEqual([]);
    expect(result.weaknesses).toEqual([]);
  });
});
