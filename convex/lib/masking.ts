/**
 * Sensitive Data Masking Utilities
 *
 * Provides functions to mask PII (Personal Identifiable Information)
 * for safe logging and error reporting.
 */

/**
 * Masks a CPF leaving only the first 3 digits visible.
 * Format: 123.***.***-**
 */
export function maskCPF(cpf: string): string {
	if (!cpf) return '';
	const clean = cpf.replace(/\D/g, '');
	if (clean.length < 3) return '***';
	return `${clean.substring(0, 3)}.***.***-**`;
}

/**
 * Masks an email address.
 * format: f***@domain.com
 */
export function maskEmail(email: string): string {
	if (!email) return '';
	const parts = email.split('@');
	if (parts.length !== 2) return '***';

	const [user, domain] = parts;
	if (user.length <= 1) return `*@${domain}`;

	return `${user.substring(0, 1)}***@${domain}`;
}

/**
 * Masks a phone number.
 * Format: (11) 9****-1234
 */
export function maskPhone(phone: string): string {
	if (!phone) return '';
	const clean = phone.replace(/\D/g, '');
	if (clean.length < 4) return '***';

	const last4 = clean.substring(clean.length - 4);
	const prefix = clean.length > 2 ? `(${clean.substring(0, 2)}) ` : '';

	return `${prefix}****-${last4}`;
}
