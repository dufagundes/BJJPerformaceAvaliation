"use client";

import { useMemo, useState } from "react";
import type { Criterion, Student } from "@prisma/client";
import { createEvaluation } from "../actions";

const phaseLabels: Record<string, string> = {
  TINY_CHAMPS: "Tiny Champs (3-4)",
  LITTLE_CHAMPS_1: "Little Champs 1 (5-6)",
  LITTLE_CHAMPS_2: "Little Champs 2 (7-9)",
  JUNIORS_TEENS: "Juniors/Teens (10-13)"
};

const domainLabels: Record<string, string> = {
  MOTOR_DEVELOPMENT: "Motor Development",
  TECHNICAL_DEVELOPMENT: "Technical Development",
  BEHAVIOR_EMOTIONAL: "Behavior & Emotional",
  SOCIAL_VALUES: "Social Skills & GB Values"
};

export default function EvaluationForm({
  students,
  criteria
}: {
  students: Student[];
  criteria: Criterion[];
}) {
  const [phase, setPhase] = useState(criteria[0]?.phase ?? "TINY_CHAMPS");
  const filteredCriteria = useMemo(
    () => criteria.filter((criterion) => criterion.phase === phase),
    [criteria, phase]
  );

  return (
    <form action={createEvaluation}>
      <label htmlFor="studentId">Student</label>
      <select id="studentId" name="studentId" required>
        {students.map((student) => (
          <option key={student.id} value={student.id}>
            {student.firstName} {student.lastName}
          </option>
        ))}
      </select>
      <label htmlFor="phase">Phase</label>
      <select
        id="phase"
        name="phase"
        value={phase}
        onChange={(event) => setPhase(event.target.value)}
      >
        {Object.entries(phaseLabels).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
      <label htmlFor="evaluator">Evaluator name</label>
      <input id="evaluator" name="evaluator" required />
      <label htmlFor="evaluatedAt">Evaluation date</label>
      <input id="evaluatedAt" name="evaluatedAt" type="date" required />

      {filteredCriteria.map((criterion) => (
        <div key={criterion.id}>
          <label htmlFor={`score_${criterion.id}`}>
            {criterion.displayOrder}. {criterion.name} ({domainLabels[criterion.domain]})
          </label>
          <input
            id={`score_${criterion.id}`}
            name={`score_${criterion.id}`}
            type="number"
            min={1}
            max={3}
            defaultValue={2}
            required
          />
          <div>{criterion.description}</div>
        </div>
      ))}
      <label htmlFor="notes">Notes</label>
      <textarea id="notes" name="notes" rows={4} />
      <button type="submit">Save evaluation</button>
    </form>
  );
}
