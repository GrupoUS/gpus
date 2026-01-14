/**
 * Comprehensive Input Validation System
 *
 * Provides validation and sanitization for all Convex inputs
 * to prevent injection attacks and ensure data integrity.
 */

import { v } from 'convex/values'
import { z } from 'zod'

/**
 * Validation schemas for different data types
 */
export const validationSchemas = {
	// Lead validation
	lead: z.object({
		name: z.string().min(1).max(100).regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Nome inválido'),
		email: z.string().email('E-mail inválido').optional(),
		phone: z.string()
			.regex(/^[1-9]\d{10,14}$/, 'Telefone deve ter 11-15 dígitos começando com 1-9')
			.transform(phone => {
				// Clean phone to digits only
				return phone.replace(/[^\d]/g, '')
			}),
		source: z.enum(['whatsapp', 'instagram', 'landing_page', 'indicacao', 'evento', 'organico', 'trafego_pago', 'outro']),
		sourceDetail: z.string().max(200).optional(),
		profession: z.enum(['enfermeiro', 'dentista', 'biomedico', 'farmaceutico', 'medico', 'esteticista', 'outro']).optional(),
		hasClinic: z.boolean().optional(),
		clinicName: z.string().max(100).optional(),
		clinicCity: z.string().max(50).optional(),
		yearsInAesthetics: z.number().min(0).max(50).optional(),
		interestedProduct: z.enum(['trintae3', 'otb', 'black_neon', 'comunidade', 'auriculo', 'na_mesa_certa', 'indefinido']).optional(),
		stage: z.enum(['novo', 'primeiro_contato', 'qualificado', 'proposta', 'negociacao', 'fechado_ganho', 'fechado_perdido']),
		organizationId: z.string().min(1),
	}),

	// Marketing lead capture validation
	marketingLead: z.object({
		name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
		email: z.string().email('Email inválido'),
		phone: z.string()
			.regex(/^\(\d{2}\) \d{5}-\d{4}$/, 'Formato: (11) 99999-9999')
			.transform(phone => phone.replace(/[^\d]/g, '')),
		interest: z.enum([
			'Harmonização Facial',
			'Estética Corporal',
			'Bioestimuladores',
			'Outros'
		]),
		message: z.string().max(500, 'Mensagem deve ter no máximo 500 caracteres').optional(),
		lgpdConsent: z.boolean().refine(val => val === true, {
			message: 'Você deve aceitar os termos'
		}),
		whatsappConsent: z.boolean().default(false),
		honeypot: z.string().max(0, 'Invalid submission').optional(), // Must be empty
		utmSource: z.string().optional(),
		utmCampaign: z.string().optional(),
		utmMedium: z.string().optional(),
	}),

	// Student validation
	student: z.object({
		name: z.string().min(1).max(100).regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Nome inválido'),
		email: z.string().email('E-mail inválido'),
		phone: z.string()
			.regex(/^[1-9]\d{10,14}$/, 'Telefone deve ter 11-15 dígitos começando com 1-9')
			.transform(phone => phone.replace(/[^\d]/g, '')),
		cpf: z.string()
			.regex(/^\d{11}$/, 'CPF deve ter 11 dígitos')
			.refine(cpf => isValidCPF(cpf), 'CPF inválido')
			.transform(cpf => cpf.replace(/[^\d]/g, '')),
		profession: z.string().min(1).max(50),
		professionalId: z.string().max(20).optional(),
		hasClinic: z.boolean(),
		clinicName: z.string().max(100).optional(),
		clinicCity: z.string().max(50).optional(),
		status: z.enum(['ativo', 'inativo', 'pausado', 'formado']),
	}),

	// User validation
	user: z.object({
		clerkId: z.string().min(1),
		email: z.string().email('E-mail inválido'),
		name: z.string().min(1).max(100).regex(/^[a-zA-ZÀ-ÿ\s'-]+$/, 'Nome inválido'),
		role: z.enum(['admin', 'sdr', 'cs', 'support']),
		isActive: z.boolean(),
		organizationId: z.string().optional(),
	}),

	// Message validation
	message: z.object({
		conversationId: z.string().min(1),
		content: z.string().min(1).max(2000),
		contentType: z.enum(['text', 'image', 'audio', 'document', 'template']),
		mediaUrl: z.string().url('URL inválida').optional(),
		sender: z.enum(['client', 'agent', 'bot', 'system']),
	}),

	// Search validation
	search: z.object({
		query: z.string().min(1).max(200)
			.transform(query => sanitizeSearchQuery(query)),
		type: z.enum(['leads', 'students', 'conversations', 'messages']),
		limit: z.number().min(1).max(100).default(20),
		cursor: z.string().optional(),
	}),
} as const

/**
 * Sanitizes search queries to prevent injection
 */
export function sanitizeSearchQuery(query: string): string {
	// Remove potentially dangerous characters
	return query
		.replace(/[<>"'%;()&+]/g, '') // Remove HTML/script injection characters
		.replace(/\s+/g, ' ') // Normalize whitespace
		.trim()
}

/**
 * Validates and sanitizes input data
 */
export function validateInput<T>(
	schema: z.ZodSchema<T>,
	input: unknown
): { success: true; data: T } | { success: false; error: string } {
	try {
		const data = schema.parse(input)
		return { success: true, data }
	} catch (error) {
		if (error instanceof z.ZodError) {
			const errorMessages = error.issues.map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
			return {
				success: false,
				error: `Validation failed: ${errorMessages.join(', ')}`
			}
		}
		return {
			success: false,
			error: 'Validation failed: Unknown error'
		}
	}
}

/**
 * CPF validation algorithm (official Brazilian validator)
 */
export function isValidCPF(cpf: string): boolean {
	// Remove non-digits
	cpf = cpf.replace(/[^\d]/g, '')

	// Check length
	if (cpf.length !== 11) return false

	// Check if all digits are the same (invalid CPFs)
	if (/^(\d)\1{10}$/.test(cpf)) return false

	// Validate first check digit
	let sum = 0
	for (let i = 0; i < 9; i++) {
		sum += parseInt(cpf[i]) * (10 - i)
	}
	let checkDigit = 11 - (sum % 11)
	if (checkDigit > 9) checkDigit = 0
	if (checkDigit !== parseInt(cpf[9])) return false

	// Validate second check digit
	sum = 0
	for (let i = 0; i < 10; i++) {
		sum += parseInt(cpf[i]) * (11 - i)
	}
	checkDigit = 11 - (sum % 11)
	if (checkDigit > 9) checkDigit = 0
	if (checkDigit !== parseInt(cpf[10])) return false

	return true
}

/**
 * Validates email format more strictly
 */
export function isValidEmail(email: string): boolean {
	const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
	return emailRegex.test(email)
}

/**
 * Validates Brazilian phone number
 */
export function isValidPhone(phone: string): boolean {
	// Remove all non-digits
	const cleanPhone = phone.replace(/[^\d]/g, '')

	// Check length: 10 or 11 digits (landline or mobile)
	if (cleanPhone.length !== 10 && cleanPhone.length !== 11) {
		return false
	}

	// Check if starts with valid area code (mobile starts with 9)
	if (cleanPhone.length === 11 && !cleanPhone.startsWith('9')) {
		// Could be landline, allow it
	}

	// Check if starts with valid Brazil country code (if international)
	if (cleanPhone.length > 11 && !cleanPhone.startsWith('55')) {
		return false
	}

	return true
}

/**
 * Validates dates within reasonable ranges
 */
export function isValidDateRange(startDate: number, endDate: number): boolean {
	const start = new Date(startDate)
	const end = new Date(endDate)
	const now = new Date()

	// Start date should be in the past or present
	if (start > now) {
		return false
	}

	// End date should be after start date
	if (end <= start) {
		return false
	}

	// End date should be reasonable (not more than 10 years in future)
	const maxFutureDate = new Date()
	maxFutureDate.setFullYear(maxFutureDate.getFullYear() + 10)

	if (end > maxFutureDate) {
		return false
	}

	return true
}

/**
 * Validates file uploads for security
 */
export function validateFileUpload(file: {
	name: string
	size: number
	type: string
}): { valid: boolean; error?: string } {
	// Check file size (max 10MB)
	const maxSize = 10 * 1024 * 1024
	if (file.size > maxSize) {
		return {
			valid: false,
			error: 'File size exceeds maximum limit of 10MB'
		}
	}

	// Check file extension
	const allowedExtensions = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif']
	const fileExtension = file.name.toLowerCase().slice(file.name.lastIndexOf('.'))

	if (!allowedExtensions.includes(fileExtension)) {
		return {
			valid: false,
			error: 'File type not allowed'
		}
	}

	// Check MIME type
	const allowedMimeTypes = [
		'application/pdf',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
		'image/jpeg',
		'image/png',
		'image/gif'
	]

	if (!allowedMimeTypes.includes(file.type)) {
		return {
			valid: false,
			error: 'MIME type not allowed'
		}
	}

	// Check for dangerous file names
	const dangerousPatterns = [
		/\.(exe|bat|cmd|scr|pif|com)$/i,
		/(con|prn|aux|nul)\./i,
		/[<>"|:*?]/,
	]

	if (dangerousPatterns.some(pattern => pattern.test(file.name))) {
		return {
			valid: false,
			error: 'File name contains dangerous characters'
		}
	}

	return { valid: true }
}

/**
 * Rate limiting validation
 */
export class RateLimiter {
	private attempts: Map<string, number[]> = new Map()

	constructor(
		private maxAttempts: number = 10,
		private windowMs: number = 60000 // 1 minute
	) {}

	/**
	 * Checks if request is allowed
	 */
	public isAllowed(key: string): boolean {
		const now = Date.now()
		const attempts = this.attempts.get(key) || []

		// Clean old attempts
		const recentAttempts = attempts.filter(timestamp =>
			timestamp > now - this.windowMs
		)

		// Check if under limit
		if (recentAttempts.length >= this.maxAttempts) {
			return false
		}

		// Add current attempt
		recentAttempts.push(now)
		this.attempts.set(key, recentAttempts)

		return true
	}

	/**
	 * Gets remaining attempts
	 */
	public getRemainingAttempts(key: string): number {
		const now = Date.now()
		const attempts = this.attempts.get(key) || []

		const recentAttempts = attempts.filter(timestamp =>
			timestamp > now - this.windowMs
		)

		return Math.max(0, this.maxAttempts - recentAttempts.length)
	}

	/**
	 * Gets time until next allowed request
	 */
	public getResetTime(key: string): number {
		const now = Date.now()
		const attempts = this.attempts.get(key) || []

		if (attempts.length === 0) {
			return 0
		}

		const oldestRecentAttempt = attempts
			.filter(timestamp => timestamp > now - this.windowMs)
			.sort((a, b) => a - b)[0]

		return Math.max(0, oldestRecentAttempt + this.windowMs - now)
	}
}

/**
 * Default rate limiter instances
 */
export const rateLimiters = {
	login: new RateLimiter(5, 900000), // 5 attempts per 15 minutes
	contact: new RateLimiter(20, 3600000), // 20 attempts per hour
	dataExport: new RateLimiter(3, 86400000), // 3 exports per day
	passwordReset: new RateLimiter(3, 3600000), // 3 attempts per hour
	marketingLeadCapture: new RateLimiter(5, 3600000), // 5 submissions per hour
} as const

/**
 * Validation middleware wrapper for Convex functions
 */
export function withValidation<T>(
	schema: z.ZodSchema<T>,
	handler: (ctx: any, data: T) => Promise<any>
) {
	return async (ctx: any, data: unknown) => {
		const validation = validateInput(schema, data)

		if (!validation.success) {
			throw new Error(`Validation failed: ${validation.error}`)
		}

		return await handler(ctx, validation.data)
	}
}

/**
 * Convex-compatible validation schemas
 * Note: Convex `v` uses simple validators without chained methods
 */
export const convexValidationSchemas = {
	name: v.string(),
	email: v.optional(v.string()),
	phone: v.string(),
	cpf: v.optional(v.string()),
	organizationId: v.string(),
	stage: v.union(
		v.literal('novo'),
		v.literal('primeiro_contato'),
		v.literal('qualificado'),
		v.literal('proposta'),
		v.literal('negociacao'),
		v.literal('fechado_ganho'),
		v.literal('fechado_perdido')
	),
	status: v.union(
		v.literal('ativo'),
		v.literal('inativo'),
		v.literal('pausado'),
		v.literal('formado')
	),
} as const
