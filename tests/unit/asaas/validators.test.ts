/**
 * Asaas Validators Unit Tests
 *
 * Tests for CPF validation and Asaas customer payload validation
 */

import { describe, it, expect } from 'vitest'
import { validateCPF, validateAsaasCustomerPayload } from '../../../convex/lib/validators'

describe('CPF Validation', () => {
	describe('validateCPF', () => {
		it('should reject CPF with repeated digits', () => {
			const result = validateCPF('111.111.111-11')
			expect(result.valid).toBe(false)
			expect(result.error).toContain('dígitos repetidos')
		})

		it('should reject invalid CPF (wrong check digits)', () => {
			const result = validateCPF('123.456.789-00')
			expect(result.valid).toBe(false)
			expect(result.error).toContain('dígito verificador')
		})

		it('should accept valid CPF (formatted)', () => {
			const result = validateCPF('529.982.247-25')
			expect(result.valid).toBe(true)
		})

		it('should accept valid CPF (unformatted)', () => {
			const result = validateCPF('52998224725')
			expect(result.valid).toBe(true)
		})

		it('should accept valid CPF with different format', () => {
			const result = validateCPF('529 982 247 25')
			expect(result.valid).toBe(true)
		})

		it('should reject CPF with invalid length', () => {
			const result = validateCPF('123.456.789')
			expect(result.valid).toBe(false)
			expect(result.error).toContain('11 dígitos')
		})

		it('should reject CPF with non-numeric characters (except separators)', () => {
			const result = validateCPF('abc.def.ghi-jk')
			expect(result.valid).toBe(false)
		})
	})
})

describe('Asaas Customer Payload Validation', () => {
	describe('validateAsaasCustomerPayload', () => {
		it('should reject payload without name', () => {
			const payload = {
				email: 'test@example.com',
				phone: '11999999999',
			}
			const result = validateAsaasCustomerPayload(payload as any)
			expect(result.valid).toBe(false)
			expect(result.errors).toContain('Nome é obrigatório')
		})

		it('should reject payload with invalid email', () => {
			const payload = {
				name: 'Test User',
				email: 'invalid-email',
				phone: '11999999999',
			}
			const result = validateAsaasCustomerPayload(payload as any)
			expect(result.valid).toBe(false)
			expect(result.errors).toContain('Email inválido')
		})

		it('should accept valid payload', () => {
			const payload = {
				name: 'Test User',
				email: 'test@example.com',
				phone: '11999999999',
				cpfCnpj: '52998224725',
			}
			const result = validateAsaasCustomerPayload(payload)
			expect(result.valid).toBe(true)
		})

		it('should accept payload with only required fields', () => {
			const payload = {
				name: 'Test User',
			}
			const result = validateAsaasCustomerPayload(payload)
			expect(result.valid).toBe(true)
		})

		it('should validate phone when provided', () => {
			const payload = {
				name: 'Test User',
				phone: '11999999999',
			}
			const result = validateAsaasCustomerPayload(payload)
			expect(result.valid).toBe(true)
		})

		it('should reject payload with invalid phone (too short)', () => {
			const payload = {
				name: 'Test User',
				phone: '123',
			}
			const result = validateAsaasCustomerPayload(payload)
			expect(result.valid).toBe(false)
			expect(result.errors).toContain('Telefone deve ter 10 ou 11 dígitos (com DDD)')
		})

		it('should reject payload with invalid phone (too long)', () => {
			const payload = {
				name: 'Test User',
				phone: '123456789012',
			}
			const result = validateAsaasCustomerPayload(payload)
			expect(result.valid).toBe(false)
			expect(result.errors).toContain('Telefone deve ter 10 ou 11 dígitos (com DDD)')
		})

		it('should return multiple errors for invalid payload', () => {
			const payload = {
				email: 'invalid',
				phone: '123',
				cpfCnpj: '00000000000',
			}
			const result = validateAsaasCustomerPayload(payload as any)
			expect(result.valid).toBe(false)
			// Should have at least one error (from email or phone)
			expect(result.errors.length).toBeGreaterThan(0)
		})

		it('should accept mobilePhone as alternative to phone', () => {
			const payload = {
				name: 'Test User',
				mobilePhone: '11999999999',
			}
			const result = validateAsaasCustomerPayload(payload)
			expect(result.valid).toBe(true)
		})
	})
})
