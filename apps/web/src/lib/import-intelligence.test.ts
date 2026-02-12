import { describe, expect, test } from 'vitest';

import {
	calculateMappingScore,
	calculateStringSimilarity,
	detectColumnType,
	getIntelligentMappings,
	levenshteinDistance,
	normalizeString,
} from './import-intelligence';

describe('import-intelligence', () => {
	test('levenshteinDistance handles basic differences', () => {
		expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
		expect(levenshteinDistance('', 'abc')).toBe(3);
	});

	test('normalizeString removes accents and non-alphanumerics', () => {
		expect(normalizeString('  Joao da Silva  ')).toBe('joaodasilva');
		expect(normalizeString('E-mail')).toBe('email');
		expect(normalizeString('CNPJ/CPF')).toBe('cnpjcpf');
	});

	test('calculateStringSimilarity rewards containment', () => {
		expect(calculateStringSimilarity('Telefone Celular', 'Celular')).toBe(0.9);
		expect(calculateStringSimilarity('email', 'email')).toBe(1);
		expect(calculateStringSimilarity('', 'email')).toBe(0);
	});

	test('detectColumnType infers likely data types', () => {
		const emails = ['a@b.com', 'c@d.com', ''];
		const phones = ['(11) 99999-0000', '11999990000', ''];
		const dates = ['01/01/2020', '31/12/2024', ''];
		const money = ['R$ 1.200,00', '300,50', ''];
		const numbers = ['10.5', '20.75', '30.1'];

		expect(detectColumnType(emails)).toBe('email');
		expect(detectColumnType(phones)).toBe('phone');
		expect(detectColumnType(dates)).toBe('date');
		expect(detectColumnType(money)).toBe('money');
		expect(detectColumnType(numbers)).toBe('number');
		expect(detectColumnType(['', '   ', null])).toBeNull();
	});

	test('calculateMappingScore boosts when pattern matches expected type', () => {
		const schemaField = { value: 'totalValue', label: 'Valor total' };
		const sample = ['R$ 1.200,00', '300,50', '1.000,00'];

		const result = calculateMappingScore('Valor', schemaField, sample);
		expect(result.schemaField).toBe('totalValue');
		expect(result.confidence).toBeGreaterThan(0.9);
		expect(result.reason).toBe('pattern');
	});

	test('getIntelligentMappings suggests schema fields for headers', () => {
		const headers = ['E-mail', 'CPF', 'Data de Nascimento', 'Valor Total'];
		const rows = [
			{
				'E-mail': 'ana@example.com',
				CPF: '123.456.789-09',
				'Data de Nascimento': '01/01/2000',
				'Valor Total': 'R$ 1.200,00',
			},
		];

		const mappings = getIntelligentMappings(headers, rows);

		expect(mappings['E-mail']?.schemaField).toBe('email');
		expect(mappings.CPF?.schemaField).toBe('cpf');
		expect(mappings['Data de Nascimento']?.schemaField).toBe('birthDate');
		expect(mappings['Valor Total']?.schemaField).toBe('totalValue');
	});
});
