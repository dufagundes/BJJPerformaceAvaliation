import Link from "next/link";
import prisma from "@/lib/prisma";
import { deleteEvaluation } from "./actions";

export default async function EvaluationsPage() {
  const evaluations = await prisma.evaluation.findMany({
    include: { student: true },
    orderBy: { evaluatedAt: "desc" }
  });

  return (
    <>
      <section>
        <h2>Evaluations</h2>
        <Link href="/evaluations/new">Create new evaluation</Link>
      </section>
      <section>
        <table className="table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Phase</th>
              <th>Evaluator</th>
              <th>Date</th>
              <th>Score</th>
              <th>Band</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {evaluations.map((evaluation) => (
              <tr key={evaluation.id}>
                <td>
                  {evaluation.student.firstName} {evaluation.student.lastName}
                </td>
                <td>{evaluation.phase}</td>
                <td>{evaluation.evaluator}</td>
                <td>{evaluation.evaluatedAt.toISOString().split("T")[0]}</td>
                <td>
                  {evaluation.totalScore} / 48 ({evaluation.percentScore}%)
                </td>
                <td>
                  <span className="badge">{evaluation.band}</span>
                </td>
                <td>
                  <form action={deleteEvaluation}>
                    <input type="hidden" name="id" value={evaluation.id} />
                    <button className="secondary" type="submit">
                      Delete
                    </button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </>
  );
}
