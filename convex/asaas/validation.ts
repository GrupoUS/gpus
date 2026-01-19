/**
 * Asaas Validation Schemas
 *
 * Zod schemas for validating Asaas API payloads.
 * Provides runtime type safety and input sanitization.
 */

import { z } from 'zod';

// ═══════════════════════════════════════════════════════
// VALIDATION UTILITIES
// ═══════════════════════════════════════════════════════

/**
 * Sanitize error message to remove sensitive data
 */
export function sanitizeErrorMessage(message: string): string {
	// Remove potential API keys (32+ character alphanumeric strings)
	return message.replace(/[a-zA-Z0-9]{32,}/g, '[REDACTED]');
}

/**
 * Validate and sanitize CPF/CNPJ
 */
export function validateCpfCnpj(cpfCnpj: string): string {
	const cleaned = cpfCnpj.replace(/\D/g, '');

	if (cleaned.length === 11) {
		// CPF validation
		if (!validateCPF(cleaned)) {
			throw new Error('CPF inválido');
		}
	} else if (cleaned.length === 14) {
		// CNPJ validation
		if (!validateCNPJ(cleaned)) {
			throw new Error('CNPJ inválido');
		}
	} else {
		throw new Error('CPF ou CNPJ deve ter 11 ou 14 dígitos');
	}

	return cleaned;
}

/**
 * Validate CPF (Brazilian Individual Tax ID)
 */
function validateCPF(cpf: string): boolean {
	if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
		return false;
	}

	let sum = 0;
	let remainder;

	for (let i = 1; i <= 9; i++) {
		sum += Number.parseInt(cpf.substring(i - 1, i), 10) * (11 - i);
	}

	remainder = (sum * 10) % 11;
	if (remainder === 10 || remainder === 11) remainder = 0;
	if (remainder !== Number.parseInt(cpf.substring(9, 10), 10)) return false;

	sum = 0;
	for (let i = 1; i <= 10; i++) {
		sum += Number.parseInt(cpf.substring(i - 1, i), 10) * (12 - i);
	}

	remainder = (sum * 10) % 11;
	if (remainder === 10 || remainder === 11) remainder = 0;
	if (remainder !== Number.parseInt(cpf.substring(10, 11), 10)) return false;

	return true;
}

/**
 * Validate CNPJ (Brazilian Company Tax ID)
 */
function validateCNPJ(cnpj: string): boolean {
	if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) {
		return false;
	}

	let length = cnpj.length - 2;
	let numbers = cnpj.substring(0, length);
	const digits = cnpj.substring(length);
	let sum = 0;
	let pos = length - 7;

	for (let i = length; i >= 1; i--) {
		sum += Number.parseInt(numbers.charAt(length - i), 10) * pos--;
		if (pos < 2) pos = 9;
	}

	let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
	if (result !== Number.parseInt(digits.charAt(0), 10)) return false;

	length += 1;
	numbers = cnpj.substring(0, length);
	sum = 0;
	pos = length - 7;

	for (let i = length; i >= 1; i--) {
		sum += Number.parseInt(numbers.charAt(length - i), 10) * pos--;
		if (pos < 2) pos = 9;
	}

	result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
	if (result !== Number.parseInt(digits.charAt(1), 10)) return false;

	return true;
}

// ═══════════════════════════════════════════════════════
// ZOD SCHEMAS
// ═══════════════════════════════════════════════════════

/**
 * Customer payload validation schema
 */
export const AsaasCustomerPayloadSchema = z.object({
	name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(200),
	cpfCnpj: z.string().min(11, 'CPF/CNPJ deve ter pelo menos 11 dígitos').max(14),
	email: z.string().email('Email inválido').optional().or(z.literal('')),
	phone: z
		.string()
		.regex(/^\d{10,11}$/, 'Telefone deve ter 10 ou 11 dígitos')
		.optional(),
	mobilePhone: z
		.string()
		.regex(/^\d{10,11}$/, 'Celular deve ter 10 ou 11 dígitos')
		.optional(),
	postalCode: z
		.string()
		.regex(/^\d{8}$/, 'CEP deve ter 8 dígitos')
		.optional(),
	address: z.string().max(200).optional(),
	addressNumber: z.string().max(20).optional(),
	complement: z.string().max(100).optional(),
	province: z.string().max(50).optional(),
	city: z.string().max(100).optional(),
	state: z.string().length(2, 'Estado deve ter 2 caracteres').optional(),
	country: z.string().max(50).optional(),
	externalReference: z.string().max(100).optional(),
	notificationDisabled: z.boolean().optional(),
	additionalEmails: z.string().max(500).optional(),
});

/**
 * Payment payload validation schema
 */
export const AsaasPaymentPayloadSchema = z.object({
	customer: z.string().min(1, 'ID do cliente é obrigatório'),
	billingType: z.enum(['BOLETO', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'UNDEFINED']),
	value: z.number().positive('Valor deve ser positivo').max(999_999_999, 'Valor muito alto'),
	dueDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de vencimento deve estar no formato YYYY-MM-DD'),
	description: z.string().max(255).optional(),
	externalReference: z.string().max(100).optional(),
	installmentCount: z.number().int().positive().max(12).optional(),
	installmentValue: z.number().positive().optional(),
	totalValue: z.number().positive().optional(),
	discount: z
		.object({
			value: z.number().positive(),
			dueDateLimitDays: z.number().int().positive(),
			type: z.enum(['FIXED', 'PERCENTAGE']),
		})
		.optional(),
	fine: z
		.object({
			value: z.number().positive(),
			type: z.enum(['FIXED', 'PERCENTAGE']),
		})
		.optional(),
	interest: z
		.object({
			value: z.number().positive(),
			type: z.literal('PERCENTAGE'),
		})
		.optional(),
	postalService: z.boolean().optional(),
});

/**
 * Subscription payload validation schema
 */
export const AsaasSubscriptionPayloadSchema = z.object({
	customer: z.string().min(1, 'ID do cliente é obrigatório'),
	billingType: z.enum(['BOLETO', 'CREDIT_CARD', 'DEBIT_CARD', 'PIX', 'UNDEFINED']),
	value: z.number().positive('Valor deve ser positivo').max(999_999_999, 'Valor muito alto'),
	nextDueDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Data de vencimento deve estar no formato YYYY-MM-DD'),
	cycle: z.enum(['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'SEMIANNUALLY', 'YEARLY']),
	description: z.string().max(255).optional(),
	externalReference: z.string().max(100).optional(),
	updatePendingPayments: z.boolean().optional(),
	discount: z
		.object({
			value: z.number().positive(),
			dueDateLimitDays: z.number().int().positive(),
			type: z.enum(['FIXED', 'PERCENTAGE']),
		})
		.optional(),
	fine: z
		.object({
			value: z.number().positive(),
			type: z.enum(['FIXED', 'PERCENTAGE']),
		})
		.optional(),
	interest: z
		.object({
			value: z.number().positive(),
			type: z.literal('PERCENTAGE'),
		})
		.optional(),
});

/**
 * Import options validation schema
 */
export const ImportOptionsSchema = z.object({
	initiatedBy: z.string().min(1, 'Initiator é obrigatório'),
	startDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
		.optional(),
	endDate: z
		.string()
		.regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD')
		.optional(),
	status: z.string().optional(),
});

// ═══════════════════════════════════════════════════════
// TYPE EXPORTS
// ═══════════════════════════════════════════════════════

export type AsaasCustomerPayload = z.infer<typeof AsaasCustomerPayloadSchema>;
export type AsaasPaymentPayload = z.infer<typeof AsaasPaymentPayloadSchema>;
export type AsaasSubscriptionPayload = z.infer<typeof AsaasSubscriptionPayloadSchema>;
export type ImportOptions = z.infer<typeof ImportOptionsSchema>;
