/**
 * Phone number formatting and validation utilities
 * Handles normalization of various phone formats to E.164 standard
 */

/**
 * Normalize phone number to E.164 format
 * Accepts: "415-555-2671", "(415) 555-2671", "+1 415 555 2671", "4155552671", etc.
 * Returns: "+14155552671" or null if invalid
 *
 * @param raw - Raw phone input
 * @param defaultCountryCode - Default country code if not provided (default: "1" for US)
 * @returns Normalized phone in E.164 format or null
 */
export function normalizePhoneNumber(
  raw: string,
  defaultCountryCode: string = "1"
): string | null {
  if (!raw || !raw.trim()) {
    return null;
  }

  // Remove all non-digit characters except leading +
  const cleaned = raw.replace(/[^\d+]/g, "").trim();

  if (!cleaned) {
    return null;
  }

  // Case 1: Already has + prefix - assume it's valid E.164
  if (cleaned.startsWith("+")) {
    // Validate minimum length for international numbers
    if (cleaned.length < 10) {
      return null; // Too short
    }
    return cleaned;
  }

  // Case 2: 10 digits (US local format without country code)
  if (cleaned.length === 10) {
    return `+${defaultCountryCode}${cleaned}`;
  }

  // Case 3: 11 digits starting with 1 (US format with country code)
  if (cleaned.length === 11 && cleaned.startsWith("1")) {
    return `+${cleaned}`;
  }

  // Case 4: Other lengths with valid international format
  if (cleaned.length >= 10 && cleaned.length <= 15) {
    // Assume it's an international number without +
    return `+${cleaned}`;
  }

  // Invalid format
  return null;
}

/**
 * Format phone number for display
 * Converts E.164 format to readable format
 * "+14155552671" -> "(415) 555-2671"
 */
export function formatPhoneForDisplay(e164: string): string {
  if (!e164.startsWith("+")) {
    return e164;
  }

  const cleaned = e164.replace(/\D/g, "");

  // US format
  if (cleaned.startsWith("1") && cleaned.length === 11) {
    const area = cleaned.slice(1, 4);
    const first = cleaned.slice(4, 7);
    const last = cleaned.slice(7);
    return `(${area}) ${first}-${last}`;
  }

  // Other formats - just return with + prefix
  return e164;
}

/**
 * Validate if phone is in valid format
 */
export function isValidPhoneNumber(phone: string): boolean {
  return normalizePhoneNumber(phone) !== null;
}

/**
 * Parse phone number to get components
 */
export function parsePhoneNumber(e164: string): {
  valid: boolean;
  formatted: string;
  raw: string;
  countryCode?: string;
  nationalNumber?: string;
} {
  if (!e164.startsWith("+")) {
    return { valid: false, formatted: e164, raw: e164 };
  }

  const cleaned = e164.replace(/\D/g, "");

  // US number
  if (cleaned.startsWith("1") && cleaned.length === 11) {
    return {
      valid: true,
      formatted: formatPhoneForDisplay(e164),
      raw: e164,
      countryCode: "1",
      nationalNumber: cleaned.slice(1),
    };
  }

  return {
    valid: true,
    formatted: e164,
    raw: e164,
  };
}
