import { getEvaluationFormQuestions } from "../lib/evaluationFormQuestions";
import { EvaluationAudienceType } from "@prisma/client";

async function verify() {
  console.log("Verifying questions are only from 'Head Instructor' role...\n");

  const questions = await getEvaluationFormQuestions();
  console.log(`✅ Total questions retrieved: ${questions.length}`);
  console.log(`   Expected: 17 (5 peer + 12 parent/student)\n`);

  const peerQuestions = questions.filter((q) => q.audienceType === EvaluationAudienceType.PEER);
  const parentQuestions = questions.filter(
    (q) => q.audienceType === EvaluationAudienceType.PARENT_STUDENT,
  );

  console.log(`📊 Breakdown:`);
  console.log(`   Peer/Co-Instructor: ${peerQuestions.length}`);
  console.log(`   Parent/Student: ${parentQuestions.length}`);

  const staffRoles = new Set(questions.map((q) => q.staffRole));
  console.log(`\n🔍 Staff Roles in questions: ${Array.from(staffRoles).join(", ")}`);

  if (staffRoles.size === 1 && staffRoles.has("Head Instructor")) {
    console.log("✨ SUCCESS: Only 'Head Instructor' questions present!");
  } else {
    console.log(
      "❌ ERROR: Found unexpected staff roles or empty roles:",
      Array.from(staffRoles),
    );
  }

  console.log("\n📋 Questions:");
  questions.forEach((q, i) => {
    console.log(`   ${i + 1}. [${q.audienceType}] ${q.text.substring(0, 60)}...`);
  });

  process.exit(0);
}

verify().catch(console.error);
