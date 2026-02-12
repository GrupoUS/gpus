import { describe, expect, it } from 'vitest';

import {
	BRAZILIAN_STATES,
	detectCSVDelimiter,
	formatCEP,
	formatCPF,
	formatPhone,
	getSchemaFields,
	mapCSVHeaders,
	normalizeCEP,
	normalizeCPF,
	normalizeEmail,
	normalizePaymentStatus,
	normalizePhone,
	normalizeProfession,
	normalizeStatus,
	normalizeUF,
	parseBoolean,
	parseDate,
	parseInteger,
	parseMonetary,
	validateCEP,
	validateCPF,
	validateEmail,
	validatePhone,
	validateRow,
	validateUF,
} from './csv-validator';

describe('CPF helpers', () => {
	it('validates CPF with check digits', () => {
		expect(validateCPF('529.982.247-25')).toBe(true);
		expect(validateCPF('111.111.111-11')).toBe(false);
		expect(validateCPF('12345678900')).toBe(false);
	});

	it('normalizes and formats CPF', () => {
		expect(normalizeCPF('529.982.247-25')).toBe('52998224725');
		expect(formatCPF('52998224725')).toBe('529.982.247-25');
	});
});

describe('Email helpers', () => {
	it('validates and normalizes email', () => {
		expect(validateEmail('aluno@exemplo.com')).toBe(true);
		expect(validateEmail('invalido@')).toBe(false);
		expect(normalizeEmail('  ALUNO@EXEMPLO.COM ')).toBe('aluno@exemplo.com');
	});
});

describe('Phone helpers', () => {
	it('validates and formats Brazilian phones', () => {
		expect(validatePhone('11999999999')).toBe(true);
		expect(validatePhone('1199999999')).toBe(true);
		expect(validatePhone('123')).toBe(false);
		expect(formatPhone('11999999999')).toBe('(11) 99999-9999');
		expect(formatPhone('1133334444')).toBe('(11) 3333-4444');
	});

	it('normalizes phone to digits', () => {
		expect(normalizePhone('(11) 99999-9999')).toBe('11999999999');
	});
});

describe('CEP helpers', () => {
	it('validates, normalizes and formats CEP', () => {
		expect(validateCEP('01310-200')).toBe(true);
		expect(validateCEP('00000000')).toBe(false);
		expect(normalizeCEP('01310-200')).toBe('01310200');
		expect(formatCEP('01310200')).toBe('01310-200');
	});
});

describe('UF helpers', () => {
	it('validates and normalizes UF', () => {
		expect(BRAZILIAN_STATES).toContain('SP');
		expect(validateUF('sp')).toBe(true);
		expect(validateUF('xx')).toBe(false);
		expect(normalizeUF(' rj ')).toBe('RJ');
	});
});

describe('detectCSVDelimiter', () => {
	it('detects common delimiters from first line', () => {
		expect(detectCSVDelimiter('a,b,c\n1,2,3')).toBe(',');
		expect(detectCSVDelimiter('a;b;c\n1;2;3')).toBe(';');
		expect(detectCSVDelimiter('a\tb\tc\n1\t2\t3')).toBe('\t');
		expect(detectCSVDelimiter('a|b|c\n1|2|3')).toBe('|');
	});
});

describe('normalizeProfession and normalizeStatus', () => {
	it('normalizes profession variations', () => {
		expect(normalizeProfession('Biomédica')).toBe('biomedico');
		expect(normalizeProfession('farmácia')).toBe('farmaceutico');
		expect(normalizeProfession('fisioterapia')).toBe('outro');
	});

	it('normalizes status variations', () => {
		expect(normalizeStatus('Ativa')).toBe('ativo');
		expect(normalizeStatus('inativo')).toBe('inativo');
		expect(normalizeStatus('Paused')).toBe('pausado');
		expect(normalizeStatus('Graduated')).toBe('formado');
	});
});

describe('parseBoolean', () => {
	it('parses truthy values', () => {
		expect(parseBoolean('sim')).toBe(true);
		expect(parseBoolean('YES')).toBe(true);
		expect(parseBoolean('1')).toBe(true);
		expect(parseBoolean(true)).toBe(true);
	});

	it('parses falsy values', () => {
		expect(parseBoolean('nao')).toBe(false);
		expect(parseBoolean(undefined)).toBe(false);
	});
});

describe('parseDate', () => {
	it('parses Excel serial dates', () => {
		const excelEpoch = new Date(1899, 11, 30).getTime();
		const expected = excelEpoch + 2 * 24 * 60 * 60 * 1000;
		expect(parseDate(2)).toBe(expected);
	});

	it('parses Brazilian DD/MM/YYYY dates', () => {
		const expected = new Date(2024, 0, 15).getTime();
		expect(parseDate('15/01/2024')).toBe(expected);
	});

	it('returns undefined for invalid dates', () => {
		expect(parseDate('data inválida')).toBeUndefined();
	});
});

describe('mapCSVHeaders', () => {
	it('maps headers using intelligent mapping when rows are provided', () => {
		const headers = ['Telefone Celular'];
		const rows = [{ 'Telefone Celular': '(11) 98888-7777' }];

		const mapping = mapCSVHeaders(headers, rows);

		expect(mapping['Telefone Celular']).toBe('phone');
	});

	it('maps headers using dictionary matches when present', () => {
		const headers = ['E-mail', 'CPF'];
		const mapping = mapCSVHeaders(headers);
		expect(mapping['E-mail']).toBe('email');
		expect(mapping.CPF).toBe('cpf');
	});
});

describe('getSchemaFields', () => {
	it('includes _skip option for mapping UI', () => {
		const fields = getSchemaFields();
		const skip = fields.find((field) => field.value === '_skip');
		expect(skip?.label).toBe('-- Ignorar --');
	});
});

describe('validateRow', () => {
	it('validates required fields and returns errors/warnings', () => {
		const mapping = { Nome: 'name', Telefone: 'phone', Email: 'email', CPF: 'cpf' };
		const row = {
			Nome: 'Ana Costa',
			Telefone: '999',
			Email: 'email-invalido',
			CPF: '111.111.111-11',
		};

		const result = validateRow(row, 2, mapping);

		expect(result.isValid).toBe(false);
		expect(result.errors).toContain('Linha 2: Email inválido: email-invalido');
		expect(result.warnings).toContain('Linha 2: Telefone pode estar em formato inválido: 999');
		expect(result.warnings).toContain('Linha 2: CPF inválido: 111.111.111-11');
		// Defaults applied
		expect(result.data.hasClinic).toBe(false);
	});

	it('allows empty optional email without error', () => {
		const mapping = { Nome: 'name', Telefone: 'phone', Email: 'email' };
		const row = { Nome: 'Joana', Telefone: '11999999999', Email: '' };

		const result = validateRow(row, 1, mapping);

		expect(result.isValid).toBe(true);
		expect(result.errors).toEqual([]);
	});
});

describe('Financial parsers', () => {
	it('normalizes payment status', () => {
		expect(normalizePaymentStatus('inadimplente')).toBe('atrasado');
		expect(normalizePaymentStatus(undefined)).toBe('em_dia');
	});

	it('parses monetary values', () => {
		expect(parseMonetary('R$ 1.234,56')).toBeCloseTo(1234.56, 2);
		expect(parseMonetary('1,234.56')).toBeCloseTo(1234.56, 2);
		expect(parseMonetary('1234,56')).toBeCloseTo(1234.56, 2);
	});

	it('parses integers from mixed strings', () => {
		expect(parseInteger('12 parcelas')).toBe(12);
		expect(parseInteger('1.234')).toBe(1234);
	});
});

describe('CSV edge cases', () => {
	it('defaults to comma when no delimiter found', () => {
		expect(detectCSVDelimiter('sem delimitadores aqui')).toBe(',');
	});

	it('falls back to dictionary mapping when rows are empty', () => {
		const headers = ['Nome', 'Email', 'Telefone'];
		const mapping = mapCSVHeaders(headers, []);

		expect(mapping).toEqual({
			Nome: 'name',
			Email: 'email',
			Telefone: 'phone',
		});
	});

	it('handles unknown profession and status', () => {
		expect(normalizeProfession('Profissão inventada')).toBe('outro');
		expect(normalizeStatus('invalido')).toBe('ativo');
	});

	it('returns 0 for invalid monetary and integer inputs', () => {
		expect(parseMonetary('')).toBe(0);
		expect(parseMonetary('abc')).toBe(0);
		expect(parseInteger('')).toBe(0);
		expect(parseInteger('abc')).toBe(0);
	});

	it('handles invalid date inputs', () => {
		// Format matches DD/MM/YYYY so parser returns a date even if values are odd.
		const oddDate = parseDate('99/99/9999');
		expect(typeof oddDate).toBe('number');
		expect(parseDate('data inválida')).toBeUndefined();
	});

	it('captures warnings for invalid phone and cpf', () => {
		const mapping = { Nome: 'name', Telefone: 'phone', CPF: 'cpf' };
		const row = { Nome: 'Ana', Telefone: '11', CPF: '00000000000' };

		const result = validateRow(row, 1, mapping);

		expect(result.isValid).toBe(true);
		expect(result.errors).toEqual([]);
		expect(result.warnings.length).toBeGreaterThan(0);
	});
});
