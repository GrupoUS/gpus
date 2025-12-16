/**
 * Student Import Mutation
 * Bulk import students from CSV/XLSX with LGPD compliance
 * Supports UPSERT (create or update) and automatic enrollment creation
 */

import { v } from 'convex/values';
import { mutation } from './_generated/server';
import { encrypt, encryptCPF } from './lib/encryption';
import { logAudit } from './lgpd';

/**
 * Validate Brazilian CPF using the official algorithm
 * CPF must have 11 digits and pass the check digit verification
 */
function validateCPF(cpf: string): boolean {
	if (!cpf) return false;

	// Remove formatting
	const cleaned = cpf.replace(/\D/g, '');

	// Must be 11 digits
	if (cleaned.length !== 11) return false;

	// Check for known invalid patterns (all same digits)
	if (/^(\d)\1{10}$/.test(cleaned)) return false;

	// Validate first check digit
	let sum = 0;
	for (let i = 0; i < 9; i++) {
		sum += Number.parseInt(cleaned.charAt(i), 10) * (10 - i);
	}
	let remainder = (sum * 10) % 11;
	if (remainder === 10 || remainder === 11) remainder = 0;
	if (remainder !== Number.parseInt(cleaned.charAt(9), 10)) return false;

	// Validate second check digit
	sum = 0;
	for (let i = 0; i < 10; i++) {
		sum += Number.parseInt(cleaned.charAt(i), 10) * (11 - i);
	}
	remainder = (sum * 10) % 11;
	if (remainder === 10 || remainder === 11) remainder = 0;
	if (remainder !== Number.parseInt(cleaned.charAt(10), 10)) return false;

	return true;
}

// Product options for enrollments
const productValidator = v.union(
	v.literal('trintae3'),
	v.literal('otb'),
	v.literal('black_neon'),
	v.literal('comunidade'),
	v.literal('auriculo'),
	v.literal('na_mesa_certa')
);

// Define student import data shape
const studentImportData = v.object({
	// Required fields
	name: v.string(),
	email: v.string(),
	phone: v.string(),
	profession: v.string(),
	hasClinic: v.boolean(),

	// Optional fields
	cpf: v.optional(v.string()),
	clinicName: v.optional(v.string()),
	clinicCity: v.optional(v.string()),
	status: v.optional(
		v.union(
			v.literal('ativo'),
			v.literal('inativo'),
			v.literal('pausado'),
			v.literal('formado')
		)
	),

	// Address fields
	birthDate: v.optional(v.number()),
	address: v.optional(v.string()),
	addressNumber: v.optional(v.string()),
	complement: v.optional(v.string()),
	neighborhood: v.optional(v.string()),
	city: v.optional(v.string()),
	state: v.optional(v.string()),
	zipCode: v.optional(v.string()),
	country: v.optional(v.string()),

	// Sale/Origin fields
	saleDate: v.optional(v.number()),
	salesperson: v.optional(v.string()),
	contractStatus: v.optional(v.string()),
	leadSource: v.optional(v.string()),
	cohort: v.optional(v.string()),

	// Financial/Enrollment fields
	totalValue: v.optional(v.number()),
	installments: v.optional(v.number()),
	installmentValue: v.optional(v.number()),
	paymentStatus: v.optional(v.string()),
	paidInstallments: v.optional(v.number()),
	startDate: v.optional(v.number()),
	professionalId: v.optional(v.string()),
});

// Import result for a single row
interface ImportRowResult {
	rowNumber: number;
	success: boolean;
	studentId?: string;
	action?: 'created' | 'updated' | 'skipped';
	error?: string;
	warnings?: string[];
}

// Normalize payment status from various inputs
function normalizePaymentStatus(
	status: string | undefined
): 'em_dia' | 'atrasado' | 'quitado' | 'cancelado' {
	if (!status) return 'em_dia';

	const normalized = status.trim().toLowerCase();
	const statusMap: Record<string, 'em_dia' | 'atrasado' | 'quitado' | 'cancelado'> = {
		em_dia: 'em_dia',
		'em dia': 'em_dia',
		adimplente: 'em_dia',
		regular: 'em_dia',
		atrasado: 'atrasado',
		inadimplente: 'atrasado',
		atraso: 'atrasado',
		quitado: 'quitado',
		pago: 'quitado',
		finalizado: 'quitado',
		cancelado: 'cancelado',
		cancelamento: 'cancelado',
	};

	return statusMap[normalized] || 'em_dia';
}

/**
 * Bulk import students from CSV/XLSX data
 * Handles validation, encryption, UPSERT logic, enrollment creation, and LGPD audit logging
 */
export const bulkImport = mutation({
	args: {
		students: v.array(studentImportData),
		fileName: v.string(),
		product: productValidator,
		upsertMode: v.optional(v.boolean()), // default true - update existing students
	},
	handler: async (
		ctx,
		args
	): Promise<{
		totalRows: number;
		successCount: number;
		failureCount: number;
		createdCount: number;
		updatedCount: number;
		skippedCount: number;
		results: ImportRowResult[];
	}> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Não autenticado');
		}

		const upsertMode = args.upsertMode !== false; // Default to true

		const results: ImportRowResult[] = [];
		let successCount = 0;
		let failureCount = 0;
		let createdCount = 0;
		let updatedCount = 0;
		let skippedCount = 0;

		// Pre-fetch existing students for duplicate checking
		const existingStudents = await ctx.db.query('students').collect();
		const emailToStudent = new Map(
			existingStudents.map((s) => [s.email.toLowerCase(), s])
		);
		const cpfToStudent = new Map(
			existingStudents.filter((s) => s.cpf).map((s) => [s.cpf?.replace(/\D/g, ''), s])
		);

		// Track emails/CPFs processed in this batch
		const processedEmails = new Set<string>();
		const processedCPFs = new Set<string>();

		// Process each student
		for (let i = 0; i < args.students.length; i++) {
			const student = args.students[i];
			const rowNumber = i + 2; // +2 because row 1 is header, and arrays are 0-indexed
			const warnings: string[] = [];

			try {
				// Validate required fields
				if (!student.name || student.name.trim().length < 2) {
					throw new Error('Nome é obrigatório e deve ter pelo menos 2 caracteres');
				}
				if (!student.email || !student.email.includes('@')) {
					throw new Error('Email é obrigatório e deve ser válido');
				}
				if (!student.phone || student.phone.replace(/\D/g, '').length < 10) {
					throw new Error('Telefone é obrigatório e deve ter pelo menos 10 dígitos');
				}
				if (!student.profession) {
					throw new Error('Profissão é obrigatória');
				}

				// Normalize email
				const normalizedEmail = student.email.trim().toLowerCase();

				// Check for duplicate within same batch
				if (processedEmails.has(normalizedEmail)) {
					warnings.push('Email duplicado dentro do mesmo arquivo');
					results.push({
						rowNumber,
						success: false,
						action: 'skipped',
						error: 'Email duplicado no arquivo (ignorado)',
						warnings,
					});
					failureCount++;
					skippedCount++;
					continue;
				}
				processedEmails.add(normalizedEmail);

					// Check for duplicate CPF within same batch
				if (student.cpf) {
					const normalizedCPF = student.cpf.replace(/\D/g, '');

					// Validate CPF format before proceeding
					if (!validateCPF(normalizedCPF)) {
						results.push({
							rowNumber,
							success: false,
							error: `CPF inválido: ${student.cpf}. Verifique os dígitos verificadores.`,
							warnings,
						});
						failureCount++;
						continue;
					}

					if (processedCPFs.has(normalizedCPF)) {
						warnings.push('CPF duplicado dentro do mesmo arquivo');
						results.push({
							rowNumber,
							success: false,
							action: 'skipped',
							error: 'CPF duplicado no arquivo (ignorado)',
							warnings,
						});
						failureCount++;
						skippedCount++;
						continue;
					}
					processedCPFs.add(normalizedCPF);
				}

				// Find existing student by email
				const existingStudent = emailToStudent.get(normalizedEmail);

				// Also check by CPF if provided
				let existingByCP = undefined;
				if (student.cpf) {
					const normalizedCPF = student.cpf.replace(/\D/g, '');
					existingByCP = cpfToStudent.get(normalizedCPF);
				}

				// Prepare student data
				const encryptedEmail = encrypt(normalizedEmail);
				const encryptedPhone = encrypt(student.phone.replace(/\D/g, ''));
				const encryptedCPF = student.cpf ? encryptCPF(student.cpf) : undefined;

				const studentData = {
					name: student.name.trim(),
					email: normalizedEmail,
					phone: student.phone.replace(/\D/g, ''),
					profession: student.profession,
					hasClinic: student.hasClinic,
					status: student.status || ('ativo' as const),
					churnRisk: 'baixo' as const,

					// Encrypted fields
					encryptedEmail,
					encryptedPhone,
					encryptedCPF,

					// Optional fields
					cpf: student.cpf ? student.cpf.replace(/\D/g, '') : undefined,
					clinicName: student.clinicName,
					clinicCity: student.clinicCity,
					professionalId: student.professionalId,

					// Address fields
					birthDate: student.birthDate,
					address: student.address,
					addressNumber: student.addressNumber,
					complement: student.complement,
					neighborhood: student.neighborhood,
					city: student.city,
					state: student.state,
					zipCode: student.zipCode,
					country: student.country,

					// Sale/Origin fields
					saleDate: student.saleDate,
					salesperson: student.salesperson,
					contractStatus: student.contractStatus,
					leadSource: student.leadSource,
					cohort: student.cohort,

					updatedAt: Date.now(),
				};

				let studentId: string;
				let action: 'created' | 'updated' | 'skipped';

				if (existingStudent || existingByCP) {
					// Student exists
					const existing = existingStudent || existingByCP;
					if (!existing) {
						throw new Error('Erro interno: student not found');
					}

					if (upsertMode) {
						// UPDATE existing student
						await ctx.db.patch(existing._id, studentData);
						studentId = existing._id;
						action = 'updated';
						updatedCount++;

						// Log LGPD audit for modification
						await logAudit(ctx, {
							studentId: existing._id,
							actionType: 'data_modification',
							dataCategory: 'personal_data',
							description: `Student updated from CSV import: ${args.fileName}`,
							legalBasis: 'contract_execution',
							metadata: {
								importSource: 'csv_upload',
								fileName: args.fileName,
								rowNumber,
								importedBy: identity.subject,
								action: 'update',
							},
						});

						warnings.push('Aluno existente atualizado');
					} else {
						// Skip duplicate
						results.push({
							rowNumber,
							success: false,
							action: 'skipped',
							studentId: existing._id,
							error: 'Email já cadastrado (ignorado)',
							warnings,
						});
						failureCount++;
						skippedCount++;
						continue;
					}
				} else {
					// CREATE new student
					const newStudentId = await ctx.db.insert('students', {
						...studentData,
						createdAt: Date.now(),
					});
					studentId = newStudentId;
					action = 'created';
					createdCount++;

					// Update lookup maps for subsequent rows in same batch
					emailToStudent.set(normalizedEmail, {
						...studentData,
						_id: newStudentId,
						_creationTime: Date.now(),
						createdAt: Date.now(),
					} as typeof existingStudents[0]);

					// Log LGPD audit for creation
					await logAudit(ctx, {
						studentId: newStudentId,
						actionType: 'data_creation',
						dataCategory: 'personal_data',
						description: `Student imported from CSV: ${args.fileName}`,
						legalBasis: 'contract_execution',
						metadata: {
							importSource: 'csv_upload',
							fileName: args.fileName,
							rowNumber,
							importedBy: identity.subject,
							action: 'create',
						},
					});
				}

				// ==========================================
				// Create or update enrollment for this student + product
				// ==========================================

				// Find existing enrollment for this student + product
				const existingEnrollment = await ctx.db
					.query('enrollments')
					.withIndex('by_student', (q) => q.eq('studentId', studentId as any))
					.filter((q) => q.eq(q.field('product'), args.product))
					.first();

				const normalizedPaymentStatus = normalizePaymentStatus(student.paymentStatus);
				const totalValue = student.totalValue || 0;
				const installments = student.installments || 1;
				const installmentValue =
					student.installmentValue || (totalValue > 0 ? totalValue / installments : 0);

				const enrollmentData = {
					studentId: studentId as any,
					product: args.product,
					status: 'ativo' as const,
					totalValue,
					installments,
					installmentValue,
					paymentStatus: normalizedPaymentStatus,
					paidInstallments: student.paidInstallments || 0,
					startDate: student.startDate,
					cohort: student.cohort,
					updatedAt: Date.now(),
				};

				if (existingEnrollment) {
					// Update existing enrollment
					await ctx.db.patch(existingEnrollment._id, enrollmentData);
					warnings.push(
						`Matrícula existente para ${args.product} atualizada`
					);
				} else {
					// Create new enrollment
					await ctx.db.insert('enrollments', {
						...enrollmentData,
						createdAt: Date.now(),
					});
				}

				results.push({
					rowNumber,
					success: true,
					studentId,
					action,
					warnings: warnings.length > 0 ? warnings : undefined,
				});
				successCount++;
			} catch (error) {
				const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
				results.push({
					rowNumber,
					success: false,
					error: errorMessage,
					warnings: warnings.length > 0 ? warnings : undefined,
				});
				failureCount++;
			}
		}

		return {
			totalRows: args.students.length,
			successCount,
			failureCount,
			createdCount,
			updatedCount,
			skippedCount,
			results,
		};
	},
});

/**
 * Validate import data before actual import
 * Used for preview and validation step
 */
export const validateImport = mutation({
	args: {
		students: v.array(studentImportData),
		product: productValidator,
		upsertMode: v.optional(v.boolean()),
	},
	handler: async (
		ctx,
		args
	): Promise<{
		valid: boolean;
		totalRows: number;
		validRows: number;
		invalidRows: number;
		duplicateEmails: string[];
		duplicateCPFs: string[];
		willUpdate: number;
		willCreate: number;
		errors: Array<{ rowNumber: number; errors: string[] }>;
	}> => {
		const identity = await ctx.auth.getUserIdentity();
		if (!identity) {
			throw new Error('Não autenticado');
		}

		const upsertMode = args.upsertMode !== false;

		// Fetch existing data for duplicate detection
		const existingStudents = await ctx.db.query('students').collect();
		const existingEmails = new Set(existingStudents.map((s) => s.email.toLowerCase()));
		const existingCPFs = new Set(
			existingStudents.filter((s) => s.cpf).map((s) => s.cpf?.replace(/\D/g, ''))
		);

		const errors: Array<{ rowNumber: number; errors: string[] }> = [];
		const duplicateEmails: string[] = [];
		const duplicateCPFs: string[] = [];
		const seenEmails = new Set<string>();
		const seenCPFs = new Set<string>();
		let validRows = 0;
		let invalidRows = 0;
		let willUpdate = 0;
		let willCreate = 0;

		for (let i = 0; i < args.students.length; i++) {
			const student = args.students[i];
			const rowNumber = i + 2;
			const rowErrors: string[] = [];

			// Validate required fields
			if (!student.name || student.name.trim().length < 2) {
				rowErrors.push('Nome é obrigatório e deve ter pelo menos 2 caracteres');
			}
			if (!student.email || !student.email.includes('@')) {
				rowErrors.push('Email é obrigatório e deve ser válido');
			} else {
				const normalizedEmail = student.email.trim().toLowerCase();

				// Check for duplicate in same file
				if (seenEmails.has(normalizedEmail)) {
					rowErrors.push(`Email duplicado no arquivo: ${normalizedEmail}`);
					if (!duplicateEmails.includes(normalizedEmail)) {
						duplicateEmails.push(normalizedEmail);
					}
				} else if (existingEmails.has(normalizedEmail)) {
					// Existing in database
					if (upsertMode) {
						willUpdate++;
					} else {
						rowErrors.push(`Email já cadastrado: ${normalizedEmail}`);
						if (!duplicateEmails.includes(normalizedEmail)) {
							duplicateEmails.push(normalizedEmail);
						}
					}
				} else {
					willCreate++;
				}
				seenEmails.add(normalizedEmail);
			}

			if (!student.phone || student.phone.replace(/\D/g, '').length < 10) {
				rowErrors.push('Telefone é obrigatório e deve ter pelo menos 10 dígitos');
			}
			if (!student.profession) {
				rowErrors.push('Profissão é obrigatória');
			}

			// Check CPF duplicates
			if (student.cpf) {
				const normalizedCPF = student.cpf.replace(/\D/g, '');
				if (seenCPFs.has(normalizedCPF)) {
					rowErrors.push(`CPF duplicado no arquivo: ${student.cpf}`);
					if (!duplicateCPFs.includes(student.cpf)) {
						duplicateCPFs.push(student.cpf);
					}
				} else if (existingCPFs.has(normalizedCPF) && !upsertMode) {
					rowErrors.push(`CPF já cadastrado: ${student.cpf}`);
					if (!duplicateCPFs.includes(student.cpf)) {
						duplicateCPFs.push(student.cpf);
					}
				}
				seenCPFs.add(normalizedCPF);
			}

			if (rowErrors.length > 0) {
				errors.push({ rowNumber, errors: rowErrors });
				invalidRows++;
			} else {
				validRows++;
			}
		}

		return {
			valid: invalidRows === 0,
			totalRows: args.students.length,
			validRows,
			invalidRows,
			duplicateEmails,
			duplicateCPFs,
			willUpdate,
			willCreate,
			errors,
		};
	},
});
