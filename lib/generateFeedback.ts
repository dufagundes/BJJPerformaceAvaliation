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

const SYSTEM_PROMPT =
  "You are an experienced direct manager writing a professional employee evaluation. Be supportive, objective, specific, and growth-oriented. Always respond in valid JSON only.";

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
              `${index + 1}. Group: ${category.group} | Session: ${category.session} | Selected Question: ${category.factor} | Average Score: ${category.normalizedScore.toFixed(1)} | Responses: ${category.responseCount}`,
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
    "Write a polished employee evaluation that can be shared directly with the employee.",
    "Analyze every selected-question score listed below, plus every open-ended strengths comment and area-for-improvement comment.",
    "The final score is calculated only from selected-question ratings. Do not recalculate it or claim the open-ended answers directly changed the score.",
    "Use the open-ended answers as qualitative evidence when interpreting the selected-question results.",
    "If open-ended answers suggest performance is stronger or weaker than the selected-question score alone implies, explain that as a qualitative signal.",
    "Give more weight to consistently low selected-question scores for development opportunities and high selected-question scores for strengths.",
    "If ratings and comments conflict, acknowledge the contrast and provide a balanced assessment.",
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
    throw new Error(
      "AI returned a response that could not be parsed. Please try generating the evaluation again.",
    );
  }

  if (typeof parsed.reviewMarkdown !== "string" || parsed.reviewMarkdown.trim().length === 0) {
    throw new Error("AI returned an empty evaluation. Please try generating the evaluation again.");
  }

  return {
    reviewMarkdown: parsed.reviewMarkdown.trim(),
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
    throw new Error(
      "AI feedback is not configured. Add ANTHROPIC_API_KEY in your environment variables, then redeploy or restart the server.",
    );
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
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("AI ")) {
      throw error;
    }

    throw new Error(
      "Unable to generate AI feedback from Anthropic. Check ANTHROPIC_API_KEY, model access, and try again.",
    );
  }
}