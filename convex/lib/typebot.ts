/**
 * Typebot Integration Utilities
 *
 * Handles validation and formatting for data coming from Typebot.
 */

/**
 * Validates the Typebot webhook secret from request headers
 *
 * @param secret - The secret from X-Typebot-Secret header
 * @returns true if valid, false otherwise
 */
export function validateTypebotWebhookSecret(secret: string | null): boolean {
	const expectedSecret = process.env.TYPEBOT_WEBHOOK_SECRET;

	if (!expectedSecret) {
		return false;
	}

	if (!secret) return false;

	// Constant-time comparison to prevent timing attacks
	if (secret.length !== expectedSecret.length) return false;

	let result = 0;
	for (let i = 0; i < secret.length; i++) {
		// biome-ignore lint: Bitwise operations required for constant-time comparison
		result |= secret.charCodeAt(i) ^ expectedSecret.charCodeAt(i);
	}

	return result === 0;
}

/**
 * Formats a phone number to the expected CRM format: (XX) XXXXX-XXXX
 *
 * @param phone - Raw phone number string from Typebot
 * @returns Formatted phone string
 */
export function formatTypebotPhone(phone: string): string {
	const digits = phone.replace(/\D/g, '');

	// Best effort for Brazilian numbers
	let localDigits = digits;
	if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
		localDigits = digits.substring(2);
	}

	// Mobile: 11 digits (DDD + 9 + 8 digits)
	if (localDigits.length === 11) {
		return `(${localDigits.substring(0, 2)}) ${localDigits.substring(2, 7)}-${localDigits.substring(7)}`;
	}

	// Landline or old mobile: 10 digits (DDD + 8 digits)
	// Our schema expects 11 digits format for mobile usually,
	// but let's try to format 10 digits too for validation.
	if (localDigits.length === 10) {
		// Inject a '9' for modern mobile or keep as is?
		// The validation regex is /^\(\d{2}\) \d{5}-\d{4}$/, so 10 digits won't match.
		// We'll normalize 10 digits to 11 if possible, or just format as is.
		return `(${localDigits.substring(0, 2)}) 9${localDigits.substring(2, 6)}-${localDigits.substring(6)}`;
	}

	// Return formatted even if it might fail validation later,
	// so the error message is clear about what was received.
	if (localDigits.length > 2) {
		return `(${localDigits.substring(0, 2)}) ${localDigits.substring(2)}`;
	}

	return phone;
}

/**
 * Maps Typebot interest strings to CRM literals
 */
export function mapTypebotInterest(
	interest: string | undefined,
): 'Harmonização Facial' | 'Estética Corporal' | 'Bioestimuladores' | 'Outros' {
	if (!interest) return 'Outros';

	const lower = interest.toLowerCase();
	if (lower.includes('facial') || lower.includes('harmoniza')) return 'Harmonização Facial';
	if (lower.includes('corporal') || lower.includes('estetica')) return 'Estética Corporal';
	if (lower.includes('bioestimula') || lower.includes('bio')) return 'Bioestimuladores';

	return 'Outros';
}
