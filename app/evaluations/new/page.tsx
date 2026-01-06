import prisma from "@/lib/prisma";
import EvaluationForm from "./EvaluationForm";

export default async function NewEvaluationPage() {
  const [students, criteria] = await Promise.all([
    prisma.student.findMany({
      orderBy: [{ lastName: "asc" }, { firstName: "asc" }]
    }),
    prisma.criterion.findMany({
      orderBy: [{ phase: "asc" }, { displayOrder: "asc" }]
    })
  ]);

  return (
    <section>
      <h2>New Evaluation</h2>
      {students.length === 0 || criteria.length === 0 ? (
        <p>Please add students and criteria before creating evaluations.</p>
      ) : (
        <EvaluationForm students={students} criteria={criteria} />
      )}
    </section>
  );
}
