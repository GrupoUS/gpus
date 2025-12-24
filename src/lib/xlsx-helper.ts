/**
 * XLSX Helper Utilities
 * Smart header detection and password handling for spreadsheet imports
 */

import * as XLSX from 'xlsx';

import { calculateStringSimilarity, detectColumnType } from './import-intelligence';

// Known header keywords in Portuguese for student imports
// These are common column names found in Brazilian educational/CRM spreadsheets
export const HEADER_KEYWORDS = [
	// Personal info
	'nome',
	'nome completo',
	'aluno',
	'email',
	'e-mail',
	'telefone',
	'celular',
	'whatsapp',
	'contato',
	'cpf',
	'documento',

	// Address
	'endereco',
	'endereço',
	'rua',
	'logradouro',
	'numero',
	'número',
	'complemento',
	'bairro',
	'cidade',
	'municipio',
	'município',
	'estado',
	'uf',
	'cep',
	'pais',
	'país',

	// Professional info
	'profissao',
	'profissão',
	'graduacao',
	'graduação',
	'formacao',
	'formação',
	'registro',
	'coren',
	'crm',
	'cro',
	'crf',

	// Status and dates
	'status',
	'situacao',
	'situação',
	'data',
	'nascimento',
	'venda',

	// Course/Enrollment
	'turma',
	'curso',
	'matricula',
	'matrícula',

	// Financial
	'valor',
	'total',
	'parcela',
	'parcelas',
	'pagamento',
	'pago',

	// Sales
	'vendedor',
	'vendedora',
	'origem',
	'fonte',
	'lead',

	// Clinic
	'clinica',
	'clínica',
] as const;

/**
 * Result of header row detection
 */
export interface HeaderDetectionResult {
	/** Zero-based index of the detected header row */
	headerRowIndex: number;
	/** Confidence score from 0 to 1 */
	confidence: number;
	/** Extracted header values from the detected row */
	headers: string[];
	/** All candidate rows with their scores (for debugging/UI) */
	candidates: Array<{
		rowIndex: number;
		score: number;
		headers: string[];
	}>;
}

/**
 * Result of XLSX parsing with password support
 */
export type XLSXParseResult =
	| { success: true; workbook: XLSX.WorkBook }
	| { success: false; needsPassword: true }
	| { success: false; error: string };

/**
 * Check if a value looks like a header (text, not a number/date)
 */
function isLikelyHeaderValue(value: unknown): boolean {
	if (value === null || value === undefined || value === '') {
		return false;
	}

	const str = String(value).trim();

	// Empty strings are not headers
	if (str === '') return false;

	// Pure numbers are unlikely to be headers
	if (/^\d+([.,]\d+)?$/.test(str)) return false;

	// Dates are unlikely to be headers
	if (/^\d{1,2}[/\-.]\d{1,2}[/\-.]\d{2,4}$/.test(str)) return false;

	// Very long strings (>50 chars) are unlikely headers
	if (str.length > 50) return false;

	return true;
}

/**
 * Calculate a score for how likely a row is to be the header row
 * Higher score = more likely to be a header
 *
 * @param row The row to analyze
 * @param nextRow The row immediately following (for data pattern check)
 */
function calculateRowScore(row: unknown[], nextRow?: unknown[]): number {
	if (!row || row.length === 0) return 0;

	let score = 0;
	const nonEmptyCells = row.filter(
		(cell) => cell !== null && cell !== undefined && String(cell).trim() !== '',
	);

	// Factor 1: Percentage of cells that look like headers (text, not numbers)
	const headerLikeCells = row.filter(isLikelyHeaderValue);
	const textRatio = headerLikeCells.length / Math.max(row.length, 1);
	score += textRatio * 30; // Max 30 points

	// Factor 2: Number of cells matching known header keywords (Semantic Analysis)
	// Improved: Use fuzzy matching instead of strict inclusion
	let keywordScore = 0;
	// avoid double counting
	const detectedHeaders = new Set<string>();

	row.forEach((cell) => {
		if (cell === null || cell === undefined) return;
		const cellStr = String(cell).trim();
		if (detectedHeaders.has(cellStr)) return;

		// Find best match among keywords
		let bestMatchScore = 0;
		for (const keyword of HEADER_KEYWORDS) {
			const similarity = calculateStringSimilarity(cellStr, keyword);
			if (similarity > bestMatchScore) {
				bestMatchScore = similarity;
			}
		}

		if (bestMatchScore > 0.8) {
			keywordScore += 10 * bestMatchScore; // Scaled by similarity
			detectedHeaders.add(cellStr);
		}
	});

	score += Math.min(keywordScore, 50); // Max 50 points (increased from 40 for intelligence)

	// Factor 3: Non-empty cell count (headers usually have many filled cells)
	const fillRatio = nonEmptyCells.length / Math.max(row.length, 1);
	score += fillRatio * 20; // Max 20 points

	// Factor 4: Bonus for having 3+ columns (typical for data imports)
	if (nonEmptyCells.length >= 3) {
		score += 10;
	}

	// Factor 5: Data Pattern Analysis (Look Ahead)
	// If the next row contains data patterns (email, cpf, etc.), boost confidence dramatically
	if (nextRow && nextRow.length > 0) {
		const nextRowTypes = nextRow.map((cell) => detectColumnType([cell]));
		// Check if any valuable types are detected (ignore generic 'number' which is ambiguous)
		const hasSpecificDataPatterns = nextRowTypes.some(
			(t) => t === 'email' || t === 'cpf' || t === 'phone' || t === 'date',
		);

		if (hasSpecificDataPatterns) {
			score += 40; // Very Strong indicator
		} else if (textRatio > 0.8 && nextRow.every((c) => !isLikelyHeaderValue(c))) {
			// If current row is text and next row is NOT header-like (so likely data), boost
			score += 20;
		}
	}

	return score;
}

/**
 * Detect which row contains the headers in a spreadsheet
 *
 * @param rows - Array of rows from the spreadsheet (each row is an array of cell values)
 * @param maxRowsToScan - Maximum number of rows to analyze (default: 20)
 * @returns Detection result with the most likely header row
 *
 * @example
 * ```typescript
 * const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });
 * const result = detectHeaderRow(jsonData as unknown[][]);
 * ```
 */
export function detectHeaderRow(rows: unknown[][], maxRowsToScan = 20): HeaderDetectionResult {
	const candidates: Array<{ rowIndex: number; score: number; headers: string[] }> = [];

	// Scan the first N rows
	const rowsToScan = Math.min(rows.length, maxRowsToScan);

	for (let i = 0; i < rowsToScan; i++) {
		const row = rows[i];
		if (!(row && Array.isArray(row))) continue;

		// Pass next row for context/pattern analysis
		const nextRow = i + 1 < rows.length ? rows[i + 1] : undefined;
		const score = calculateRowScore(row, nextRow as unknown[]);

		const headers = row.map((h) => String(h ?? '').trim()).filter(Boolean);

		// Only consider rows with at least 1 potential header (relaxed from 2 to allow single column imports)
		if (headers.length >= 1) {
			candidates.push({ rowIndex: i, score, headers });
		}
	}

	// Sort by score descending
	candidates.sort((a, b) => b.score - a.score);

	// If no candidates found, default to row 0
	if (candidates.length === 0) {
		const firstRow = rows[0] || [];
		return {
			headerRowIndex: 0,
			confidence: 0,
			headers: firstRow.map((h) => String(h ?? '').trim()).filter(Boolean),
			candidates: [],
		};
	}

	const best = candidates[0];

	// Calculate confidence based on score difference from second best
	let confidence: number;
	if (candidates.length === 1) {
		// Only one candidate - confidence based on absolute score
		confidence = Math.min(best.score / 100, 1);
	} else {
		// Multiple candidates - confidence based on how much better the best is
		const scoreDiff = best.score - candidates[1].score;
		const relativeConfidence = scoreDiff / Math.max(best.score, 1);
		const absoluteConfidence = best.score / 100;
		confidence = Math.min((relativeConfidence + absoluteConfidence) / 2, 1);
	}

	return {
		headerRowIndex: best.rowIndex,
		confidence: Math.round(confidence * 100) / 100, // Round to 2 decimal places
		headers: best.headers,
		candidates,
	};
}

/**
 * Extract rows using a specific header row index
 *
 * @param rows - All rows from the spreadsheet
 * @param headerRowIndex - Index of the row to use as headers
 * @returns Object with headers array and data rows as Record objects
 */
export function extractDataWithHeaders(
	rows: unknown[][],
	headerRowIndex: number,
): { headers: string[]; dataRows: Record<string, unknown>[] } {
	if (headerRowIndex < 0 || headerRowIndex >= rows.length) {
		throw new Error(`Invalid header row index: ${headerRowIndex}`);
	}

	const headerRow = rows[headerRowIndex];
	const headers = headerRow.map((h) => String(h ?? '').trim()).filter(Boolean);

	if (headers.length === 0) {
		throw new Error('No valid headers found in the specified row');
	}

	// Data rows start after the header row
	const dataRows = rows.slice(headerRowIndex + 1).map((row) => {
		const arr = row as unknown[];
		const obj: Record<string, unknown> = {};
		headers.forEach((header, index) => {
			obj[header] = arr[index];
		});
		return obj;
	});

	return { headers, dataRows };
}

/**
 * Parse XLSX with optional password support
 *
 * @param buffer - ArrayBuffer containing the XLSX file
 * @param password - Optional password for protected files
 * @returns Parse result indicating success, need for password, or error
 *
 * @example
 * ```typescript
 * const buffer = await file.arrayBuffer();
 * const result = parseXLSXWithPassword(buffer);
 *
 * if (!result.success && result.needsPassword) {
 *   // Show password dialog
 *   const password = await promptForPassword();
 *   const retryResult = parseXLSXWithPassword(buffer, password);
 * }
 * ```
 */
export function parseXLSXWithPassword(buffer: ArrayBuffer, password?: string): XLSXParseResult {
	try {
		const options: XLSX.ParsingOptions = {
			type: 'array',
			cellDates: true,
			cellNF: false,
			cellText: true,
		};

		if (password) {
			options.password = password;
		}

		const workbook = XLSX.read(buffer, options);

		return { success: true, workbook };
	} catch (error) {
		const message = error instanceof Error ? error.message : String(error);

		// Detect password-protected file errors
		// xlsx library throws specific errors for encrypted files
		if (
			message.includes('password') ||
			message.includes('encrypted') ||
			message.includes('ECMA-376') ||
			message.includes('Encrypted')
		) {
			return { success: false, needsPassword: true };
		}

		// Return other errors as generic error
		return { success: false, error: message };
	}
}

/**
 * Get rows from the first sheet of a workbook as raw arrays
 *
 * @param workbook - XLSX Workbook object
 * @returns Array of row arrays (for use with detectHeaderRow)
 */
export function getRowsFromWorkbook(workbook: XLSX.WorkBook): unknown[][] {
	const sheetName = workbook.SheetNames[0];
	if (!sheetName) {
		throw new Error('Workbook has no sheets');
	}

	const sheet = workbook.Sheets[sheetName];
	if (!sheet) {
		throw new Error('Could not access first sheet');
	}

	// Get all rows as arrays (header: 1 means treat first row as data, not headers)
	const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as unknown[][];

	return rows;
}
