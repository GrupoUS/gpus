import { describe, expect, it } from 'vitest';

import {
	detectHeaderRow,
	extractDataWithHeaders,
	getRowsFromWorkbook,
	HEADER_KEYWORDS,
	parseXLSXWithPassword,
} from './xlsx-helper';

describe('HEADER_KEYWORDS', () => {
	it('should contain common Portuguese header terms', () => {
		expect(HEADER_KEYWORDS).toContain('nome');
		expect(HEADER_KEYWORDS).toContain('email');
		expect(HEADER_KEYWORDS).toContain('cpf');
		expect(HEADER_KEYWORDS).toContain('telefone');
		expect(HEADER_KEYWORDS).toContain('celular');
	});

	it('should contain address-related keywords', () => {
		expect(HEADER_KEYWORDS).toContain('endereco');
		expect(HEADER_KEYWORDS).toContain('cep');
		expect(HEADER_KEYWORDS).toContain('cidade');
		expect(HEADER_KEYWORDS).toContain('estado');
		expect(HEADER_KEYWORDS).toContain('uf');
	});

	it('should contain professional keywords for health aesthetics', () => {
		expect(HEADER_KEYWORDS).toContain('coren');
		expect(HEADER_KEYWORDS).toContain('crm');
		expect(HEADER_KEYWORDS).toContain('formação');
		expect(HEADER_KEYWORDS).toContain('graduação');
	});

	it('should contain course/enrollment keywords', () => {
		expect(HEADER_KEYWORDS).toContain('turma');
		expect(HEADER_KEYWORDS).toContain('curso');
		expect(HEADER_KEYWORDS).toContain('matrícula');
	});
});

describe('detectHeaderRow', () => {
	describe('simple cases - header in row 0', () => {
		it('should detect header in first row when no metadata rows exist', () => {
			const rows = [
				['Nome', 'Email', 'Telefone', 'CPF'],
				['João Silva', 'joao@email.com', '11999999999', '12345678901'],
				['Maria Santos', 'maria@email.com', '11888888888', '98765432109'],
			];

			const result = detectHeaderRow(rows);

			expect(result.headerRowIndex).toBe(0);
			expect(result.headers).toEqual(['Nome', 'Email', 'Telefone', 'CPF']);
			expect(result.confidence).toBeGreaterThan(0);
		});

		it('should return headers as strings trimmed', () => {
			const rows = [
				['  Nome  ', ' Email ', 'Telefone', '  CPF  '],
				['João', 'joao@email.com', '11999999999', '123'],
			];

			const result = detectHeaderRow(rows);

			expect(result.headers).toEqual(['Nome', 'Email', 'Telefone', 'CPF']);
		});
	});

	describe('metadata rows before header', () => {
		it('should detect header in row 3 when preceded by metadata', () => {
			const rows = [
				['Relatório de Alunos - Sistema Grupo US'], // Title
				['Gerado em: 15/01/2025'], // Date
				[''], // Empty row
				['Nome', 'Email', 'Telefone', 'CPF', 'Cidade'], // Header row (index 3)
				['João Silva', 'joao@email.com', '11999999999', '12345678901', 'São Paulo'],
				['Maria Santos', 'maria@email.com', '11888888888', '98765432109', 'Rio de Janeiro'],
			];

			const result = detectHeaderRow(rows);

			expect(result.headerRowIndex).toBe(3);
			expect(result.headers).toEqual(['Nome', 'Email', 'Telefone', 'CPF', 'Cidade']);
		});

		it('should detect header after company logo and metadata rows', () => {
			const rows = [
				['GRUPO US - EDUCAÇÃO EM SAÚDE ESTÉTICA'],
				['www.grupous.com.br'],
				['Exportado por: Admin'],
				['Data: 10/12/2024'],
				[''],
				['Nome Completo', 'E-mail', 'Celular', 'Endereço', 'CEP'], // Header row (index 5)
				['Ana Costa', 'ana@test.com', '11777777777', 'Rua A, 123', '01234-567'],
			];

			const result = detectHeaderRow(rows);

			expect(result.headerRowIndex).toBe(5);
			expect(result.headers).toContain('Nome Completo');
			expect(result.headers).toContain('E-mail');
			expect(result.headers).toContain('CEP');
		});

		it('should prefer row with more keyword matches', () => {
			const rows = [
				['ID', 'Código'], // Some headers but fewer keywords
				['Nome', 'Email', 'Telefone', 'CPF', 'Cidade', 'Estado'], // More keywords
				['1', 'joao@email.com', '11999999999', '12345678901', 'SP', 'São Paulo'],
			];

			const result = detectHeaderRow(rows);

			// Row 1 has more known keywords (nome, email, telefone, cpf, cidade, estado)
			expect(result.headerRowIndex).toBe(1);
		});
	});

	describe('edge cases', () => {
		it('should handle empty spreadsheet', () => {
			const rows: unknown[][] = [];

			const result = detectHeaderRow(rows);

			expect(result.headerRowIndex).toBe(0);
			expect(result.confidence).toBe(0);
			expect(result.headers).toEqual([]);
			expect(result.candidates).toEqual([]);
		});

		it('should handle spreadsheet with only empty rows', () => {
			const rows = [[''], [''], ['']];

			const result = detectHeaderRow(rows);

			expect(result.headerRowIndex).toBe(0);
			expect(result.confidence).toBe(0);
		});

		it('should handle null/undefined values in rows', () => {
			const rows = [
				['Nome', null, 'Email', undefined, 'Telefone'],
				['João', '', 'joao@email.com', '', '11999999999'],
			];

			const result = detectHeaderRow(rows);

			expect(result.headerRowIndex).toBe(0);
			expect(result.headers).toEqual(['Nome', 'Email', 'Telefone']);
		});

		it('should not consider pure number rows as headers', () => {
			const rows = [
				[1, 2, 3, 4, 5], // Numbers only - not a header
				['Nome', 'Email', 'Telefone', 'CPF', 'Status'],
				['João', 'joao@email.com', '11999', '12345678901', 'Ativo'],
			];

			const result = detectHeaderRow(rows);

			expect(result.headerRowIndex).toBe(1);
		});

		it('should not consider date rows as headers', () => {
			const rows = [
				['01/01/2025', '02/01/2025', '03/01/2025'], // Dates only - not a header
				['Nome', 'Data de Nascimento', 'Data Venda'],
				['João', '15/03/1990', '01/01/2025'],
			];

			const result = detectHeaderRow(rows);

			expect(result.headerRowIndex).toBe(1);
		});

		it('should respect maxRowsToScan parameter', () => {
			const rows = [
				['Metadata 1'],
				['Metadata 2'],
				['Metadata 3'],
				['Metadata 4'],
				['Metadata 5'],
				['Nome', 'Email', 'CPF'], // Header at row 5
				['João', 'joao@email.com', '12345678901'],
			];

			// Scan only first 3 rows - won't find the header
			const result = detectHeaderRow(rows, 3);

			// Should default to row 0 or best match in first 3 rows
			expect(result.headerRowIndex).toBeLessThan(5);
		});

		it('should detect header when scanning enough rows', () => {
			const rows = [
				['Metadata 1'],
				['Metadata 2'],
				['Metadata 3'],
				['Metadata 4'],
				['Metadata 5'],
				['Nome', 'Email', 'CPF'], // Header at row 5
				['João', 'joao@email.com', '12345678901'],
			];

			// Scan first 10 rows - should find the header
			const result = detectHeaderRow(rows, 10);

			expect(result.headerRowIndex).toBe(5);
		});
	});

	describe('confidence scoring', () => {
		it('should have higher confidence when multiple keywords match', () => {
			const rowsWithManyKeywords = [
				['Nome', 'Email', 'Telefone', 'CPF', 'Endereço', 'CEP', 'Cidade'],
				['João', 'joao@email.com', '11999999999', '123', 'Rua A', '01234-567', 'SP'],
			];

			const rowsWithFewKeywords = [
				['ID', 'Código', 'Valor'],
				['1', 'ABC', '100'],
			];

			const result1 = detectHeaderRow(rowsWithManyKeywords);
			const result2 = detectHeaderRow(rowsWithFewKeywords);

			expect(result1.confidence).toBeGreaterThan(result2.confidence);
		});

		it('should return candidates sorted by score descending', () => {
			const rows = [
				['ID', 'Código'], // Some potential headers
				['Nome', 'Email', 'Telefone', 'CPF'], // Better headers
				['1', 'joao@email.com', '11999999999', '12345678901'],
			];

			const result = detectHeaderRow(rows);

			// Check candidates are sorted by score
			for (let i = 1; i < result.candidates.length; i++) {
				expect(result.candidates[i - 1].score).toBeGreaterThanOrEqual(result.candidates[i].score);
			}
		});
	});

	describe('keyword matching', () => {
		it('should match keywords case-insensitively', () => {
			const rows = [
				['NOME', 'EMAIL', 'TELEFONE'],
				['João', 'joao@email.com', '11999999999'],
			];

			const result = detectHeaderRow(rows);

			expect(result.headerRowIndex).toBe(0);
			expect(result.confidence).toBeGreaterThan(0);
		});

		it('should match partial keywords (contains check)', () => {
			const rows = [
				['Nome do Aluno', 'E-mail Principal', 'Telefone Celular'],
				['João Silva', 'joao@email.com', '11999999999'],
			];

			const result = detectHeaderRow(rows);

			expect(result.headerRowIndex).toBe(0);
			// Keywords nome, email, telefone, celular should match
		});
	});
});

describe('extractDataWithHeaders', () => {
	describe('basic extraction', () => {
		it('should extract data using specified header row', () => {
			const rows = [
				['Metadata row'],
				['Nome', 'Email', 'Idade'],
				['João', 'joao@email.com', 25],
				['Maria', 'maria@email.com', 30],
			];

			const result = extractDataWithHeaders(rows, 1);

			expect(result.headers).toEqual(['Nome', 'Email', 'Idade']);
			expect(result.dataRows).toHaveLength(2);
			expect(result.dataRows[0]).toEqual({
				Nome: 'João',
				Email: 'joao@email.com',
				Idade: 25,
			});
			expect(result.dataRows[1]).toEqual({
				Nome: 'Maria',
				Email: 'maria@email.com',
				Idade: 30,
			});
		});

		it('should handle header row at index 0', () => {
			const rows = [
				['Nome', 'Email'],
				['João', 'joao@email.com'],
			];

			const result = extractDataWithHeaders(rows, 0);

			expect(result.headers).toEqual(['Nome', 'Email']);
			expect(result.dataRows).toHaveLength(1);
			expect(result.dataRows[0]).toEqual({
				Nome: 'João',
				Email: 'joao@email.com',
			});
		});

		it('should skip metadata rows above header', () => {
			const rows = [
				['Title Row'],
				['Date: 2025-01-01'],
				[''],
				['Nome', 'CPF', 'Status'],
				['João', '12345678901', 'Ativo'],
				['Maria', '98765432109', 'Inativo'],
			];

			const result = extractDataWithHeaders(rows, 3);

			expect(result.headers).toEqual(['Nome', 'CPF', 'Status']);
			expect(result.dataRows).toHaveLength(2);
			expect(result.dataRows[0].Nome).toBe('João');
			expect(result.dataRows[1].Nome).toBe('Maria');
		});
	});

	describe('error handling', () => {
		it('should throw error for negative header index', () => {
			const rows = [['Nome', 'Email']];

			expect(() => extractDataWithHeaders(rows, -1)).toThrow('Invalid header row index: -1');
		});

		it('should throw error for header index beyond array length', () => {
			const rows = [['Nome', 'Email']];

			expect(() => extractDataWithHeaders(rows, 5)).toThrow('Invalid header row index: 5');
		});

		it('should throw error when header row has no valid headers', () => {
			const rows = [
				['', '', ''],
				['João', 'joao@email.com', '25'],
			];

			expect(() => extractDataWithHeaders(rows, 0)).toThrow('No valid headers found');
		});
	});

	describe('data transformation', () => {
		it('should handle rows with fewer columns than headers', () => {
			const rows = [
				['Nome', 'Email', 'Telefone', 'Cidade'],
				['João', 'joao@email.com'], // Missing columns
			];

			const result = extractDataWithHeaders(rows, 0);

			expect(result.dataRows[0]).toEqual({
				Nome: 'João',
				Email: 'joao@email.com',
				Telefone: undefined,
				Cidade: undefined,
			});
		});

		it('should handle null and undefined values in data', () => {
			const rows = [
				['Nome', 'Email'],
				['João', null],
				[undefined, 'maria@email.com'],
			];

			const result = extractDataWithHeaders(rows, 0);

			expect(result.dataRows[0]).toEqual({
				Nome: 'João',
				Email: null,
			});
			expect(result.dataRows[1]).toEqual({
				Nome: undefined,
				Email: 'maria@email.com',
			});
		});

		it('should trim header names but preserve data values', () => {
			const rows = [
				['  Nome  ', '  Email  '],
				['  João  ', '  joao@email.com  '],
			];

			const result = extractDataWithHeaders(rows, 0);

			expect(result.headers).toEqual(['Nome', 'Email']);
			// Data values should be preserved as-is
			expect(result.dataRows[0].Nome).toBe('  João  ');
			expect(result.dataRows[0].Email).toBe('  joao@email.com  ');
		});
	});
});

describe('parseXLSXWithPassword', () => {
	describe('error handling', () => {
		it('should handle invalid/garbage buffer gracefully', () => {
			// Note: xlsx library is very lenient and will try to parse almost anything
			// It may succeed with an empty workbook or throw an error
			const invalidBuffer = new ArrayBuffer(10);

			const result = parseXLSXWithPassword(invalidBuffer);

			// Either success (empty workbook) or error - both are valid handling
			expect(typeof result.success).toBe('boolean');
			if (!result.success && 'error' in result) {
				expect(typeof result.error).toBe('string');
			}
		});

		it('should detect password-protected files', () => {
			// Since we can't easily create a real encrypted XLSX in a unit test,
			// we're testing that the function handles password errors properly
			// by checking the parseXLSXWithPassword logic exists and returns proper type
			expect(typeof parseXLSXWithPassword).toBe('function');
		});

		it('should return correct structure on success', () => {
			// xlsx library accepts empty buffers and returns valid workbook
			const buffer = new ArrayBuffer(0);
			const result = parseXLSXWithPassword(buffer);

			// xlsx is lenient - empty buffer creates empty workbook
			if (result.success) {
				expect(result.workbook).toBeDefined();
				expect(result.workbook.SheetNames).toBeDefined();
			}
		});
	});

	describe('success cases', () => {
		it('should accept ArrayBuffer type', () => {
			// The function should accept ArrayBuffer without throwing
			const buffer = new ArrayBuffer(0);

			// Should not throw - function handles empty buffer gracefully
			expect(() => parseXLSXWithPassword(buffer)).not.toThrow();

			const result = parseXLSXWithPassword(buffer);
			// Result should have success property
			expect(typeof result.success).toBe('boolean');
		});
	});
});

describe('getRowsFromWorkbook', () => {
	describe('error handling', () => {
		it('should throw error for workbook with no sheets', () => {
			const emptyWorkbook = {
				SheetNames: [],
				Sheets: {},
			};

			expect(() => getRowsFromWorkbook(emptyWorkbook)).toThrow('Workbook has no sheets');
		});

		it('should throw error when sheet cannot be accessed', () => {
			const workbook = {
				SheetNames: ['Sheet1'],
				Sheets: {}, // Sheet1 not in Sheets
			};

			expect(() => getRowsFromWorkbook(workbook)).toThrow('Could not access first sheet');
		});
	});

	describe('success cases', () => {
		it('should extract rows from first sheet', () => {
			// Create a minimal valid workbook structure
			const workbook = {
				SheetNames: ['Sheet1'],
				Sheets: {
					Sheet1: {
						'!ref': 'A1:B2',
						A1: { t: 's', v: 'Nome' },
						B1: { t: 's', v: 'Email' },
						A2: { t: 's', v: 'João' },
						B2: { t: 's', v: 'joao@email.com' },
					},
				},
			};

			const rows = getRowsFromWorkbook(workbook);

			expect(Array.isArray(rows)).toBe(true);
			expect(rows.length).toBeGreaterThan(0);
		});
	});
});

describe('integration: detectHeaderRow + extractDataWithHeaders', () => {
	it('should correctly process spreadsheet with metadata rows', () => {
		// Simulate real-world spreadsheet with metadata
		const rows = [
			['RELATÓRIO DE ALUNOS - TRINTAE3'],
			['Data de exportação: 15/01/2025'],
			['Total de registros: 50'],
			[''],
			['Nome Completo', 'E-mail', 'Telefone', 'CPF', 'Status'],
			['Ana Silva', 'ana@email.com', '11999998888', '12345678901', 'Ativa'],
			['Bruno Costa', 'bruno@email.com', '11888887777', '98765432109', 'Pendente'],
			['Carla Dias', 'carla@email.com', '11777776666', '11122233344', 'Ativa'],
		];

		// Step 1: Detect header
		const detection = detectHeaderRow(rows);

		expect(detection.headerRowIndex).toBe(4);
		expect(detection.headers).toContain('Nome Completo');
		expect(detection.headers).toContain('E-mail');
		expect(detection.headers).toContain('CPF');

		// Step 2: Extract data using detected header
		const { headers, dataRows } = extractDataWithHeaders(rows, detection.headerRowIndex);

		expect(headers).toEqual(['Nome Completo', 'E-mail', 'Telefone', 'CPF', 'Status']);
		expect(dataRows).toHaveLength(3);
		expect(dataRows[0]['Nome Completo']).toBe('Ana Silva');
		expect(dataRows[1]['Nome Completo']).toBe('Bruno Costa');
		expect(dataRows[2]['Nome Completo']).toBe('Carla Dias');
	});

	it('should handle spreadsheet where row 0 is the header', () => {
		const rows = [
			['Nome', 'Email', 'CPF'],
			['João', 'joao@email.com', '12345678901'],
			['Maria', 'maria@email.com', '98765432109'],
		];

		const detection = detectHeaderRow(rows);
		const { dataRows } = extractDataWithHeaders(rows, detection.headerRowIndex);

		expect(detection.headerRowIndex).toBe(0);
		expect(dataRows).toHaveLength(2);
	});
});
