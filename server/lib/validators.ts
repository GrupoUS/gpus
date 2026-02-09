const NON_DIGIT_REGEX = /\D/g;
const REPEATED_DIGIT_REGEX = /^(\d)\1+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates a CPF string.
 * Checks format, length, known invalid patterns, and check digits.
 */
export function validateCPF(cpf: string): { valid: boolean; error?: string } {
	const cleanCPF = cpf.replace(NON_DIGIT_REGEX, '');

	if (cleanCPF.length !== 11) {
		return { valid: false, error: 'CPF deve ter 11 dígitos' };
	}

	if (REPEATED_DIGIT_REGEX.test(cleanCPF)) {
		return { valid: false, error: 'CPF inválido (dígitos repetidos)' };
	}

	let sum = 0;
	let remainder = 0;

	for (let i = 1; i <= 9; i++) {
		sum += Number.parseInt(cleanCPF.substring(i - 1, i), 10) * (11 - i);
	}
	remainder = (sum * 10) % 11;

	if (remainder === 10 || remainder === 11) remainder = 0;
	if (remainder !== Number.parseInt(cleanCPF.substring(9, 10), 10)) {
		return { valid: false, error: 'CPF inválido (dígito verificador incorreto)' };
	}

	sum = 0;
	for (let i = 1; i <= 10; i++) {
		sum += Number.parseInt(cleanCPF.substring(i - 1, i), 10) * (12 - i);
	}
	remainder = (sum * 10) % 11;

	if (remainder === 10 || remainder === 11) remainder = 0;
	if (remainder !== Number.parseInt(cleanCPF.substring(10, 11), 10)) {
		return { valid: false, error: 'CPF inválido (dígito verificador incorreto)' };
	}

	return { valid: true };
}

/**
 * Asaas Customer Payload type (for validation)
 */
interface AsaasCustomerPayload {
	name: string;
	cpfCnpj?: string;
	email?: string;
	phone?: string;
	mobilePhone?: string;
}

/**
 * Validates the Asaas Customer Payload before sending to API.
 */
export function validateAsaasCustomerPayload(payload: AsaasCustomerPayload): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (!payload.name || payload.name.trim().length === 0) {
		errors.push('Nome é obrigatório');
	}

	if (payload.email && !EMAIL_REGEX.test(payload.email)) {
		errors.push('Email inválido');
	}

	const phoneToCheck = payload.mobilePhone || payload.phone;
	if (phoneToCheck) {
		const cleanPhone = phoneToCheck.replace(/\D/g, '');
		if (cleanPhone.length < 10 || cleanPhone.length > 11) {
			errors.push('Telefone deve ter 10 ou 11 dígitos (com DDD)');
		}
	}

	return { valid: errors.length === 0, errors };
}
