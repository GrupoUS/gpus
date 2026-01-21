/**
 * Student Import Mutation
 * Bulk import students from CSV/XLSX with LGPD compliance
 * Supports UPSERT (create or update) and automatic enrollment creation
 */

import { v } from 'convex/values';

import type { Doc, Id } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';
import { mutation } from './_generated/server';
import { logAudit } from './lgpd';
import { getOrganizationId } from './lib/auth';
import { encrypt, encryptCPF } from './lib/encryption';

const NON_DIGIT_REGEX = /\\D/g;
const CPF_INVALID_PATTERN_REGEX = /^(\\d)\\1{10}$/;

type StudentDoc = Doc<'students'>;

type PaymentStatus = 'em_dia' | 'atrasado' | 'quitado' | 'cancelado';
interface StudentImportContact {
	name?: string;
	email?: string;
	phone?: string;
}

interface ImportCounters {
	successCount: number;
	failureCount: number;
	createdCount: number;
	updatedCount: number;
	skippedCount: number;
}

interface ImportLookupMaps {
	emailToStudent: Map<string, StudentDoc>;
	cpfToStudent: Map<string, StudentDoc>;
	phoneToStudent: Map<string, StudentDoc>;
}

interface ExistingStudentMatch {
	existing?: StudentDoc;
	existingByCP?: StudentDoc;
	existingByPhone?: StudentDoc;
}

interface UpsertStudentResult {
	studentId: Id<'students'>;
	action: 'created' | 'updated';
}

interface StudentImportRow extends StudentImportContact {
	name: string;
	phone: string;
	profession?: string;
	hasClinic?: boolean;
	status?: 'ativo' | 'inativo' | 'pausado' | 'formado';
	cpf?: string;
	clinicName?: string;
	clinicCity?: string;
	professionalId?: string;
	birthDate?: number;
	address?: string;
	addressNumber?: string;
	complement?: string;
	neighborhood?: string;
	city?: string;
	state?: string;
	zipCode?: string;
	country?: string;
	saleDate?: number;
	salesperson?: string;
	contractStatus?: string;
	leadSource?: string;
	cohort?: string;
	totalValue?: number;
	installments?: number;
	installmentValue?: number;
	paymentStatus?: string;
	paidInstallments?: number;
	startDate?: number;
}

interface StudentImportValidationRow extends StudentImportContact {
	cpf?: string;
}

type StudentUpsertData = Omit<Doc<'students'>, '_id' | '_creationTime' | 'createdAt'> & {
	createdAt?: number;
};

const normalizeEmailValue = (email?: string) => email?.trim().toLowerCase();
const normalizePhoneValue = (phone: string) => phone.replace(NON_DIGIT_REGEX, '');
const normalizePhoneValueOptional = (phone?: string) => {
	if (!phone) return '';
	return normalizePhoneValue(phone);
};
const normalizeCpfValue = (cpf?: string) => {
	if (!cpf) return undefined;
	return cpf.replace(NON_DIGIT_REGEX, '');
};

const buildLookupMaps = (students: StudentDoc[]): ImportLookupMaps => {
	const emailToStudent = new Map<string, StudentDoc>();
	const cpfToStudent = new Map<string, StudentDoc>();
	const phoneToStudent = new Map<string, StudentDoc>();

	for (const student of students) {
		if (student.email) {
			emailToStudent.set(student.email.toLowerCase(), student);
		}
		if (student.cpf) {
			cpfToStudent.set(student.cpf.replace(NON_DIGIT_REGEX, ''), student);
		}
		phoneToStudent.set(normalizePhoneValue(student.phone), student);
	}

	return { emailToStudent, cpfToStudent, phoneToStudent };
};

const assertBulkImportRequiredFields = (student: StudentImportContact) => {
	const rowErrors: string[] = [];
	validateImportRequiredFields(student, rowErrors);
	if (rowErrors.length > 0) {
		throw new Error(rowErrors[0]);
	}
};

const findExistingStudentMatch = (options: {
	lookup: ImportLookupMaps;
	normalizedCpf?: string;
	normalizedPhone: string;
	normalizedEmail?: string;
}): ExistingStudentMatch => {
	const { lookup, normalizedCpf, normalizedPhone, normalizedEmail } = options;
	const existingByCP = normalizedCpf ? lookup.cpfToStudent.get(normalizedCpf) : undefined;
	const existingByPhone = lookup.phoneToStudent.get(normalizedPhone);
	const existingByEmail = normalizedEmail ? lookup.emailToStudent.get(normalizedEmail) : undefined;
	const existing = existingByCP || existingByPhone || existingByEmail;

	return {
		existing,
		existingByCP,
		existingByPhone,
	};
};

const normalizeBulkImportIdentifiers = (student: StudentImportRow) => ({
	normalizedEmail: normalizeEmailValue(student.email),
	normalizedPhone: normalizePhoneValue(student.phone),
	normalizedCpf: normalizeCpfValue(student.cpf),
});

const shouldSkipDueToBatchDuplicates = (options: {
	normalizedEmail?: string;
	normalizedPhone: string;
	normalizedCpf?: string;
	processedEmails: Set<string>;
	processedPhones: Set<string>;
	processedCPFs: Set<string>;
	results: ImportRowResult[];
	rowNumber: number;
	warnings: string[];
	counters: ImportCounters;
}) => {
	const {
		normalizedEmail,
		normalizedPhone,
		normalizedCpf,
		processedEmails,
		processedPhones,
		processedCPFs,
		results,
		rowNumber,
		warnings,
		counters,
	} = options;

	if (
		handleBatchEmailDuplicate(
			normalizedEmail,
			processedEmails,
			results,
			rowNumber,
			warnings,
			counters,
		)
	) {
		return true;
	}
	if (
		handleBatchPhoneDuplicate(
			normalizedPhone,
			processedPhones,
			results,
			rowNumber,
			warnings,
			counters,
		)
	) {
		return true;
	}
	if (
		handleBatchCpfDuplicate(normalizedCpf, processedCPFs, results, rowNumber, warnings, counters)
	) {
		return true;
	}

	return false;
};

const ensureSameOrganization = (options: {
	existing?: StudentDoc;
	organizationId: string;
	results: ImportRowResult[];
	rowNumber: number;
	warnings: string[];
	counters: ImportCounters;
}) => {
	const { existing, organizationId, results, rowNumber, warnings, counters } = options;
	if (!existing) return true;
	if (existing.organizationId === organizationId) return true;

	pushFailureResult(
		results,
		rowNumber,
		'Conflito de organização: aluno pertence a outra organização',
		warnings,
		counters,
		'skipped',
	);
	return false;
};

const buildStudentData = async (options: {
	organizationId: string;
	student: StudentImportRow;
	normalizedEmail?: string;
	normalizedPhone: string;
	normalizedCpf?: string;
}): Promise<StudentUpsertData> => {
	const { organizationId, student, normalizedEmail, normalizedPhone, normalizedCpf } = options;
	let encryptedEmailValue: string | undefined;
	if (normalizedEmail) {
		encryptedEmailValue = await encrypt(normalizedEmail);
	}
	const encryptedPhoneValue = await encrypt(normalizedPhone);
	let encryptedCPFValue: string | undefined;
	if (student.cpf) {
		encryptedCPFValue = await encryptCPF(student.cpf);
	}

	const studentData = {
		organizationId,
		name: student.name?.trim() ?? '',
		email: normalizedEmail,
		phone: normalizedPhone,
		profession: student.profession ?? 'outro',
		hasClinic: student.hasClinic ?? false,
		status: student.status || ('ativo' as const),
		churnRisk: 'baixo' as const,
		encryptedEmail: encryptedEmailValue,
		encryptedPhone: encryptedPhoneValue,
		encryptedCPF: encryptedCPFValue,
		cpf: normalizedCpf,
		clinicName: student.clinicName,
		clinicCity: student.clinicCity,
		professionalId: student.professionalId,
		birthDate: student.birthDate,
		address: student.address,
		addressNumber: student.addressNumber,
		complement: student.complement,
		neighborhood: student.neighborhood,
		city: student.city,
		state: student.state,
		zipCode: student.zipCode,
		country: student.country,
		saleDate: student.saleDate,
		salesperson: student.salesperson,
		contractStatus: student.contractStatus,
		leadSource: student.leadSource,
		cohort: student.cohort,
		updatedAt: Date.now(),
	};

	return studentData;
};

const updateExistingStudent = async (options: {
	ctx: MutationCtx;
	existing: StudentDoc;
	studentData: StudentUpsertData;
	fileName: string;
	rowNumber: number;
	identitySubject: string;
	warnings: string[];
}) => {
	const { ctx, existing, studentData, fileName, rowNumber, identitySubject, warnings } = options;
	await ctx.db.patch(existing._id, studentData);
	await logAudit(ctx, {
		studentId: existing._id,
		actionType: 'data_modification',
		dataCategory: 'personal_data',
		description: `Student updated from CSV import: ${fileName}`,
		legalBasis: 'contract_execution',
		metadata: {
			importSource: 'csv_upload',
			fileName,
			rowNumber,
			importedBy: identitySubject,
			action: 'update',
		},
	});
	if (!warnings.includes('Aluno existente atualizado')) {
		warnings.push('Aluno existente atualizado');
	}
};

const insertNewStudent = async (options: {
	ctx: MutationCtx;
	studentData: StudentUpsertData;
	fileName: string;
	rowNumber: number;
	identitySubject: string;
	normalizedEmail?: string;
	normalizedPhone: string;
	lookup: ImportLookupMaps;
}): Promise<Id<'students'>> => {
	const {
		ctx,
		studentData,
		fileName,
		rowNumber,
		identitySubject,
		normalizedEmail,
		normalizedPhone,
		lookup,
	} = options;
	const newStudentData: Omit<Doc<'students'>, '_id' | '_creationTime'> = {
		...studentData,
		createdAt: Date.now(),
	};
	const newStudentId = await ctx.db.insert('students', newStudentData);

	if (normalizedEmail) {
		const newStudentRecord = {
			...newStudentData,
			// biome-ignore lint/style/useNamingConvention: Convex document field.
			_id: newStudentId,
			// biome-ignore lint/style/useNamingConvention: Convex document field.
			_creationTime: Date.now(),
		} as StudentDoc;
		lookup.emailToStudent.set(normalizedEmail, newStudentRecord);
	}
	lookup.phoneToStudent.set(normalizedPhone, {
		...newStudentData,
		// biome-ignore lint/style/useNamingConvention: Convex document field.
		_id: newStudentId,
		// biome-ignore lint/style/useNamingConvention: Convex document field.
		_creationTime: Date.now(),
	} as StudentDoc);

	await logAudit(ctx, {
		studentId: newStudentId,
		actionType: 'data_creation',
		dataCategory: 'personal_data',
		description: `Student imported from CSV: ${fileName}`,
		legalBasis: 'contract_execution',
		metadata: {
			importSource: 'csv_upload',
			fileName,
			rowNumber,
			importedBy: identitySubject,
			action: 'create',
		},
	});

	return newStudentId;
};

const upsertStudentRecord = async (options: {
	ctx: MutationCtx;
	match: ExistingStudentMatch;
	upsertMode: boolean;
	studentData: StudentUpsertData;
	fileName: string;
	rowNumber: number;
	identitySubject: string;
	normalizedEmail?: string;
	normalizedPhone: string;
	lookup: ImportLookupMaps;
	results: ImportRowResult[];
	warnings: string[];
	counters: ImportCounters;
}): Promise<UpsertStudentResult | null> => {
	const {
		ctx,
		match,
		upsertMode,
		studentData,
		fileName,
		rowNumber,
		identitySubject,
		normalizedEmail,
		normalizedPhone,
		lookup,
		results,
		warnings,
		counters,
	} = options;
	const { existing, existingByCP, existingByPhone } = match;

	if (existing) {
		if (!upsertMode) {
			const identifier = getDuplicateIdentifier({
				existingByCPF: existingByCP,
				existingByPhone,
			});
			pushFailureResult(
				results,
				rowNumber,
				`${identifier} já cadastrado (ignorado)`,
				warnings,
				counters,
				'skipped',
			);
			return null;
		}

		await updateExistingStudent({
			ctx,
			existing,
			studentData,
			fileName,
			rowNumber,
			identitySubject,
			warnings,
		});
		return { studentId: existing._id, action: 'updated' };
	}

	const studentId = await insertNewStudent({
		ctx,
		studentData,
		fileName,
		rowNumber,
		identitySubject,
		normalizedEmail,
		normalizedPhone,
		lookup,
	});

	return { studentId, action: 'created' };
};

const resolveInstallmentValue = (student: StudentImportRow) => {
	if (student.installmentValue !== undefined) return student.installmentValue;
	const totalValue = student.totalValue || 0;
	const installments = student.installments || 1;
	if (totalValue > 0) {
		return totalValue / installments;
	}
	return 0;
};

const upsertEnrollment = async (options: {
	ctx: MutationCtx;
	studentId: Id<'students'>;
	student: StudentImportRow;
	product: Doc<'enrollments'>['product'];
	warnings: string[];
}) => {
	const { ctx, studentId, student, product, warnings } = options;
	const existingEnrollment = await ctx.db
		.query('enrollments')
		.withIndex('by_student', (q) => q.eq('studentId', studentId))
		.filter((q) => q.eq(q.field('product'), product))
		.first();

	const enrollmentData = {
		studentId,
		product,
		status: 'ativo' as const,
		totalValue: student.totalValue || 0,
		installments: student.installments || 1,
		installmentValue: resolveInstallmentValue(student),
		paymentStatus: normalizePaymentStatus(student.paymentStatus),
		paidInstallments: student.paidInstallments || 0,
		startDate: student.startDate,
		cohort: student.cohort,
		updatedAt: Date.now(),
	};

	if (existingEnrollment) {
		await ctx.db.patch(existingEnrollment._id, enrollmentData);
		warnings.push(`Matrícula existente para ${product} atualizada`);
		return;
	}

	await ctx.db.insert('enrollments', {
		...enrollmentData,
		createdAt: Date.now(),
	});
};

const buildWarningList = (warnings: string[]) => {
	if (warnings.length > 0) {
		return warnings;
	}
	return undefined;
};

const pushFailureResult = (
	results: ImportRowResult[],
	rowNumber: number,
	message: string,
	warnings: string[],
	counters: ImportCounters,
	action?: ImportRowResult['action'],
) => {
	results.push({
		rowNumber,
		success: false,
		action,
		error: message,
		warnings: buildWarningList(warnings),
	});
	if (action === 'skipped') {
		counters.skippedCount++;
	}
	counters.failureCount++;
};

const pushSuccessResult = (
	results: ImportRowResult[],
	rowNumber: number,
	studentId: Id<'students'>,
	action: 'created' | 'updated',
	warnings: string[],
	counters: ImportCounters,
) => {
	results.push({
		rowNumber,
		success: true,
		studentId,
		action,
		warnings: buildWarningList(warnings),
	});
	counters.successCount++;
	if (action === 'created') {
		counters.createdCount++;
	} else {
		counters.updatedCount++;
	}
};

const handleBatchEmailDuplicate = (
	normalizedEmail: string | undefined,
	processedEmails: Set<string>,
	results: ImportRowResult[],
	rowNumber: number,
	warnings: string[],
	counters: ImportCounters,
) => {
	if (!normalizedEmail) return false;
	if (processedEmails.has(normalizedEmail)) {
		warnings.push('Email duplicado dentro do mesmo arquivo');
		pushFailureResult(
			results,
			rowNumber,
			'Email duplicado no arquivo (ignorado)',
			warnings,
			counters,
			'skipped',
		);
		return true;
	}
	processedEmails.add(normalizedEmail);
	return false;
};

const handleBatchPhoneDuplicate = (
	normalizedPhone: string,
	processedPhones: Set<string>,
	results: ImportRowResult[],
	rowNumber: number,
	warnings: string[],
	counters: ImportCounters,
) => {
	if (processedPhones.has(normalizedPhone)) {
		warnings.push('Telefone duplicado dentro do mesmo arquivo');
		pushFailureResult(
			results,
			rowNumber,
			'Telefone duplicado no arquivo (ignorado)',
			warnings,
			counters,
			'skipped',
		);
		return true;
	}
	processedPhones.add(normalizedPhone);
	return false;
};

const handleBatchCpfDuplicate = (
	normalizedCPF: string | undefined,
	processedCPFs: Set<string>,
	results: ImportRowResult[],
	rowNumber: number,
	warnings: string[],
	counters: ImportCounters,
) => {
	if (!normalizedCPF) return false;
	if (!validateCPF(normalizedCPF)) {
		pushFailureResult(
			results,
			rowNumber,
			`CPF inválido: ${normalizedCPF}. Verifique os dígitos verificadores.`,
			warnings,
			counters,
		);
		return true;
	}
	if (processedCPFs.has(normalizedCPF)) {
		warnings.push('CPF duplicado dentro do mesmo arquivo');
		pushFailureResult(
			results,
			rowNumber,
			'CPF duplicado no arquivo (ignorado)',
			warnings,
			counters,
			'skipped',
		);
		return true;
	}
	processedCPFs.add(normalizedCPF);
	return false;
};

const getDuplicateIdentifier = (options: {
	existingByCPF?: StudentDoc;
	existingByPhone?: StudentDoc;
}): 'CPF' | 'Telefone' | 'Email' => {
	if (options.existingByCPF) return 'CPF';
	if (options.existingByPhone) return 'Telefone';
	return 'Email';
};

const getValidationIdentifier = (options: {
	hasCPF: boolean;
	hasPhone: boolean;
}): 'CPF' | 'Telefone' | 'Email' => {
	if (options.hasCPF) return 'CPF';
	if (options.hasPhone) return 'Telefone';
	return 'Email';
};

const validateImportRequiredFields = (student: StudentImportContact, rowErrors: string[]) => {
	if (!student.name || student.name.trim().length < 2) {
		rowErrors.push('Nome é obrigatório e deve ter pelo menos 2 caracteres');
	}
	if (student.email && !student.email.includes('@')) {
		rowErrors.push('Email inválido (deve conter @)');
	}
	if (!student.phone || normalizePhoneValueOptional(student.phone).length < 10) {
		rowErrors.push('Telefone é obrigatório e deve ter pelo menos 10 dígitos');
	}
};

const validateImportPhoneDuplicates = (
	normalizedPhone: string,
	seenPhones: Set<string>,
	rowErrors: string[],
) => {
	if (!normalizedPhone) return;
	if (seenPhones.has(normalizedPhone)) {
		rowErrors.push(`Telefone duplicado no arquivo: ${normalizedPhone}`);
		return;
	}
	seenPhones.add(normalizedPhone);
};

const validateImportEmailDuplicates = (
	normalizedEmail: string | undefined,
	seenEmails: Set<string>,
	duplicateEmails: string[],
	rowErrors: string[],
) => {
	if (!normalizedEmail) return;
	if (seenEmails.has(normalizedEmail)) {
		rowErrors.push(`Email duplicado no arquivo: ${normalizedEmail}`);
		if (!duplicateEmails.includes(normalizedEmail)) {
			duplicateEmails.push(normalizedEmail);
		}
		return;
	}
	seenEmails.add(normalizedEmail);
};

const checkExistingStudentForImport = (options: {
	normalizedCpf?: string;
	normalizedPhone: string;
	normalizedEmail?: string;
	existingCPFs: Set<string>;
	existingPhones: Set<string>;
	existingEmails: Set<string>;
}): boolean => {
	if (options.normalizedCpf && options.existingCPFs.has(options.normalizedCpf)) {
		return true;
	}
	if (options.normalizedPhone && options.existingPhones.has(options.normalizedPhone)) {
		return true;
	}
	if (options.normalizedEmail && options.existingEmails.has(options.normalizedEmail)) {
		return true;
	}
	return false;
};

const validateImportCpfDuplicates = (options: {
	normalizedCpf?: string;
	cpfValue?: string;
	seenCPFs: Set<string>;
	existingCPFs: Set<string>;
	upsertMode: boolean;
	duplicateCPFs: string[];
	rowErrors: string[];
}) => {
	const { normalizedCpf, cpfValue, seenCPFs, existingCPFs, upsertMode, duplicateCPFs, rowErrors } =
		options;
	if (!(normalizedCpf && cpfValue)) return;

	if (seenCPFs.has(normalizedCpf)) {
		rowErrors.push(`CPF duplicado no arquivo: ${cpfValue}`);
		if (!duplicateCPFs.includes(cpfValue)) {
			duplicateCPFs.push(cpfValue);
		}
	} else if (existingCPFs.has(normalizedCpf) && !upsertMode) {
		rowErrors.push(`CPF já cadastrado: ${cpfValue}`);
		if (!duplicateCPFs.includes(cpfValue)) {
			duplicateCPFs.push(cpfValue);
		}
	}

	seenCPFs.add(normalizedCpf);
};

const validateImportRow = (options: {
	student: StudentImportValidationRow;
	rowNumber: number;
	upsertMode: boolean;
	existingCPFs: Set<string>;
	existingPhones: Set<string>;
	existingEmails: Set<string>;
	seenCPFs: Set<string>;
	seenPhones: Set<string>;
	seenEmails: Set<string>;
	duplicateEmails: string[];
	duplicateCPFs: string[];
}) => {
	const {
		student,
		upsertMode,
		existingCPFs,
		existingPhones,
		existingEmails,
		seenCPFs,
		seenPhones,
		seenEmails,
		duplicateEmails,
		duplicateCPFs,
	} = options;
	const rowErrors: string[] = [];
	let willUpdateDelta = 0;
	let willCreateDelta = 0;

	validateImportRequiredFields(student, rowErrors);

	const normalizedPhone = normalizePhoneValueOptional(student.phone);
	const normalizedEmail = normalizeEmailValue(student.email);
	const normalizedCpf = normalizeCpfValue(student.cpf);

	validateImportPhoneDuplicates(normalizedPhone, seenPhones, rowErrors);
	validateImportEmailDuplicates(normalizedEmail, seenEmails, duplicateEmails, rowErrors);

	const studentExists = checkExistingStudentForImport({
		normalizedCpf,
		normalizedPhone,
		normalizedEmail,
		existingCPFs,
		existingPhones,
		existingEmails,
	});

	if (studentExists) {
		if (upsertMode) {
			willUpdateDelta = 1;
		} else {
			const identifier = getValidationIdentifier({
				hasCPF: !!normalizedCpf && existingCPFs.has(normalizedCpf),
				hasPhone: !!normalizedPhone && existingPhones.has(normalizedPhone),
			});
			rowErrors.push(`${identifier} já cadastrado`);
		}
	} else {
		willCreateDelta = 1;
	}

	validateImportCpfDuplicates({
		normalizedCpf,
		cpfValue: student.cpf,
		seenCPFs,
		existingCPFs,
		upsertMode,
		duplicateCPFs,
		rowErrors,
	});

	return { rowErrors, willUpdateDelta, willCreateDelta };
};

/**
 * Validate Brazilian CPF using the official algorithm
 * CPF must have 11 digits and pass the check digit verification
 */
function validateCPF(cpf: string): boolean {
	if (!cpf) return false;

	// Remove formatting
	const cleaned = cpf.replace(NON_DIGIT_REGEX, '');

	// Must be 11 digits
	if (cleaned.length !== 11) return false;

	// Check for known invalid patterns (all same digits)
	if (CPF_INVALID_PATTERN_REGEX.test(cleaned)) return false;

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
	v.literal('na_mesa_certa'),
);

// Define student import data shape
const studentImportData = v.object({
	// Required fields
	name: v.string(),
	email: v.optional(v.string()),
	phone: v.string(),
	// Optional fields (profession/hasClinic have defaults applied during import)
	profession: v.optional(v.string()),
	hasClinic: v.optional(v.boolean()),

	// Optional fields
	cpf: v.optional(v.string()),
	clinicName: v.optional(v.string()),
	clinicCity: v.optional(v.string()),
	status: v.optional(
		v.union(v.literal('ativo'), v.literal('inativo'), v.literal('pausado'), v.literal('formado')),
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
	status: string | undefined,
): 'em_dia' | 'atrasado' | 'quitado' | 'cancelado' {
	if (!status) return 'em_dia';

	const normalized = status.trim().toLowerCase();
	const statusEntries = [
		['em_dia', 'em_dia'],
		['em dia', 'em_dia'],
		['adimplente', 'em_dia'],
		['regular', 'em_dia'],
		['atrasado', 'atrasado'],
		['inadimplente', 'atrasado'],
		['atraso', 'atrasado'],
		['quitado', 'quitado'],
		['pago', 'quitado'],
		['finalizado', 'quitado'],
		['cancelado', 'cancelado'],
		['cancelamento', 'cancelado'],
	] satisfies [string, PaymentStatus][];
	const statusMap = new Map(statusEntries);

	return statusMap.get(normalized) ?? 'em_dia';
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
		args,
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

		// Capture organizationId from authenticated user
		const organizationId = await getOrganizationId(ctx);

		const upsertMode = args.upsertMode !== false; // Default to true

		const results: ImportRowResult[] = [];
		const counters: ImportCounters = {
			successCount: 0,
			failureCount: 0,
			createdCount: 0,
			updatedCount: 0,
			skippedCount: 0,
		};

		// Pre-fetch existing students for duplicate checking
		const existingStudents = await ctx.db
			.query('students')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
			.collect();
		const lookup = buildLookupMaps(existingStudents);

		// Track emails/CPFs/phones processed in this batch
		const processedEmails = new Set<string>();
		const processedCPFs = new Set<string>();
		const processedPhones = new Set<string>();

		// Process each student
		for (let i = 0; i < args.students.length; i++) {
			const student: StudentImportRow = args.students[i];
			const rowNumber = i + 2; // +2 because row 1 is header, and arrays are 0-indexed
			const warnings: string[] = [];

			try {
				assertBulkImportRequiredFields(student);

				const identifiers = normalizeBulkImportIdentifiers(student);

				if (
					shouldSkipDueToBatchDuplicates({
						...identifiers,
						processedEmails,
						processedPhones,
						processedCPFs,
						results,
						rowNumber,
						warnings,
						counters,
					})
				) {
					continue;
				}

				const match = findExistingStudentMatch({
					lookup,
					normalizedCpf: identifiers.normalizedCpf,
					normalizedPhone: identifiers.normalizedPhone,
					normalizedEmail: identifiers.normalizedEmail,
				});

				if (
					!ensureSameOrganization({
						existing: match.existing,
						organizationId,
						results,
						rowNumber,
						warnings,
						counters,
					})
				) {
					continue;
				}

				const studentData = await buildStudentData({
					organizationId,
					student,
					normalizedEmail: identifiers.normalizedEmail,
					normalizedPhone: identifiers.normalizedPhone,
					normalizedCpf: identifiers.normalizedCpf,
				});

				const upsertResult = await upsertStudentRecord({
					ctx,
					match,
					upsertMode,
					studentData,
					fileName: args.fileName,
					rowNumber,
					identitySubject: identity.subject,
					normalizedEmail: identifiers.normalizedEmail,
					normalizedPhone: identifiers.normalizedPhone,
					lookup,
					results,
					warnings,
					counters,
				});

				if (!upsertResult) {
					continue;
				}

				const { studentId, action } = upsertResult;

				// ==========================================
				// Create or update enrollment for this student + product
				// ==========================================

				// Find existing enrollment for this student + product
				await upsertEnrollment({
					ctx,
					studentId,
					student,
					product: args.product,
					warnings,
				});

				pushSuccessResult(results, rowNumber, studentId, action, warnings, counters);
			} catch (error) {
				let errorMessage = 'Erro desconhecido';
				if (error instanceof Error) {
					errorMessage = error.message;
				}

				pushFailureResult(results, rowNumber, errorMessage, warnings, counters);
			}
		}

		return {
			totalRows: args.students.length,
			successCount: counters.successCount,
			failureCount: counters.failureCount,
			createdCount: counters.createdCount,
			updatedCount: counters.updatedCount,
			skippedCount: counters.skippedCount,
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
		args,
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

		// Capture organizationId from authenticated user
		const organizationId = await getOrganizationId(ctx);

		const upsertMode = args.upsertMode !== false;

		// Fetch existing data for duplicate detection
		const existingStudents = await ctx.db
			.query('students')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
			.collect();
		const existingEmails = new Set<string>(
			existingStudents.flatMap((student) => (student.email ? [student.email.toLowerCase()] : [])),
		);
		const existingCPFs = new Set<string>(
			existingStudents.flatMap((student) =>
				student.cpf ? [student.cpf.replace(NON_DIGIT_REGEX, '')] : [],
			),
		);
		const existingPhones = new Set<string>(
			existingStudents.map((student) => normalizePhoneValue(student.phone)),
		);

		const errors: Array<{ rowNumber: number; errors: string[] }> = [];
		const duplicateEmails: string[] = [];
		const duplicateCPFs: string[] = [];
		const seenEmails = new Set<string>();
		const seenCPFs = new Set<string>();
		const seenPhones = new Set<string>();
		let validRows = 0;
		let invalidRows = 0;
		let willUpdate = 0;
		let willCreate = 0;

		for (let i = 0; i < args.students.length; i++) {
			const student = args.students[i];
			const rowNumber = i + 2;
			const { rowErrors, willUpdateDelta, willCreateDelta } = validateImportRow({
				student,
				rowNumber,
				upsertMode,
				existingCPFs,
				existingPhones,
				existingEmails,
				seenCPFs,
				seenPhones,
				seenEmails,
				duplicateEmails,
				duplicateCPFs,
			});

			willUpdate += willUpdateDelta;
			willCreate += willCreateDelta;

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
