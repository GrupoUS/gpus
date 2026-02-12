/**
 * Lead CSV/XLSX Validator and Mapper
 * Utilities for importing leads from spreadsheets
 */

import { calculateStringSimilarity } from './import-intelligence';

// Available fields in the leads schema that can be mapped
export const LEAD_SCHEMA_FIELDS = [
	{ key: 'name', label: 'Nome', required: true },
	{ key: 'phone', label: 'Telefone', required: true },
	{ key: 'email', label: 'E-mail', required: false },
	{ key: 'profession', label: 'Profissão', required: false },
	{ key: 'message', label: 'Observações', required: false },
	{ key: 'clinicCity', label: 'Cidade', required: false },
	{ key: 'interestedProduct', label: 'Produto', required: false },
	{ key: 'source', label: 'Origem', required: false },
	{ key: 'lastContactAt', label: 'Data do Contato', required: false },
] as const;

export type LeadFieldKey = (typeof LEAD_SCHEMA_FIELDS)[number]['key'];

// Pre-configured mapping for OTB 2026 template
export const OTB_DEFAULT_MAPPING: Record<string, LeadFieldKey | null> = {
	NOME: 'name',
	TELEFONE: 'phone',
	'E-MAIL': 'email',
	EMAIL: 'email',
	CPF: null, // Skip
	GRADUAÇÃO: 'profession',
	'DATA DA ABORDAGEM': 'lastContactAt',
	VENDEDOR: null, // Skip (would need user lookup)
	ENDEREÇO: 'clinicCity',
	ESTADO: null, // Could append to clinicCity
	Observações: 'message',
	OBSERVAÇÕES: 'message',
	OBSERVACOES: 'message',
};

// Keywords for fuzzy matching headers to lead fields
const FIELD_KEYWORDS: Record<LeadFieldKey, string[]> = {
	name: ['nome', 'name', 'cliente', 'aluno', 'paciente', 'razao social'],
	phone: ['telefone', 'phone', 'celular', 'whatsapp', 'tel', 'fone', 'numero'],
	email: ['email', 'e-mail', 'mail', 'correio'],
	profession: ['profissao', 'graduacao', 'formacao', 'especialidade', 'area', 'cargo', 'ocupacao'],
	message: ['observacao', 'obs', 'mensagem', 'nota', 'comentario', 'anotacao'],
	clinicCity: ['cidade', 'city', 'endereco', 'address', 'local', 'municipio'],
	interestedProduct: ['produto', 'product', 'curso', 'interesse', 'servico'],
	source: ['origem', 'source', 'canal', 'captacao', 'como conheceu'],
	lastContactAt: ['data', 'date', 'contato', 'abordagem', 'registro'],
};

// Top-level regex patterns (required by Biome useTopLevelRegex)
const PHONE_PATTERN = /^[\d\s\-()+]{10,}$/;
const EMAIL_PATTERN = /@.*\./;
const BR_DATE_PATTERN = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/;

export interface MappingSuggestion {
	field: LeadFieldKey | null;
	confidence: number;
	reason: string;
}

/**
 * Auto-suggest field mappings for spreadsheet headers
 */
export function mapLeadHeaders(
	headers: string[],
	dataRows: Record<string, unknown>[] = [],
): Record<string, MappingSuggestion> {
	const mappings: Record<string, MappingSuggestion> = {};

	for (const header of headers) {
		const normalizedHeader = header.toLowerCase().trim();

		// First, check exact match in OTB default mapping
		const upperHeader = header.toUpperCase().trim();
		if (upperHeader in OTB_DEFAULT_MAPPING) {
			const field = OTB_DEFAULT_MAPPING[upperHeader];
			mappings[header] = {
				field,
				confidence: 1.0,
				reason: field ? 'Mapeamento padrão OTB' : 'Campo ignorado',
			};
			continue;
		}

		// Otherwise, do fuzzy matching
		let bestMatch: MappingSuggestion = {
			field: null,
			confidence: 0,
			reason: 'Nenhum mapeamento encontrado',
		};

		for (const [fieldKey, keywords] of Object.entries(FIELD_KEYWORDS)) {
			for (const keyword of keywords) {
				// Check if header contains keyword
				if (normalizedHeader.includes(keyword)) {
					const confidence = keyword.length / normalizedHeader.length;
					if (confidence > bestMatch.confidence) {
						bestMatch = {
							field: fieldKey as LeadFieldKey,
							confidence: Math.min(0.95, confidence + 0.3),
							reason: `Contém "${keyword}"`,
						};
					}
				}

				// Check similarity
				const similarity = calculateStringSimilarity(normalizedHeader, keyword);
				if (similarity > bestMatch.confidence && similarity > 0.5) {
					bestMatch = {
						field: fieldKey as LeadFieldKey,
						confidence: similarity,
						reason: `Similar a "${keyword}"`,
					};
				}
			}
		}

		// Data pattern detection for phone/email
		if (dataRows.length > 0 && bestMatch.confidence < 0.7) {
			const sampleValues = dataRows
				.slice(0, 10)
				.map((row) => row[header])
				.filter((v) => v != null && v !== '');

			// Phone pattern
			const phoneMatches = sampleValues.filter((v) => PHONE_PATTERN.test(String(v))).length;
			if (phoneMatches >= sampleValues.length * 0.7) {
				bestMatch = {
					field: 'phone',
					confidence: 0.85,
					reason: 'Padrão de telefone detectado',
				};
			}

			// Email pattern
			const emailMatches = sampleValues.filter((v) => EMAIL_PATTERN.test(String(v))).length;
			if (emailMatches >= sampleValues.length * 0.7) {
				bestMatch = {
					field: 'email',
					confidence: 0.9,
					reason: 'Padrão de e-mail detectado',
				};
			}
		}

		mappings[header] = bestMatch;
	}

	return mappings;
}

/**
 * Transform a raw spreadsheet row into lead data format
 */
export function transformLeadRow(
	row: Record<string, unknown>,
	mapping: Record<string, LeadFieldKey | null>,
): {
	name: string;
	phone: string;
	email?: string;
	profession?: string;
	message?: string;
	clinicCity?: string;
	interestedProduct?: string;
	source?: string;
	lastContactAt?: number;
} | null {
	const lead: Record<string, unknown> = {};

	for (const [header, field] of Object.entries(mapping)) {
		if (!field) continue;
		const value = row[header];
		if (value == null || value === '') continue;

		// Transform based on field type
		if (field === 'phone') {
			lead.phone = normalizePhone(String(value));
		} else if (field === 'lastContactAt') {
			lead.lastContactAt = parseDate(value);
		} else if (field === 'profession') {
			lead.profession = normalizeProfession(String(value));
		} else {
			lead[field] = String(value).trim();
		}
	}

	// Validate required fields
	if (!(lead.name && lead.phone)) {
		return null;
	}

	return lead as ReturnType<typeof transformLeadRow>;
}

/**
 * Normalize phone to international format
 */
function normalizePhone(phone: string): string {
	// Remove all non-digits
	let digits = phone.replace(/\D/g, '');

	// Brazilian phone: add country code if needed
	if (digits.length === 10 || digits.length === 11) {
		digits = `55${digits}`;
	}

	return digits;
}

/**
 * Parse date value (Excel serial or string)
 */
function parseDate(value: unknown): number | undefined {
	if (typeof value === 'number') {
		// Excel serial date (days since 1900-01-01)
		if (value > 40_000 && value < 50_000) {
			const excelEpoch = new Date(1899, 11, 30);
			return excelEpoch.getTime() + value * 24 * 60 * 60 * 1000;
		}
		// Already timestamp
		return value;
	}

	if (typeof value === 'string') {
		const parsed = Date.parse(value);
		if (!Number.isNaN(parsed)) {
			return parsed;
		}

		// Try DD/MM/YYYY format (common in Brazil)
		const brMatch = value.match(BR_DATE_PATTERN);
		if (brMatch) {
			const [, day, month, year] = brMatch;
			return new Date(Number(year), Number(month) - 1, Number(day)).getTime();
		}
	}

	return undefined;
}

/**
 * Normalize profession to valid enum value
 */
function normalizeProfession(profession: string): string {
	const normalized = profession.toLowerCase().trim();

	const professionMap: Record<string, string> = {
		biomedicina: 'biomedico',
		biomédico: 'biomedico',
		biomedico: 'biomedico',
		enfermagem: 'enfermeiro',
		enfermeiro: 'enfermeiro',
		enfermeira: 'enfermeiro',
		medicina: 'medico',
		médico: 'medico',
		medico: 'medico',
		farmácia: 'farmaceutico',
		farmacia: 'farmaceutico',
		farmacêutico: 'farmaceutico',
		farmaceutico: 'farmaceutico',
		fisioterapia: 'fisioterapeuta',
		fisioterapeuta: 'fisioterapeuta',
		odontologia: 'dentista',
		dentista: 'dentista',
		odontológico: 'dentista',
		esteticista: 'esteticista',
		estética: 'esteticista',
		nutrição: 'nutricionista',
		nutricionista: 'nutricionista',
	};

	return professionMap[normalized] ?? normalized;
}

/**
 * Validate a lead row and return errors
 */
export function validateLeadRow(
	row: ReturnType<typeof transformLeadRow>,
	index: number,
): { valid: boolean; errors: string[] } {
	const errors: string[] = [];

	if (!row) {
		return { valid: false, errors: ['Dados insuficientes'] };
	}

	if (!row.name || row.name.trim().length < 2) {
		errors.push(`Linha ${index + 1}: Nome muito curto ou ausente`);
	}

	if (!row.phone || row.phone.length < 10) {
		errors.push(`Linha ${index + 1}: Telefone inválido`);
	}

	if (row.email && !row.email.includes('@')) {
		errors.push(`Linha ${index + 1}: E-mail inválido`);
	}

	return { valid: errors.length === 0, errors };
}
