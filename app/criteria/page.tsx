import prisma from "@/lib/prisma";
import { createCriterion, deleteCriterion } from "./actions";

const phases = [
  { value: "TINY_CHAMPS", label: "Tiny Champs" },
  { value: "LITTLE_CHAMPS_1", label: "Little Champs 1" },
  { value: "LITTLE_CHAMPS_2", label: "Little Champs 2" },
  { value: "JUNIORS_TEENS", label: "Juniors/Teens" }
];

const domains = [
  { value: "MOTOR_DEVELOPMENT", label: "Motor Development" },
  { value: "TECHNICAL_DEVELOPMENT", label: "Technical Development" },
  { value: "BEHAVIOR_EMOTIONAL", label: "Behavior & Emotional" },
  { value: "SOCIAL_VALUES", label: "Social Skills & GB Values" }
];

export default async function CriteriaPage() {
  const criteria = await prisma.criterion.findMany({
    orderBy: [{ phase: "asc" }, { displayOrder: "asc" }]
  });

  return (
    <>
      <section>
        <h2>Add Criterion</h2>
        <form action={createCriterion}>
          <label htmlFor="name">Criterion</label>
          <input id="name" name="name" required />
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" rows={3} required />
          <label htmlFor="phase">Phase</label>
          <select id="phase" name="phase" required>
            {phases.map((phase) => (
              <option key={phase.value} value={phase.value}>
                {phase.label}
              </option>
            ))}
          </select>
          <label htmlFor="domain">Domain</label>
          <select id="domain" name="domain" required>
            {domains.map((domain) => (
              <option key={domain.value} value={domain.value}>
                {domain.label}
              </option>
            ))}
          </select>
          <label htmlFor="displayOrder">Display order</label>
          <input id="displayOrder" name="displayOrder" type="number" min={1} required />
          <button type="submit">Create criterion</button>
        </form>
      </section>
      <section>
        <h2>Criteria</h2>
        <table className="table">
          <thead>
            <tr>
              <th>Phase</th>
              <th>Domain</th>
              <th>Order</th>
              <th>Criterion</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {criteria.map((criterion) => (
              <tr key={criterion.id}>
                <td>{criterion.phase}</td>
                <td>{criterion.domain}</td>
                <td>{criterion.displayOrder}</td>
                <td>
                  <strong>{criterion.name}</strong>
                  <div>{criterion.description}</div>
                </td>
                <td>
                  <form action={deleteCriterion}>
                    <input type="hidden" name="id" value={criterion.id} />
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
