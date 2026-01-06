"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { Phase } from "@prisma/client";

const totalPossibleScore = 48;

function scoreBand(percent: number) {
  if (percent < 50) {
    return "Developing";
  }
  if (percent < 75) {
    return "On Track";
  }
  return "Thriving";
}

export async function createEvaluation(formData: FormData) {
  const studentId = String(formData.get("studentId") ?? "");
  const evaluator = String(formData.get("evaluator") ?? "").trim();
  const phase = String(formData.get("phase") ?? "");
  const evaluatedAt = String(formData.get("evaluatedAt") ?? "");
  const notes = String(formData.get("notes") ?? "").trim();

  if (!studentId || !evaluator || !phase || !evaluatedAt) {
    return;
  }

  const criteria = await prisma.criterion.findMany({
    where: { phase: phase as Phase },
    orderBy: { displayOrder: "asc" }
  });

  const items = criteria.map((criterion) => {
    const scoreValue = Number(formData.get(`score_${criterion.id}`));
    const score = Number.isNaN(scoreValue) ? 1 : Math.min(3, Math.max(1, scoreValue));
    return {
      criterionId: criterion.id,
      score
    };
  });

  const totalScore = items.reduce((sum, item) => sum + item.score, 0);
  const percentScore = Math.round((totalScore / totalPossibleScore) * 100);
  const band = scoreBand(percentScore);

  await prisma.evaluation.create({
    data: {
      studentId,
      phase: phase as Phase,
      evaluator,
      evaluatedAt: new Date(evaluatedAt),
      totalScore,
      percentScore,
      band,
      notes: notes || null,
      items: {
        createMany: {
          data: items
        }
      }
    }
  });

  revalidatePath("/evaluations");
  revalidatePath("/evaluations/new");
}

export async function deleteEvaluation(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  await prisma.evaluation.delete({
    where: { id }
  });

  revalidatePath("/evaluations");
}
