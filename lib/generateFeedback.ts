import Anthropic from "@anthropic-ai/sdk";

export type ReviewCategoryInput = {
  group: string;
  session: string;
  factor: string;
  normalizedScore: number;
  responseCount: number;
};

export type FeedbackResult = {
  reviewMarkdown: string;
};

type FeedbackPayload = Partial<FeedbackResult>;

const FALLBACK_RESULT: FeedbackResult = {
  reviewMarkdown: [
    "# Overall Performance Summary",
    "AI feedback is currently unavailable. The scorecard data is present and should be reviewed with the employee using the category breakdown below.",
    "",
    "# Key Strengths",
    "- Review high-scoring categories and reinforced behaviors from evaluator comments.",
    "",
    "# Development Opportunities",
    "- Prioritize consistently lower-scoring categories with clear coaching expectations.",
    "",
    "# Manager Feedback",
    "Your contributions are valued, and we will use this review to build a practical growth plan together.",
    "",
    "# Development Action Plan",
    "- Goal: Improve targeted competencies identified in scorecard results",
    "- Expected Behavior: Demonstrate consistent improvement across weekly observations",
    "- Specific Action Steps: Practice, coaching check-ins, and measurable milestones",
    "- Manager Support: Ongoing coaching and observation feedback",
    "- Timeline: 30 Days, 60-90 Days, 3-6 Months",
    "",
    "# Future Growth and Potential",
    "Leadership readiness should be based on sustained performance and consistency in key categories.",
    "",
    "# Meeting Talking Points",
    "- Recognition points",
    "- Coaching points",
    "- Priority development areas",
    "- Employee commitments",
    "- Manager commitments",
  ].join("\n"),
};

const SYSTEM_PROMPT =
  "You are an experienced direct manager writing a professional employee performance review. Be supportive, objective, specific, and growth-oriented. Always respond in valid JSON only.";

function normalizeQuotes(values: string[]): string[] {
  return values
    .map((value) => value.trim())
    .filter((value) => value.length > 0);
}

function buildUserPrompt(
  staffName: string,
  finalScore: number,
  scoreLabel: string,
  categories: ReviewCategoryInput[],
  strengths: string[],
  improvementAreas: string[],
): string {
  const categoriesBlock =
    categories.length > 0
      ? categories
          .map(
            (category, index) =>
              `${index + 1}. Group: ${category.group} | Session: ${category.session} | Factor: ${category.factor} | Score: ${category.normalizedScore.toFixed(1)} | Responses: ${category.responseCount}`,
          )
          .join("\n")
      : "No category scores were provided.";

  const strengthsBlock =
    strengths.length > 0
      ? strengths.map((quote, index) => `${index + 1}. ${quote}`).join("\n")
      : "No strengths quotes were submitted.";

  const improvementBlock =
    improvementAreas.length > 0
      ? improvementAreas.map((quote, index) => `${index + 1}. ${quote}`).join("\n")
      : "No weaknesses quotes were submitted.";

  return [
    "Write a polished performance review that can be shared directly with the employee.",
    "Analyze all scorecard categories, strengths comments, and areas for improvement comments.",
    "Give more weight to consistently low scores for development opportunities and high scores for strengths.",
    "If ratings and comments conflict, acknowledge that and provide balanced assessment.",
    "Use natural manager-to-employee tone.",
    "",
    `Staff Name: ${staffName}`,
    `Final Score (out of 100): ${finalScore.toFixed(1)}`,
    `Score Label: ${scoreLabel}`,
    "",
    "Scorecard Categories:",
    categoriesBlock,
    "",
    "Collected Strengths Quotes:",
    strengthsBlock,
    "",
    "Collected Areas for Improvement Quotes:",
    improvementBlock,
    "",
    "Return ONLY valid JSON in this exact shape:",
    "{",
    '  "reviewMarkdown": "# Overall Performance Summary\\n...\\n# Key Strengths\\n...\\n# Development Opportunities\\n...\\n# Manager Feedback\\n...\\n# Development Action Plan\\n...\\n# Future Growth and Potential\\n...\\n# Meeting Talking Points\\n..."',
    "}",
    "",
    "Required section headers in reviewMarkdown (exact text):",
    "# Overall Performance Summary",
    "# Key Strengths",
    "# Development Opportunities",
    "# Manager Feedback",
    "# Development Action Plan",
    "# Future Growth and Potential",
    "# Meeting Talking Points",
  ].join("\n");
}

function extractTextFromClaudeResponse(content: Anthropic.Messages.Message["content"]): string {
  return content
    .map((block) => {
      if (block.type === "text") {
        return block.text;
      }

      return "";
    })
    .join("\n")
    .trim();
}

function tryParseJson(text: string): FeedbackPayload | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  const stripCodeFence = trimmed
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  const candidates = [stripCodeFence];

  const objectStart = stripCodeFence.indexOf("{");
  const objectEnd = stripCodeFence.lastIndexOf("}");
  if (objectStart >= 0 && objectEnd > objectStart) {
    candidates.push(stripCodeFence.slice(objectStart, objectEnd + 1));
  }

  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate) as FeedbackPayload;
      return parsed;
    } catch {
      continue;
    }
  }

  return null;
}

function toFeedbackResult(parsed: FeedbackPayload | null): FeedbackResult {
  if (!parsed) {
    return FALLBACK_RESULT;
  }

  const reviewMarkdown =
    typeof parsed.reviewMarkdown === "string" && parsed.reviewMarkdown.trim().length > 0
      ? parsed.reviewMarkdown.trim()
      : FALLBACK_RESULT.reviewMarkdown;

  return {
    reviewMarkdown,
  };
}

export async function generateFeedback(
  staffName: string,
  finalScore: number,
  scoreLabel: string,
  categories: ReviewCategoryInput[],
  strengths: string[],
  improvementAreas: string[],
): Promise<FeedbackResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return FALLBACK_RESULT;
  }

  const client = new Anthropic({ apiKey });

  const normalizedStrengths = normalizeQuotes(strengths);
  const normalizedImprovementAreas = normalizeQuotes(improvementAreas);

  try {
    const response = await client.messages.create({
      model: "claude-opus-4-5",
      max_tokens: 2200,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: buildUserPrompt(
            staffName,
            finalScore,
            scoreLabel,
            categories,
            normalizedStrengths,
            normalizedImprovementAreas,
          ),
        },
      ],
    });

    const text = extractTextFromClaudeResponse(response.content);
    const parsed = tryParseJson(text);
    return toFeedbackResult(parsed);
  } catch {
    return FALLBACK_RESULT;
  }
}