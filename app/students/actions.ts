"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { Phase } from "@prisma/client";

export async function createStudent(formData: FormData) {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();
  const dateOfBirth = String(formData.get("dateOfBirth") ?? "");
  const phase = String(formData.get("phase") ?? "");

  if (!firstName || !lastName || !dateOfBirth || !phase) {
    return;
  }

  await prisma.student.create({
    data: {
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      phase: phase as Phase
    }
  });

  revalidatePath("/students");
}

export async function deleteStudent(formData: FormData) {
  const id = String(formData.get("id") ?? "");

  if (!id) {
    return;
  }

  await prisma.student.delete({
    where: { id }
  });

  revalidatePath("/students");
}
