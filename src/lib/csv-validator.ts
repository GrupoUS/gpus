/**
 * CSV/XLSX Validation Utilities
 * Validates and normalizes data for student imports
 */

import { getIntelligentMappings } from './import-intelligence';

// CPF Validation - Brazilian Individual Taxpayer Registry
export function validateCPF(cpf: string): boolean {
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

// Normalize CPF - remove formatting
export function normalizeCPF(cpf: string): string {
	return cpf.replace(/\D/g, '');
}

// Format CPF with dots and dash
export function formatCPF(cpf: string): string {
	const cleaned = normalizeCPF(cpf);
	return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

// Email Validation
export function validateEmail(email: string): boolean {
	if (!email) return false;

	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email.trim().toLowerCase());
}

// Normalize Email
export function normalizeEmail(email: string): string {
	return email.trim().toLowerCase();
}

// Phone Validation - Brazilian format (10-11 digits)
export function validatePhone(phone: string): boolean {
	if (!phone) return false;

	const cleaned = phone.replace(/\D/g, '');

	// Brazilian phone: 10 digits (landline) or 11 digits (mobile)
	return cleaned.length >= 10 && cleaned.length <= 11;
}

// Normalize Phone - remove formatting
export function normalizePhone(phone: string): string {
	return phone.replace(/\D/g, '');
}

// Format Phone with Brazilian mask
export function formatPhone(phone: string): string {
	const cleaned = normalizePhone(phone);
	if (cleaned.length === 11) {
		return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
	}
	return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
}

// ==========================================
// CEP Validation - Brazilian Postal Code
// ==========================================

/**
 * Validate Brazilian CEP (postal code)
 * Format: 8 digits, typically displayed as XXXXX-XXX
 */
export function validateCEP(cep: string): boolean {
	if (!cep) return false;
	const cleaned = cep.replace(/\D/g, '');
	// Must be exactly 8 digits
	if (cleaned.length !== 8) return false;
	// Cannot be all zeros
	if (/^0+$/.test(cleaned)) return false;
	return true;
}

/**
 * Normalize CEP - remove formatting, keep only digits
 */
export function normalizeCEP(cep: string): string {
	return cep.replace(/\D/g, '');
}

/**
 * Format CEP with hyphen (XXXXX-XXX)
 */
export function formatCEP(cep: string): string {
	const cleaned = normalizeCEP(cep);
	if (cleaned.length !== 8) return cleaned;
	return cleaned.replace(/(\d{5})(\d{3})/, '$1-$2');
}

// ==========================================
// UF Validation - Brazilian States
// ==========================================

export const BRAZILIAN_STATES = [
	'AC',
	'AL',
	'AP',
	'AM',
	'BA',
	'CE',
	'DF',
	'ES',
	'GO',
	'MA',
	'MT',
	'MS',
	'MG',
	'PA',
	'PB',
	'PR',
	'PE',
	'PI',
	'RJ',
	'RN',
	'RS',
	'RO',
	'RR',
	'SC',
	'SP',
	'SE',
	'TO',
] as const;

type BrazilianState = (typeof BRAZILIAN_STATES)[number];

/**
 * Validate Brazilian state abbreviation (UF)
 */
export function validateUF(uf: string): boolean {
	if (!uf) return false;
	const normalized = uf.trim().toUpperCase();
	return BRAZILIAN_STATES.includes(normalized as BrazilianState);
}

/**
 * Normalize UF - trim and uppercase
 */
export function normalizeUF(uf: string): string {
	return uf.trim().toUpperCase();
}

// Detect CSV delimiter
export function detectCSVDelimiter(content: string): string {
	const firstLine = content.split('\n')[0] || '';
	const delimiters = [',', ';', '\t', '|'];

	let maxCount = 0;
	let detected = ',';

	for (const delimiter of delimiters) {
		const count = (firstLine.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
		if (count > maxCount) {
			maxCount = count;
			detected = delimiter;
		}
	}

	return detected;
}

// Profession mapping from Portuguese variations to schema values
const PROFESSION_MAP: Record<string, string> = {
	enfermagem: 'enfermeiro',
	enfermeiro: 'enfermeiro',
	enfermeira: 'enfermeiro',
	dentista: 'dentista',
	odontologia: 'dentista',
	odontologo: 'dentista',
	odontólogo: 'dentista',
	biomedico: 'biomedico',
	biomédico: 'biomedico',
	biomédica: 'biomedico',
	biomedica: 'biomedico',
	biomedicina: 'biomedico',
	farmaceutico: 'farmaceutico',
	farmacêutico: 'farmaceutico',
	farmacêutica: 'farmaceutico',
	farmaceutica: 'farmaceutico',
	farmácia: 'farmaceutico',
	farmacia: 'farmaceutico',
	medico: 'medico',
	médico: 'medico',
	médica: 'medico',
	medica: 'medico',
	medicina: 'medico',
	esteticista: 'esteticista',
	estética: 'esteticista',
	estetica: 'esteticista',
	fisioterapeuta: 'outro',
	fisioterapia: 'outro',
};

export function normalizeProfession(profession: string): string {
	if (!profession) return 'outro';

	const normalized = profession.trim().toLowerCase();
	return PROFESSION_MAP[normalized] || 'outro';
}

// Status normalization
const STATUS_MAP: Record<string, string> = {
	ativo: 'ativo',
	ativa: 'ativo',
	active: 'ativo',
	inativo: 'inativo',
	inativa: 'inativo',
	inactive: 'inativo',
	pausado: 'pausado',
	pausada: 'pausado',
	paused: 'pausado',
	formado: 'formado',
	formada: 'formado',
	concluido: 'formado',
	concluído: 'formado',
	graduated: 'formado',
	assinado: 'ativo', // Contract signed = active
};

export function normalizeStatus(status: string): 'ativo' | 'inativo' | 'pausado' | 'formado' {
	if (!status) return 'ativo';

	const normalized = status.trim().toLowerCase();
	return (STATUS_MAP[normalized] as 'ativo' | 'inativo' | 'pausado' | 'formado') || 'ativo';
}

// Boolean from various Portuguese/English values
export function parseBoolean(value: string | boolean | undefined): boolean {
	if (typeof value === 'boolean') return value;
	if (!value) return false;

	const normalized = String(value).trim().toLowerCase();
	return ['sim', 'yes', 'true', '1', 's', 'y', 'verdadeiro'].includes(normalized);
}

// Date parsing from various formats
export function parseDate(value: string | number | undefined): number | undefined {
	if (!value) return undefined;

	// Excel serial date
	if (typeof value === 'number') {
		// Excel dates start from 1900-01-01 (day 1)
		// But Excel has a bug where 1900 is treated as leap year, so subtract 2
		const excelEpoch = new Date(1899, 11, 30);
		return excelEpoch.getTime() + value * 24 * 60 * 60 * 1000;
	}

	const str = String(value).trim();

	// DD/MM/YYYY format
	const brFormat = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;
	const match = str.match(brFormat);
	if (match) {
		const [, day, month, year] = match;
		const date = new Date(
			Number.parseInt(year, 10),
			Number.parseInt(month, 10) - 1,
			Number.parseInt(day, 10),
		);
		return date.getTime();
	}

	// Try standard Date parsing
	const parsed = new Date(str);
	if (!Number.isNaN(parsed.getTime())) {
		return parsed.getTime();
	}

	return undefined;
}

// Header mapping from Portuguese to schema fields
const HEADER_MAP: Record<string, string> = {
	// Name variations
	nome: 'name',
	'nome completo': 'name',
	aluno: 'name',

	// Email variations
	email: 'email',
	'e-mail': 'email',
	'correio eletrônico': 'email',

	// Phone variations
	telefone: 'phone',
	celular: 'phone',
	whatsapp: 'phone',
	contato: 'phone',

	// CPF variations
	cpf: 'cpf',
	documento: 'cpf',
	'documento cpf': 'cpf',

	// Profession variations
	graduação: 'profession',
	graduacao: 'profession',
	profissão: 'profession',
	profissao: 'profession',
	formação: 'profession',
	formacao: 'profession',

	// Clinic variations
	'tem clínica': 'hasClinic',
	'tem clinica': 'hasClinic',
	clinica: 'hasClinic',

	'nome clínica': 'clinicName',
	'nome clinica': 'clinicName',
	'clínica nome': 'clinicName',
	'clinica nome': 'clinicName',

	'cidade clínica': 'clinicCity',
	'cidade clinica': 'clinicCity',

	// Status variations
	status: 'status',
	'status contrato': 'contractStatus',
	situacao: 'status',
	situação: 'status',

	// Address variations
	endereço: 'address',
	endereco: 'address',
	rua: 'address',
	logradouro: 'address',

	número: 'addressNumber',
	numero: 'addressNumber',
	nº: 'addressNumber',

	complemento: 'complement',

	bairro: 'neighborhood',

	cidade: 'city',
	municipio: 'city',
	município: 'city',

	estado: 'state',
	uf: 'state',

	cep: 'zipCode',
	'código postal': 'zipCode',
	'codigo postal': 'zipCode',

	país: 'country',
	pais: 'country',

	// Birth date
	'data nasc': 'birthDate',
	'data de nascimento': 'birthDate',
	nascimento: 'birthDate',
	'data nascimento': 'birthDate',

	// Sale variations
	'data da venda': 'saleDate',
	'data venda': 'saleDate',

	vendedor: 'salesperson',
	vendedora: 'salesperson',

	// Lead source
	'origem lead': 'leadSource',
	origem: 'leadSource',
	fonte: 'leadSource',

	// Turma/Cohort
	turma: 'cohort',

	// Financial fields (for enrollments)
	'valor total': 'totalValue',
	valor_total: 'totalValue',
	valortotal: 'totalValue',
	'total value': 'totalValue',
	total: 'totalValue',

	parcelas: 'installments',
	'número de parcelas': 'installments',
	'numero de parcelas': 'installments',
	'qtd parcelas': 'installments',
	installments: 'installments',

	'valor parcela': 'installmentValue',
	valor_parcela: 'installmentValue',
	valorparcela: 'installmentValue',
	'installment value': 'installmentValue',

	'status pagamento': 'paymentStatus',
	status_pagamento: 'paymentStatus',
	'payment status': 'paymentStatus',
	pagamento: 'paymentStatus',

	'parcelas pagas': 'paidInstallments',
	parcelas_pagas: 'paidInstallments',
	'paid installments': 'paidInstallments',

	'data início': 'startDate',
	'data inicio': 'startDate',
	data_inicio: 'startDate',
	'start date': 'startDate',
	inicio: 'startDate',

	// Professional ID
	registro: 'professionalId',
	'registro profissional': 'professionalId',
	coren: 'professionalId',
	cro: 'professionalId',
	crm: 'professionalId',
	crf: 'professionalId',
};

export function mapCSVHeaders(
	headers: string[],
	rows: Record<string, unknown>[] = [],
): Record<string, string> {
	const mapping: Record<string, string> = {};

	// Use intelligent mapping if rows are provided to analyze patterns
	if (rows.length > 0) {
		const intelligentMap = getIntelligentMappings(headers, rows);

		for (const [header, suggestion] of Object.entries(intelligentMap)) {
			// Only apply if confidence is decent enough to be a default
			if (suggestion.confidence > 0.5) {
				mapping[header] = suggestion.schemaField;
			}
		}
	}

	// Fallback/Overwrite with exact dictionary matches (historically trusted)
	for (const header of headers) {
		const normalized = header.trim().toLowerCase();

		if (HEADER_MAP[normalized]) {
			mapping[header] = HEADER_MAP[normalized];
		}
	}

	return mapping;
}

// Get all available schema fields for mapping UI
export function getSchemaFields(): { value: string; label: string; required: boolean }[] {
	return [
		{ value: 'name', label: 'Nome', required: true },
		{ value: 'email', label: 'Email', required: true },
		{ value: 'phone', label: 'Telefone', required: true },
		{ value: 'cpf', label: 'CPF', required: false },
		{ value: 'profession', label: 'Profissão', required: false },
		{ value: 'hasClinic', label: 'Tem Clínica', required: false },
		{ value: 'clinicName', label: 'Nome da Clínica', required: false },
		{ value: 'clinicCity', label: 'Cidade da Clínica', required: false },
		{ value: 'status', label: 'Status', required: false },
		{ value: 'birthDate', label: 'Data de Nascimento', required: false },
		{ value: 'address', label: 'Endereço', required: false },
		{ value: 'addressNumber', label: 'Número', required: false },
		{ value: 'complement', label: 'Complemento', required: false },
		{ value: 'neighborhood', label: 'Bairro', required: false },
		{ value: 'city', label: 'Cidade', required: false },
		{ value: 'state', label: 'Estado', required: false },
		{ value: 'zipCode', label: 'CEP', required: false },
		{ value: 'country', label: 'País', required: false },
		{ value: 'saleDate', label: 'Data da Venda', required: false },
		{ value: 'salesperson', label: 'Vendedor', required: false },
		{ value: 'contractStatus', label: 'Status do Contrato', required: false },
		{ value: 'leadSource', label: 'Origem do Lead', required: false },
		{ value: 'cohort', label: 'Turma', required: false },
		// Financial/Enrollment fields
		{ value: 'totalValue', label: 'Valor Total', required: false },
		{ value: 'installments', label: 'Parcelas', required: false },
		{ value: 'installmentValue', label: 'Valor da Parcela', required: false },
		{ value: 'paymentStatus', label: 'Status Pagamento', required: false },
		{ value: 'paidInstallments', label: 'Parcelas Pagas', required: false },
		{ value: 'startDate', label: 'Data de Início', required: false },
		{ value: 'professionalId', label: 'Registro Profissional', required: false },
		{ value: '_skip', label: '-- Ignorar --', required: false },
	];
}

// Validation result type
export interface ValidationResult {
	isValid: boolean;
	errors: string[];
	warnings: string[];
	data: Record<string, unknown>;
}

// Field validator type
type FieldValidator = (
	value: unknown,
	rowNumber: number,
	errors: string[],
	warnings: string[],
	data: Record<string, unknown>,
	schemaField: string,
) => void;

// Individual field validators
const validateNameField: FieldValidator = (value, rowNumber, errors, _warnings, data) => {
	if (!value || String(value).trim().length < 2) {
		errors.push(`Linha ${rowNumber}: Nome é obrigatório e deve ter pelo menos 2 caracteres`);
	} else {
		data.name = String(value).trim();
	}
};

const validateEmailField: FieldValidator = (value, rowNumber, errors, _warnings, data) => {
	// Email is now optional - only validate format if provided
	if (value) {
		if (validateEmail(String(value))) {
			data.email = normalizeEmail(String(value));
		} else {
			errors.push(`Linha ${rowNumber}: Email inválido: ${value}`);
		}
	}
	// If value is empty/undefined, email is simply not set (optional field)
};

const validatePhoneField: FieldValidator = (value, rowNumber, errors, warnings, data) => {
	if (value) {
		if (!validatePhone(String(value))) {
			warnings.push(`Linha ${rowNumber}: Telefone pode estar em formato inválido: ${value}`);
		}
		data.phone = normalizePhone(String(value));
	} else {
		errors.push(`Linha ${rowNumber}: Telefone é obrigatório`);
	}
};

const validateCPFField: FieldValidator = (value, rowNumber, _errors, warnings, data) => {
	if (value) {
		const cpfStr = String(value);
		if (!validateCPF(cpfStr)) {
			warnings.push(`Linha ${rowNumber}: CPF inválido: ${value}`);
		}
		data.cpf = normalizeCPF(cpfStr);
	}
};

const validateDateField: FieldValidator = (
	value,
	_rowNumber,
	_errors,
	_warnings,
	data,
	schemaField,
) => {
	if (value) {
		const parsed = parseDate(value as string | number);
		if (parsed) {
			data[schemaField] = parsed;
		}
	}
};

const validateDefaultField: FieldValidator = (
	value,
	_rowNumber,
	_errors,
	_warnings,
	data,
	schemaField,
) => {
	if (value !== undefined && value !== null && value !== '') {
		data[schemaField] = String(value).trim();
	}
};

// Field validators map
const FIELD_VALIDATORS: Record<string, FieldValidator> = {
	name: validateNameField,
	email: validateEmailField,
	phone: validatePhoneField,
	cpf: validateCPFField,
	profession: (value, _rn, _e, _w, data) => {
		data.profession = normalizeProfession(String(value || ''));
	},
	hasClinic: (value, _rn, _e, _w, data) => {
		data.hasClinic = parseBoolean(value as string | boolean | undefined);
	},
	status: (value, _rn, _e, _w, data) => {
		data.status = normalizeStatus(String(value || ''));
	},
	birthDate: validateDateField,
	saleDate: validateDateField,
};

// Validate a single row of data
export function validateRow(
	row: Record<string, unknown>,
	rowNumber: number,
	mapping: Record<string, string>,
): ValidationResult {
	const errors: string[] = [];
	const warnings: string[] = [];
	const data: Record<string, unknown> = {};

	for (const [csvHeader, schemaField] of Object.entries(mapping)) {
		if (schemaField === '_skip') continue;

		const value = row[csvHeader];
		const validator = FIELD_VALIDATORS[schemaField] || validateDefaultField;
		validator(value, rowNumber, errors, warnings, data, schemaField);
	}

	// Set defaults for required boolean fields
	if (data.hasClinic === undefined) {
		data.hasClinic = false;
	}

	return {
		isValid: errors.length === 0,
		errors,
		warnings,
		data,
	};
}

// ==========================================
// Financial Field Utilities
// ==========================================

// Payment status normalization map
const PAYMENT_STATUS_MAP: Record<string, 'em_dia' | 'atrasado' | 'quitado' | 'cancelado'> = {
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

/**
 * Normalize payment status from various inputs to valid enum value
 */
export function normalizePaymentStatus(
	status: string | undefined,
): 'em_dia' | 'atrasado' | 'quitado' | 'cancelado' {
	if (!status) return 'em_dia';
	const normalized = status.trim().toLowerCase();
	return PAYMENT_STATUS_MAP[normalized] || 'em_dia';
}

/**
 * Parse monetary value from Brazilian format (R$ 1.234,56)
 * Handles both Brazilian (1.234,56) and international (1,234.56) formats
 */
export function parseMonetary(value: string | number | undefined): number {
	if (!value) return 0;
	if (typeof value === 'number') return value;

	// Remove R$ prefix and spaces
	let cleaned = value.replace(/[R$\s]/g, '');

	// Detect format: Brazilian uses comma as decimal separator
	// Check if there's a comma after the last period (Brazilian format)
	const lastComma = cleaned.lastIndexOf(',');
	const lastPeriod = cleaned.lastIndexOf('.');

	if (lastComma > lastPeriod) {
		// Brazilian format: 1.234,56 → remove periods, replace comma with period
		cleaned = cleaned.replace(/\./g, '').replace(',', '.');
	} else if (lastPeriod > lastComma) {
		// International format: 1,234.56 → just remove commas
		cleaned = cleaned.replace(/,/g, '');
	} else if (lastComma !== -1) {
		// Only comma, likely Brazilian decimal: 1234,56
		cleaned = cleaned.replace(',', '.');
	}

	const parsed = Number.parseFloat(cleaned);
	return Number.isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse integer value (for installments, paidInstallments, etc.)
 */
export function parseInteger(value: string | number | undefined): number {
	if (!value) return 0;
	if (typeof value === 'number') return Math.floor(value);
	const parsed = Number.parseInt(String(value).replace(/\D/g, ''), 10);
	return Number.isNaN(parsed) ? 0 : parsed;
}
