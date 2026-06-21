export type Question = {
  id: `q${number}`;
  text: string;
  type: "rating" | "text";
  optional?: boolean;
};

export type EvaluatorType = "DIRECT_REPORT" | "PEER" | "PARENT";

export const QUESTIONS: Record<EvaluatorType, Question[]> = {
  DIRECT_REPORT: [
    {
      id: "q1",
      text: "Does this staff member set a clear example of discipline and dedication on the mats - showing up prepared, on time, and leading by behavior?",
      type: "rating",
    },
    {
      id: "q2",
      text: "How well does this staff member take ownership of problems instead of waiting to be told what to do?",
      type: "rating",
    },
    {
      id: "q3",
      text: "How effectively does this staff member represent the school's values - both inside and outside the academy?",
      type: "rating",
    },
    {
      id: "q4",
      text: "How well does this staff member respond to director feedback - accepting it professionally and applying it consistently?",
      type: "rating",
    },
    {
      id: "q5",
      text: "How actively does this staff member contribute to student retention - building relationships that keep students coming back?",
      type: "rating",
    },
    {
      id: "q6",
      text: "How well does this staff member handle pressure - staying composed and making good decisions during difficult situations?",
      type: "rating",
    },
    {
      id: "q7",
      text: "How proactive is this staff member in identifying ways to improve the school, curriculum, or student experience?",
      type: "rating",
    },
    {
      id: "q8",
      text: "How consistently does this staff member meet the operational expectations of their role - admin tasks, communication, and class management?",
      type: "rating",
    },
    {
      id: "q9",
      text: "What is the single most impactful contribution this staff member made to the school this quarter?",
      type: "text",
    },
    {
      id: "q10",
      text: "What is the most important leadership or professional development area this staff member should focus on next quarter?",
      type: "text",
    },
  ],
  PEER: [
    {
      id: "q1",
      text: "When you need help covering a class or handling a situation, how reliably does this colleague step up without being asked?",
      type: "rating",
    },
    {
      id: "q2",
      text: "How supportive is this colleague when a teammate is going through a tough period - personally or professionally?",
      type: "rating",
    },
    {
      id: "q3",
      text: "How openly and honestly does this colleague communicate with the team - sharing information, concerns, and ideas?",
      type: "rating",
    },
    {
      id: "q4",
      text: "When there is a disagreement between teammates, how constructively does this colleague handle it - without drama or avoidance?",
      type: "rating",
    },
    {
      id: "q5",
      text: "How much does this colleague's attitude and energy positively influence the mood of the team on a daily basis?",
      type: "rating",
    },
    {
      id: "q6",
      text: "How willing is this colleague to share knowledge, tips, or techniques that help the rest of the team grow?",
      type: "rating",
    },
    {
      id: "q7",
      text: "How consistent is this colleague in pulling their weight - not leaving extra work or cleanup for others?",
      type: "rating",
    },
    {
      id: "q8",
      text: "How much do you trust this colleague to have your back - both on the mats and in front of students or parents?",
      type: "rating",
    },
    {
      id: "q9",
      text: "Describe a specific moment this quarter where this colleague made the team better - big or small.",
      type: "text",
    },
    {
      id: "q10",
      text: "What is one habit or behavior this colleague could change that would make working together even better?",
      type: "text",
    },
  ],
  PARENT: [
    {
      id: "q1",
      text: "How clearly does this instructor explain techniques so that you (or your child) can understand and practice them?",
      type: "rating",
    },
    {
      id: "q2",
      text: "How safe do you feel during classes led by this instructor - in terms of drilling, sparring, and overall mat control?",
      type: "rating",
    },
    {
      id: "q3",
      text: "How encouraging and patient is this instructor with students who are struggling or new to jiu-jitsu?",
      type: "rating",
    },
    {
      id: "q4",
      text: "How much has your (or your child's) jiu-jitsu improved since training regularly with this instructor?",
      type: "rating",
    },
    {
      id: "q5",
      text: "How well does this instructor make every student feel included - regardless of age, size, or experience?",
      type: "rating",
    },
    {
      id: "q6",
      text: "When you have a question or concern, how approachable and responsive is this instructor?",
      type: "rating",
    },
    {
      id: "q7",
      text: "How well does this instructor keep classes engaging and fun while still being productive?",
      type: "rating",
    },
    {
      id: "q8",
      text: "Based on your experience with this instructor, how likely are you to recommend the school to a friend or family member?",
      type: "rating",
    },
    {
      id: "q9",
      text: "What is something specific this instructor does that makes your (or your child's) experience at the school special?",
      type: "text",
    },
    {
      id: "q10",
      text: "Is there anything you wish this instructor would do differently? (optional - anonymous)",
      type: "text",
      optional: true,
    },
  ],
};

export function getQuestions(type: EvaluatorType): Question[] {
  return QUESTIONS[type];
}
