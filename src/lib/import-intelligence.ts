/**
 * Intelligent Import Utilities
 * Advanced algorithms for header detection and column mapping
 */

import { getSchemaFields } from './csv-validator';

// ============================================================================
// String Similarity Algorithms
// ============================================================================

/**
 * Calculate Levenshtein distance between two strings
 * Lower distance = more similar
 */
export function levenshteinDistance(a: string, b: string): number {
	if (a.length === 0) return b.length;
	if (b.length === 0) return a.length;

	const matrix = Array.from({ length: b.length + 1 }, (_, i) => [i]);
	for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

	for (let i = 1; i <= b.length; i++) {
		for (let j = 1; j <= a.length; j++) {
			if (b.charAt(i - 1) === a.charAt(j - 1)) {
				matrix[i][j] = matrix[i - 1][j - 1];
			} else {
				matrix[i][j] = Math.min(
					matrix[i - 1][j - 1] + 1, // substitution
					Math.min(
						matrix[i][j - 1] + 1, // insertion
						matrix[i - 1][j] + 1, // deletion
					),
				);
			}
		}
	}

	return matrix[b.length][a.length];
}

/**
 * Calculate similarity score (0 to 1) between two strings
 * 1 = exact match, 0 = no similarity
 */
export function calculateStringSimilarity(str1: string, str2: string): number {
	const s1 = normalizeString(str1);
	const s2 = normalizeString(str2);

	if (s1 === s2) return 1;
	if (!(s1 && s2)) return 0;

	// Check for containment (very common for headers like "Telefone Celular" containing "Celular")
	if (s1.includes(s2) || s2.includes(s1)) {
		return 0.9;
	}

	const distance = levenshteinDistance(s1, s2);
	const maxLength = Math.max(s1.length, s2.length);

	return 1 - distance / maxLength;
}

/**
 * Normalize string for comparison (remove accents, lowercase, trim)
 */
export function normalizeString(str: string): string {
	if (!str) return '';
	return str
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '') // Remove accents
		.trim()
		.replace(/[^a-z0-9]/g, ''); // Keep only alphanumeric
}

// ============================================================================
// Data Pattern Analysis
// ============================================================================

/**
 * Regex patterns for data type detection
 */
const DATA_PATTERNS = {
	email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
	cpf: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/,
	phone: /^(\(?\d{2}\)?\s?)?(9\s?)?\d{4}-?\d{4}$/,
	date: /^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/, // DD/MM/YYYY or similar
	money: /^R?\$?\s?\d{1,3}(\.?\d{3})*(,\d{2})?$/, // BRL format
	number: /^\d+([.,]\d+)?$/,
};

/**
 * Analyze a sample of values to determine the likely data type
 */
export function detectColumnType(values: unknown[]): string | null {
	const validValues = values
		.filter((v) => v !== null && v !== undefined && String(v).trim() !== '')
		.map(String);

	if (validValues.length === 0) return null;

	const scores = {
		email: 0,
		cpf: 0,
		phone: 0,
		date: 0,
		money: 0,
		number: 0,
	};

	for (const value of validValues) {
		if (DATA_PATTERNS.email.test(value)) scores.email++;
		if (DATA_PATTERNS.cpf.test(value)) scores.cpf++;
		if (DATA_PATTERNS.phone.test(value)) scores.phone++;
		if (DATA_PATTERNS.date.test(value)) scores.date++;
		if (DATA_PATTERNS.money.test(value)) scores.money++;
		if (DATA_PATTERNS.number.test(value)) scores.number++;
	}

	const threshold = validValues.length * 0.5; // At least 50% match
	const sortedScores = Object.entries(scores).sort((a, b) => b[1] - a[1]);

	if (sortedScores[0][1] >= threshold) {
		return sortedScores[0][0];
	}

	return null;
}

// ============================================================================
// Intelligent Mapping Logic
// ============================================================================

interface MappingSuggestion {
	schemaField: string;
	confidence: number; // 0 to 1
	reason: 'exact' | 'synonym' | 'pattern' | 'semantic' | 'manual';
}

/**
 * Calculate mapping score for a CSV header against a schema field
 */
export function calculateMappingScore(
	header: string,
	schemaField: { value: string; label: string },
	columnDataSample: unknown[] = [],
): MappingSuggestion {
	let score = 0;
	let reason: MappingSuggestion['reason'] = 'semantic';
	const normalizedHeader = normalizeString(header);

	// 1. Semantic Match (Name Similarity) - Weight: 60%
	// Check against field value (e.g., "email")
	const valueSim = calculateStringSimilarity(normalizedHeader, normalizeString(schemaField.value));
	// Check against field label (e.g., "E-mail")
	const labelSim = calculateStringSimilarity(normalizedHeader, normalizeString(schemaField.label));

	const nameScore = Math.max(valueSim, labelSim);

	if (nameScore === 1) {
		return { schemaField: schemaField.value, confidence: 1, reason: 'exact' };
	}

	score += nameScore * 0.6; // 60% weight for name

	// 2. Knowledge Base Match (Synonyms) - Weight: +Bonus
	// This would assume we have access to a synonym map or use HEADER_KEYWORDS
	// For now, we rely on the implementation in csv-validator having HEADER_MAP
	// We can check if the header partially matches any keyword relevant to this field

	// 3. Data Pattern Match - Weight: 40%
	if (columnDataSample.length > 0) {
		const detectedType = detectColumnType(columnDataSample);

		// Map schema fields to expected types
		const expectedTypeMap: Record<string, string> = {
			email: 'email',
			cpf: 'cpf',
			phone: 'phone',
			birthDate: 'date',
			saleDate: 'date',
			startDate: 'date',
			totalValue: 'money',
			installmentValue: 'money',
			installments: 'number',
		};

		const expectedType = expectedTypeMap[schemaField.value];

		if (expectedType && detectedType === expectedType) {
			score += 0.4; // Boost score significantly if data pattern matches
			if (score > 0.9) reason = 'pattern';
		} else if (expectedType && detectedType && detectedType !== expectedType) {
			// Penalty if types explicitly mismatch (e.g. text in numeric field)
			// But be careful, phone numbers can look like numbers
			if (expectedType === 'money' && detectedType === 'date') score -= 0.3;
			if (expectedType === 'date' && detectedType === 'email') score -= 0.5;
		}
	}

	return {
		schemaField: schemaField.value,
		confidence: Math.min(score, 1),
		reason: score > 0.8 ? reason : 'semantic',
	};
}

/**
 * Get best mapping suggestions for a list of headers
 */
export function getIntelligentMappings(
	headers: string[],
	rows: Record<string, unknown>[],
): Record<string, MappingSuggestion> {
	const schemaFields = getSchemaFields().filter((f) => f.value !== '_skip');
	const result: Record<string, MappingSuggestion> = {};

	for (const header of headers) {
		const columnSample = rows.slice(0, 10).map((r) => r[header]); // First 10 rows
		let bestMatch: MappingSuggestion | null = null;

		for (const field of schemaFields) {
			const prediction = calculateMappingScore(header, field, columnSample);

			if (!bestMatch || prediction.confidence > bestMatch.confidence) {
				bestMatch = prediction;
			}
		}

		if (bestMatch && bestMatch.confidence > 0.4) {
			// Threshold to suggest
			result[header] = bestMatch;
		}
	}

	return result;
}
