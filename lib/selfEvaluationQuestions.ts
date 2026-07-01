export type SelfEvaluationQuestion = {
  order: number;
  text: string;
};

export const SELF_EVALUATION_QUESTIONS: SelfEvaluationQuestion[] = [
  {
    order: 1,
    text: "Looking back on this evaluation period, what accomplishments are you most proud of?",
  },
  {
    order: 2,
    text: "What challenges did you experience during this evaluation period?",
  },
  {
    order: 3,
    text: "What do you believe are your greatest professional strengths?",
  },
  {
    order: 4,
    text: "What is one area where you would like to improve?",
  },
  {
    order: 5,
    text: "What support or resources would help you perform even better?",
  },
  {
    order: 6,
    text: "What goals would you like to accomplish before the next evaluation?",
  },
  {
    order: 7,
    text: "Is there anything else you would like your manager to know before your review meeting?",
  },
];