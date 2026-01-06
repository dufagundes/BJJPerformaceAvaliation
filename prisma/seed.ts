import { PrismaClient, Domain, Phase } from "@prisma/client";

const prisma = new PrismaClient();

const criteria = [
  {
    phase: Phase.TINY_CHAMPS,
    domain: Domain.MOTOR_DEVELOPMENT,
    name: "Balance",
    description:
      "Approaching: loses balance often. On Track: maintains basic balance. Exceeding: recovers balance independently.",
    displayOrder: 1
  },
  {
    phase: Phase.TINY_CHAMPS,
    domain: Domain.MOTOR_DEVELOPMENT,
    name: "Gross Coordination",
    description:
      "Approaching: disorganized movement. On Track: controlled rolling/standing. Exceeding: fluid movements.",
    displayOrder: 2
  },
  {
    phase: Phase.TINY_CHAMPS,
    domain: Domain.MOTOR_DEVELOPMENT,
    name: "Body Awareness",
    description:
      "Approaching: confused positioning. On Track: responds to commands. Exceeding: anticipates positioning.",
    displayOrder: 3
  },
  {
    phase: Phase.TINY_CHAMPS,
    domain: Domain.MOTOR_DEVELOPMENT,
    name: "Safe Falling",
    description:
      "Approaching: fear or stiffness. On Track: falls safely. Exceeding: falls relaxed/confident.",
    displayOrder: 4
  },
  {
    phase: Phase.TINY_CHAMPS,
    domain: Domain.TECHNICAL_DEVELOPMENT,
    name: "Position Recognition",
    description:
      "Approaching: needs help. On Track: recognizes basic positions. Exceeding: recognizes and enters.",
    displayOrder: 5
  },
  {
    phase: Phase.TINY_CHAMPS,
    domain: Domain.TECHNICAL_DEVELOPMENT,
    name: "Movement Imitation",
    description:
      "Approaching: partial imitation. On Track: correct imitation. Exceeding: repeats confidently.",
    displayOrder: 6
  },
  {
    phase: Phase.TINY_CHAMPS,
    domain: Domain.TECHNICAL_DEVELOPMENT,
    name: "Partner Control",
    description:
      "Approaching: random pushing. On Track: gentle control. Exceeding: aware, controlled contact.",
    displayOrder: 7
  },
  {
    phase: Phase.TINY_CHAMPS,
    domain: Domain.TECHNICAL_DEVELOPMENT,
    name: "Game Participation",
    description:
      "Approaching: drops out. On Track: participates fully. Exceeding: highly engaged.",
    displayOrder: 8
  },
  {
    phase: Phase.TINY_CHAMPS,
    domain: Domain.BEHAVIOR_EMOTIONAL,
    name: "Attention Span",
    description:
      "Approaching: easily distracted. On Track: short focused periods. Exceeding: sustained focus.",
    displayOrder: 9
  },
  {
    phase: Phase.TINY_CHAMPS,
    domain: Domain.BEHAVIOR_EMOTIONAL,
    name: "Following Instructions",
    description:
      "Approaching: needs repetition. On Track: follows commands. Exceeding: anticipates commands.",
    displayOrder: 10
  },
  {
    phase: Phase.TINY_CHAMPS,
    domain: Domain.BEHAVIOR_EMOTIONAL,
    name: "Emotional Security",
    description:
      "Approaching: frequent distress. On Track: comfortable. Exceeding: fully confident.",
    displayOrder: 11
  },
  {
    phase: Phase.TINY_CHAMPS,
    domain: Domain.BEHAVIOR_EMOTIONAL,
    name: "Frustration Control",
    description:
      "Approaching: cries/gives up. On Track: recovers with help. Exceeding: self-regulates.",
    displayOrder: 12
  },
  {
    phase: Phase.TINY_CHAMPS,
    domain: Domain.SOCIAL_VALUES,
    name: "Respect",
    description:
      "Approaching: needs reminders. On Track: consistently respectful. Exceeding: role model.",
    displayOrder: 13
  },
  {
    phase: Phase.TINY_CHAMPS,
    domain: Domain.SOCIAL_VALUES,
    name: "Waiting Turn",
    description:
      "Approaching: impatient. On Track: waits with reminders. Exceeding: waits independently.",
    displayOrder: 14
  },
  {
    phase: Phase.TINY_CHAMPS,
    domain: Domain.SOCIAL_VALUES,
    name: "Sharing Space",
    description:
      "Approaching: frequent conflict. On Track: shares appropriately. Exceeding: actively cooperative.",
    displayOrder: 15
  },
  {
    phase: Phase.TINY_CHAMPS,
    domain: Domain.SOCIAL_VALUES,
    name: "Mat Attitude",
    description:
      "Approaching: inconsistent. On Track: positive. Exceeding: inspires others.",
    displayOrder: 16
  },
  {
    phase: Phase.LITTLE_CHAMPS_1,
    domain: Domain.MOTOR_DEVELOPMENT,
    name: "Coordination Sequences",
    description:
      "Approaching: breaks sequence. On Track: completes sequence. Exceeding: fluid execution.",
    displayOrder: 1
  },
  {
    phase: Phase.LITTLE_CHAMPS_1,
    domain: Domain.MOTOR_DEVELOPMENT,
    name: "Balance in Motion",
    description:
      "Approaching: loses base. On Track: maintains balance. Exceeding: adjusts independently.",
    displayOrder: 2
  },
  {
    phase: Phase.LITTLE_CHAMPS_1,
    domain: Domain.MOTOR_DEVELOPMENT,
    name: "Body Control",
    description:
      "Approaching: impulsive. On Track: controlled with guidance. Exceeding: self-regulated.",
    displayOrder: 3
  },
  {
    phase: Phase.LITTLE_CHAMPS_1,
    domain: Domain.MOTOR_DEVELOPMENT,
    name: "Endurance",
    description:
      "Approaching: stops early. On Track: completes class. Exceeding: sustains energy.",
    displayOrder: 4
  },
  {
    phase: Phase.LITTLE_CHAMPS_1,
    domain: Domain.TECHNICAL_DEVELOPMENT,
    name: "Position Recognition",
    description:
      "Approaching: confuses positions. On Track: recognizes positions. Exceeding: explains positions.",
    displayOrder: 5
  },
  {
    phase: Phase.LITTLE_CHAMPS_1,
    domain: Domain.TECHNICAL_DEVELOPMENT,
    name: "Position Maintenance",
    description:
      "Approaching: cannot maintain. On Track: maintains briefly. Exceeding: adjusts & maintains.",
    displayOrder: 6
  },
  {
    phase: Phase.LITTLE_CHAMPS_1,
    domain: Domain.TECHNICAL_DEVELOPMENT,
    name: "Basic Transitions",
    description:
      "Approaching: unclear. On Track: correct. Exceeding: smooth.",
    displayOrder: 7
  },
  {
    phase: Phase.LITTLE_CHAMPS_1,
    domain: Domain.TECHNICAL_DEVELOPMENT,
    name: "Technique Combination",
    description:
      "Approaching: single step. On Track: two-step combo. Exceeding: consistent combos.",
    displayOrder: 8
  },
  {
    phase: Phase.LITTLE_CHAMPS_1,
    domain: Domain.BEHAVIOR_EMOTIONAL,
    name: "Attention",
    description:
      "Approaching: distracted. On Track: focused with reminders. Exceeding: focused independently.",
    displayOrder: 9
  },
  {
    phase: Phase.LITTLE_CHAMPS_1,
    domain: Domain.BEHAVIOR_EMOTIONAL,
    name: "Response to Correction",
    description:
      "Approaching: resists. On Track: accepts. Exceeding: seeks correction.",
    displayOrder: 10
  },
  {
    phase: Phase.LITTLE_CHAMPS_1,
    domain: Domain.BEHAVIOR_EMOTIONAL,
    name: "Persistence",
    description:
      "Approaching: gives up. On Track: tries again. Exceeding: persists independently.",
    displayOrder: 11
  },
  {
    phase: Phase.LITTLE_CHAMPS_1,
    domain: Domain.BEHAVIOR_EMOTIONAL,
    name: "Frustration Control",
    description:
      "Approaching: outbursts. On Track: recovers with help. Exceeding: self-regulates.",
    displayOrder: 12
  },
  {
    phase: Phase.LITTLE_CHAMPS_1,
    domain: Domain.SOCIAL_VALUES,
    name: "Partner Cooperation",
    description:
      "Approaching: poor cooperation. On Track: cooperates. Exceeding: helps partner.",
    displayOrder: 13
  },
  {
    phase: Phase.LITTLE_CHAMPS_1,
    domain: Domain.SOCIAL_VALUES,
    name: "Rule Compliance",
    description:
      "Approaching: breaks rules. On Track: follows rules. Exceeding: reinforces rules.",
    displayOrder: 14
  },
  {
    phase: Phase.LITTLE_CHAMPS_1,
    domain: Domain.SOCIAL_VALUES,
    name: "Respect",
    description:
      "Approaching: needs reminders. On Track: consistent respect. Exceeding: role model.",
    displayOrder: 15
  },
  {
    phase: Phase.LITTLE_CHAMPS_1,
    domain: Domain.SOCIAL_VALUES,
    name: "Mat Attitude",
    description:
      "Approaching: inconsistent. On Track: positive. Exceeding: motivating.",
    displayOrder: 16
  },
  {
    phase: Phase.LITTLE_CHAMPS_2,
    domain: Domain.MOTOR_DEVELOPMENT,
    name: "Advanced Coordination",
    description:
      "Approaching: breaks under pressure. On Track: maintains coordination. Exceeding: stable under fatigue.",
    displayOrder: 1
  },
  {
    phase: Phase.LITTLE_CHAMPS_2,
    domain: Domain.MOTOR_DEVELOPMENT,
    name: "Base and Posture",
    description:
      "Approaching: loses base. On Track: maintains base. Exceeding: strategic adjustments.",
    displayOrder: 2
  },
  {
    phase: Phase.LITTLE_CHAMPS_2,
    domain: Domain.MOTOR_DEVELOPMENT,
    name: "Controlled Strength",
    description:
      "Approaching: excess force. On Track: appropriate force. Exceeding: efficient control.",
    displayOrder: 3
  },
  {
    phase: Phase.LITTLE_CHAMPS_2,
    domain: Domain.MOTOR_DEVELOPMENT,
    name: "Endurance",
    description:
      "Approaching: inconsistent. On Track: maintains pace. Exceeding: high consistency.",
    displayOrder: 4
  },
  {
    phase: Phase.LITTLE_CHAMPS_2,
    domain: Domain.TECHNICAL_DEVELOPMENT,
    name: "Technical Execution",
    description:
      "Approaching: inconsistent. On Track: consistent. Exceeding: high precision.",
    displayOrder: 5
  },
  {
    phase: Phase.LITTLE_CHAMPS_2,
    domain: Domain.TECHNICAL_DEVELOPMENT,
    name: "Functional Transitions",
    description:
      "Approaching: slow/incorrect. On Track: correct. Exceeding: strategic.",
    displayOrder: 6
  },
  {
    phase: Phase.LITTLE_CHAMPS_2,
    domain: Domain.TECHNICAL_DEVELOPMENT,
    name: "Technique Combination",
    description:
      "Approaching: needs guidance. On Track: independent combos. Exceeding: adaptive combos.",
    displayOrder: 7
  },
  {
    phase: Phase.LITTLE_CHAMPS_2,
    domain: Domain.TECHNICAL_DEVELOPMENT,
    name: "Partner Control",
    description:
      "Approaching: loses control. On Track: controls positions. Exceeding: anticipates movement.",
    displayOrder: 8
  },
  {
    phase: Phase.LITTLE_CHAMPS_2,
    domain: Domain.BEHAVIOR_EMOTIONAL,
    name: "Self-Control",
    description:
      "Approaching: impulsive. On Track: controlled. Exceeding: self-regulated.",
    displayOrder: 9
  },
  {
    phase: Phase.LITTLE_CHAMPS_2,
    domain: Domain.BEHAVIOR_EMOTIONAL,
    name: "Growth Mindset",
    description:
      "Approaching: avoids challenge. On Track: accepts challenge. Exceeding: seeks challenge.",
    displayOrder: 10
  },
  {
    phase: Phase.LITTLE_CHAMPS_2,
    domain: Domain.BEHAVIOR_EMOTIONAL,
    name: "Responsibility",
    description:
      "Approaching: inconsistent. On Track: responsible. Exceeding: role model.",
    displayOrder: 11
  },
  {
    phase: Phase.LITTLE_CHAMPS_2,
    domain: Domain.BEHAVIOR_EMOTIONAL,
    name: "Sparring Conduct",
    description:
      "Approaching: unsafe. On Track: controlled. Exceeding: composed & technical.",
    displayOrder: 12
  },
  {
    phase: Phase.LITTLE_CHAMPS_2,
    domain: Domain.SOCIAL_VALUES,
    name: "Peer Cooperation",
    description:
      "Approaching: selective. On Track: works with all. Exceeding: integrates others.",
    displayOrder: 13
  },
  {
    phase: Phase.LITTLE_CHAMPS_2,
    domain: Domain.SOCIAL_VALUES,
    name: "Leadership",
    description:
      "Approaching: needs guidance. On Track: positive influence. Exceeding: leads by example.",
    displayOrder: 14
  },
  {
    phase: Phase.LITTLE_CHAMPS_2,
    domain: Domain.SOCIAL_VALUES,
    name: "Conflict Resolution",
    description:
      "Approaching: escalates. On Track: seeks help. Exceeding: resolves independently.",
    displayOrder: 15
  },
  {
    phase: Phase.LITTLE_CHAMPS_2,
    domain: Domain.SOCIAL_VALUES,
    name: "School Representation",
    description:
      "Approaching: inconsistent. On Track: consistent. Exceeding: outstanding ambassador.",
    displayOrder: 16
  },
  {
    phase: Phase.JUNIORS_TEENS,
    domain: Domain.MOTOR_DEVELOPMENT,
    name: "Movement Efficiency",
    description:
      "Approaching: wastes energy. On Track: efficient. Exceeding: highly efficient.",
    displayOrder: 1
  },
  {
    phase: Phase.JUNIORS_TEENS,
    domain: Domain.MOTOR_DEVELOPMENT,
    name: "Control Under Fatigue",
    description:
      "Approaching: form degrades. On Track: maintains form. Exceeding: form stable.",
    displayOrder: 2
  },
  {
    phase: Phase.JUNIORS_TEENS,
    domain: Domain.MOTOR_DEVELOPMENT,
    name: "Functional Strength",
    description:
      "Approaching: inconsistent. On Track: consistent. Exceeding: above expectations.",
    displayOrder: 3
  },
  {
    phase: Phase.JUNIORS_TEENS,
    domain: Domain.MOTOR_DEVELOPMENT,
    name: "Injury Awareness",
    description:
      "Approaching: risky. On Track: safe training. Exceeding: protects partners.",
    displayOrder: 4
  },
  {
    phase: Phase.JUNIORS_TEENS,
    domain: Domain.TECHNICAL_DEVELOPMENT,
    name: "Technique Combination",
    description:
      "Approaching: drill-only. On Track: applied in sparring. Exceeding: real-time adaptation.",
    displayOrder: 5
  },
  {
    phase: Phase.JUNIORS_TEENS,
    domain: Domain.TECHNICAL_DEVELOPMENT,
    name: "Active Defense",
    description:
      "Approaching: reactive. On Track: consistent. Exceeding: anticipatory.",
    displayOrder: 6
  },
  {
    phase: Phase.JUNIORS_TEENS,
    domain: Domain.TECHNICAL_DEVELOPMENT,
    name: "Strategic Thinking",
    description:
      "Approaching: no plan. On Track: basic strategy. Exceeding: adaptive strategy.",
    displayOrder: 7
  },
  {
    phase: Phase.JUNIORS_TEENS,
    domain: Domain.TECHNICAL_DEVELOPMENT,
    name: "Sparring Intelligence",
    description:
      "Approaching: over-aggressive. On Track: controlled. Exceeding: highly intelligent.",
    displayOrder: 8
  },
  {
    phase: Phase.JUNIORS_TEENS,
    domain: Domain.BEHAVIOR_EMOTIONAL,
    name: "Self-Discipline",
    description:
      "Approaching: needs reminders. On Track: self-disciplined. Exceeding: discipline leader.",
    displayOrder: 9
  },
  {
    phase: Phase.JUNIORS_TEENS,
    domain: Domain.BEHAVIOR_EMOTIONAL,
    name: "Emotional Control",
    description:
      "Approaching: emotional reactions. On Track: controlled. Exceeding: calm leadership.",
    displayOrder: 10
  },
  {
    phase: Phase.JUNIORS_TEENS,
    domain: Domain.BEHAVIOR_EMOTIONAL,
    name: "Commitment",
    description:
      "Approaching: irregular. On Track: consistent. Exceeding: highly committed.",
    displayOrder: 11
  },
  {
    phase: Phase.JUNIORS_TEENS,
    domain: Domain.BEHAVIOR_EMOTIONAL,
    name: "Feedback Response",
    description:
      "Approaching: defensive. On Track: applies feedback. Exceeding: seeks feedback.",
    displayOrder: 12
  },
  {
    phase: Phase.JUNIORS_TEENS,
    domain: Domain.SOCIAL_VALUES,
    name: "Leadership",
    description:
      "Approaching: negative influence. On Track: positive influence. Exceeding: team leader.",
    displayOrder: 13
  },
  {
    phase: Phase.JUNIORS_TEENS,
    domain: Domain.SOCIAL_VALUES,
    name: "Support Younger Students",
    description:
      "Approaching: does not assist. On Track: assists when asked. Exceeding: proactively assists.",
    displayOrder: 14
  },
  {
    phase: Phase.JUNIORS_TEENS,
    domain: Domain.SOCIAL_VALUES,
    name: "Respect & Humility",
    description:
      "Approaching: inconsistent. On Track: consistent. Exceeding: exemplary.",
    displayOrder: 15
  },
  {
    phase: Phase.JUNIORS_TEENS,
    domain: Domain.SOCIAL_VALUES,
    name: "GB Representation",
    description:
      "Approaching: variable. On Track: represents well. Exceeding: model representative.",
    displayOrder: 16
  }
];

async function main() {
  await prisma.criterion.createMany({
    data: criteria,
    skipDuplicates: true
  });
}

main()
  .catch(async (error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
