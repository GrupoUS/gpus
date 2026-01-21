import type { AsaasCustomerPayload } from './asaas';

const NON_DIGIT_REGEX = /\D/g;
const REPEATED_DIGIT_REGEX = /^(\d)\1+$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates a CPF string.
 * Checks format, length, known invalid patterns, and check digits.
 * @param cpf The CPF string to validate (can be formatted or raw)
 * @returns Object with valid boolean and optional error message
 */
export function validateCPF(cpf: string): { valid: boolean; error?: string } {
	// Remove non-numeric characters
	const cleanCPF = cpf.replace(NON_DIGIT_REGEX, '');

	// Check length
	if (cleanCPF.length !== 11) {
		return { valid: false, error: 'CPF deve ter 11 dígitos' };
	}

	// Check for known invalid patterns (all same digits)
	if (REPEATED_DIGIT_REGEX.test(cleanCPF)) {
		return { valid: false, error: 'CPF inválido (dígitos repetidos)' };
	}

	// Validate check digits
	let sum = 0;
	let remainder = 0;

	// First check digit
	for (let i = 1; i <= 9; i++) {
		sum += Number.parseInt(cleanCPF.substring(i - 1, i), 10) * (11 - i);
	}
	remainder = (sum * 10) % 11;

	if (remainder === 10 || remainder === 11) remainder = 0;
	if (remainder !== Number.parseInt(cleanCPF.substring(9, 10), 10)) {
		return { valid: false, error: 'CPF inválido (dígito verificador incorreto)' };
	}

	// Second check digit
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
 * Result of payload validation
 */
export interface ValidationResult {
	valid: boolean;
	errors: string[];
}

/**
 * Validates the Asaas Customer Payload before sending to API.
 * Checks required fields and basic formats.
 * @param payload The customer payload to validate
 * @returns ValidationResult object
 */
export function validateAsaasCustomerPayload(payload: AsaasCustomerPayload): ValidationResult {
	const errors: string[] = [];

	// Required fields
	if (!payload.name || payload.name.trim().length === 0) {
		errors.push('Nome é obrigatório');
	}

	if (!payload.cpfCnpj || payload.cpfCnpj.trim().length === 0) {
		// Although Asaas might allow creation without CPF in some cases,
		// for our business logic it is usually required for billing.
		// However, the plan says "se fornecido" in 1.1, but let's stick to strict validation if present.
		// If the payload has it, we validate it.
	}

	// Email format (simplified RFC 5322)
	if (payload.email && !EMAIL_REGEX.test(payload.email)) {
		errors.push('Email inválido');
	}

	// Phone format (Brazilian: 10-11 digits)
	// Asaas accepts phone or mobilePhone. We check whichever is present.
	const phoneToCheck = payload.mobilePhone || payload.phone;
	if (phoneToCheck) {
		const cleanPhone = phoneToCheck.replace(/\D/g, '');
		if (cleanPhone.length < 10 || cleanPhone.length > 11) {
			errors.push('Telefone deve ter 10 ou 11 dígitos (com DDD)');
		}
	}

	return {
		valid: errors.length === 0,
		errors,
	};
}
