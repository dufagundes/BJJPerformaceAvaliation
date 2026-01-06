"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { Domain, Phase } from "@prisma/client";

export async function createCriterion(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const phase = String(formData.get("phase") ?? "");
  const domain = String(formData.get("domain") ?? "");
  const displayOrder = Number(formData.get("displayOrder"));

  if (!name || !description || !phase || !domain || Number.isNaN(displayOrder)) {
    return;
  }

  await prisma.criterion.create({
    data: {
      name,
      description,
      phase: phase as Phase,
      domain: domain as Domain,
      displayOrder
    }
  });

  revalidatePath("/criteria");
}

export async function deleteCriterion(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  await prisma.criterion.delete({
    where: { id }
  });

  revalidatePath("/criteria");
}
