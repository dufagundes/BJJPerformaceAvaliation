import { prisma } from "./prisma";
import { SmsTemplateConfig, DEFAULT_TEMPLATES } from "./smsService";

/**
 * Get SMS templates for a school
 * Returns configured templates or defaults
 */
export async function getSmsTemplates(
  schoolId: string
): Promise<Required<SmsTemplateConfig>> {
  try {
    const config = await prisma.adminConfig.findUnique({
      where: { schoolId },
      select: { smsTemplates: true },
    });

    if (!config?.smsTemplates) {
      return { ...DEFAULT_TEMPLATES };
    }

    const templates = config.smsTemplates as SmsTemplateConfig;
    return {
      invite: templates.invite || DEFAULT_TEMPLATES.invite,
      reminder: templates.reminder || DEFAULT_TEMPLATES.reminder,
      completion: templates.completion || DEFAULT_TEMPLATES.completion,
    };
  } catch (error) {
    console.warn("Error fetching SMS templates, using defaults:", error);
    return { ...DEFAULT_TEMPLATES };
  }
}

/**
 * Update SMS templates for a school
 */
export async function updateSmsTemplates(
  schoolId: string,
  templates: SmsTemplateConfig
): Promise<void> {
  // Validate templates
  if (templates.invite && templates.invite.length > 500) {
    throw new Error("Invite template must be less than 500 characters");
  }
  if (templates.reminder && templates.reminder.length > 500) {
    throw new Error("Reminder template must be less than 500 characters");
  }
  if (templates.completion && templates.completion.length > 500) {
    throw new Error("Completion template must be less than 500 characters");
  }

  // Validate placeholders
  const validPlaceholders = ["{name}", "{days}", "{link}", "{subject}"];
  const allTemplates = Object.values(templates).filter(Boolean);

  for (const template of allTemplates) {
    const matches = template.match(/\{[^}]+\}/g) || [];
    for (const match of matches) {
      if (!validPlaceholders.includes(match)) {
        throw new Error(
          `Invalid placeholder ${match}. Valid: ${validPlaceholders.join(", ")}`
        );
      }
    }
  }

  await prisma.adminConfig.upsert({
    where: { schoolId },
    create: {
      schoolId,
      smsTemplates: templates,
    },
    update: {
      smsTemplates: templates,
    },
  });
}

/**
 * Get character count info for SMS messages
 * SMS providers typically charge per message segment:
 * - 160 chars (7-bit ASCII): 1 message
 * - 70 chars (Unicode): 1 message
 * - Each additional segment: +160 or +70 chars
 */
export function calculateSmsCost(message: string): {
  characterCount: number;
  segments: number;
  estimatedCost: string;
} {
  const charCount = message.length;
  const isUnicode = /[^\x00-\x7F]/.test(message);
  const charsPerSegment = isUnicode ? 70 : 160;
  const segments = Math.ceil(charCount / charsPerSegment);

  return {
    characterCount: charCount,
    segments,
    estimatedCost: `${segments} SMS segment(s)`,
  };
}
