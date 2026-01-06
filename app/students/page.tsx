import prisma from "@/lib/prisma";
import { createStudent, deleteStudent } from "./actions";

const phases = [
  { value: "TINY_CHAMPS", label: "Tiny Champs (3-4)" },
  { value: "LITTLE_CHAMPS_1", label: "Little Champs 1 (5-6)" },
  { value: "LITTLE_CHAMPS_2", label: "Little Champs 2 (7-9)" },
  { value: "JUNIORS_TEENS", label: "Juniors/Teens (10-13)" }
];

export default async function StudentsPage() {
  const students = await prisma.student.findMany({
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }]
  });

  return (
    <>
      <section>
        <h2>Add Student</h2>
        <form action={createStudent}>
          <label htmlFor="firstName">First name</label>
          <input id="firstName" name="firstName" required />
          <label htmlFor="lastName">Last name</label>
          <input id="lastName" name="lastName" required />
          <label htmlFor="dateOfBirth">Date of birth</label>
          <input id="dateOfBirth" name="dateOfBirth" type="date" required />
          <label htmlFor="phase">Phase</label>
          <select id="phase" name="phase" required>
            {phases.map((phase) => (
              <option key={phase.value} value={phase.value}>
                {phase.label}
              </option>
            ))}
          </select>
          <button type="submit">Create student</button>
        </form>
      </section>
      <section>
        <h2>Students</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Date of Birth</th>
              <th>Phase</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>
                  {student.firstName} {student.lastName}
                </td>
                <td>{student.dateOfBirth.toISOString().split("T")[0]}</td>
                <td>
                  <span className="badge">{student.phase}</span>
                </td>
                <td>
                  <form action={deleteStudent}>
                    <input type="hidden" name="id" value={student.id} />
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
