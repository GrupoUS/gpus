export function formatPhoneNumber(value: string): string {
	// Remove all non-digits
	const digits = value.replace(/\D/g, '');

	// Limit to 11 digits
	const limited = digits.slice(0, 11);

	// Apply progressive mask
	if (limited.length <= 2) {
		return limited ? `(${limited}` : '';
	}

	if (limited.length <= 7) {
		return `(${limited.slice(0, 2)}) ${limited.slice(2)}`;
	}

	return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function cleanPhoneNumber(value: string): string {
	return value.replace(/\D/g, '');
}

export function isValidBrazilianPhone(value: string): boolean {
	// Simple validation: must have at least 10 digits
	const digits = cleanPhoneNumber(value);
	return digits.length >= 10 && digits.length <= 11;
}
