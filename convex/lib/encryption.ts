/**
 * LGPD-Compliant Encryption Utilities
 * 
 * Provides AES-256-GCM encryption for sensitive PII data
 * following Brazilian data protection requirements.
 */

import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'crypto'

/**
 * Encryption configuration for LGPD compliance
 */
const ENCRYPTION_CONFIG = {
	algorithm: 'aes-256-gcm' as const,
	keyLength: 32, // 256 bits
	ivLength: 16, // 128 bits
	tagLength: 16, // 128 bits
	encoding: 'utf8' as const,
	outputEncoding: 'hex' as const,
} as const

/**
 * Derives encryption key from environment variable
 * Uses SHA-256 to ensure proper key length
 */
function getEncryptionKey(): Buffer {
	const key = process.env.ENCRYPTION_KEY
	if (!key) {
		throw new Error('ENCRYPTION_KEY environment variable is required for LGPD compliance')
	}
	
	// Ensure key is exactly 32 bytes (256 bits)
	return createHash('sha256').update(key).digest()
}

/**
 * Generates cryptographically secure random IV
 */
function generateIV(): Buffer {
	return randomBytes(ENCRYPTION_CONFIG.ivLength)
}

/**
 * Encrypts sensitive data using AES-256-GCM
 * 
 * @param data Plain text data to encrypt
 * @returns Encrypted data with IV and authentication tag
 */
export function encrypt(data: string): string {
	if (!data) return data
	
	try {
		const key = getEncryptionKey()
		const iv = generateIV()
		
		const cipher = createCipheriv(ENCRYPTION_CONFIG.algorithm, key, iv)
		
		let encrypted = cipher.update(data, ENCRYPTION_CONFIG.encoding, ENCRYPTION_CONFIG.outputEncoding)
		encrypted += cipher.final(ENCRYPTION_CONFIG.outputEncoding)
		
		const tag = cipher.getAuthTag()
		
		// Combine IV + tag + encrypted data for storage
		const combined = iv.toString(ENCRYPTION_CONFIG.outputEncoding) + 
						  tag.toString(ENCRYPTION_CONFIG.outputEncoding) + 
						  encrypted
		
		return combined
	} catch (error) {
		console.error('Encryption error:', error)
		throw new Error('Failed to encrypt sensitive data')
	}
}

/**
 * Decrypts sensitive data using AES-256-GCM
 * 
 * @param encryptedData Combined encrypted data (IV + tag + encrypted)
 * @returns Decrypted plain text data
 */
export function decrypt(encryptedData: string): string {
	if (!encryptedData) return encryptedData
	
	try {
		const key = getEncryptionKey()
		
		// Extract IV, tag, and encrypted data
		const ivHex = encryptedData.substring(0, ENCRYPTION_CONFIG.ivLength * 2)
		const tagHex = encryptedData.substring(
			ENCRYPTION_CONFIG.ivLength * 2,
			(ENCRYPTION_CONFIG.ivLength + ENCRYPTION_CONFIG.tagLength) * 2
		)
		const encryptedHex = encryptedData.substring((ENCRYPTION_CONFIG.ivLength + ENCRYPTION_CONFIG.tagLength) * 2)
		
		const iv = Buffer.from(ivHex, ENCRYPTION_CONFIG.outputEncoding)
		const tag = Buffer.from(tagHex, ENCRYPTION_CONFIG.outputEncoding)
		const encrypted = Buffer.from(encryptedHex, ENCRYPTION_CONFIG.outputEncoding)
		
		const decipher = createDecipheriv(ENCRYPTION_CONFIG.algorithm, key, iv)
		decipher.setAuthTag(tag)
		
		let decrypted = decipher.update(encrypted, null, ENCRYPTION_CONFIG.encoding)
		decrypted += decipher.final(ENCRYPTION_CONFIG.encoding)
		
		return decrypted
	} catch (error) {
		console.error('Decryption error:', error)
		throw new Error('Failed to decrypt sensitive data')
	}
}

/**
 * Checks if a string appears to be encrypted
 * (basic heuristic for migration purposes)
 */
export function isEncrypted(data: string): boolean {
	if (!data || data.length < (ENCRYPTION_CONFIG.ivLength + ENCRYPTION_CONFIG.tagLength) * 2) {
		return false
	}
	
	// Check if data is valid hex
	const hexRegex = /^[0-9a-fA-F]+$/
	return hexRegex.test(data)
}

/**
 * Hashes sensitive data for comparison without decrypting
 * Used for secure data validation and indexing
 */
export function hashSensitiveData(data: string): string {
	if (!data) return ''
	
	return createHash('sha256')
		.update(data, ENCRYPTION_CONFIG.encoding)
		.digest('hex')
}

/**
 * Encrypts CPF with specific formatting for Brazilian compliance
 */
export function encryptCPF(cpf: string): string {
	if (!cpf) return cpf
	
	// Remove formatting before encryption
	const cleanCPF = cpf.replace(/[^\d]/g, '')
	return encrypt(cleanCPF)
}

/**
 * Decrypts CPF and formats it for display
 */
export function decryptCPF(encryptedCPF: string): string {
	if (!encryptedCPF) return encryptedCPF
	
	const decrypted = decrypt(encryptedCPF)
	
	// Format CPF: XXX.XXX.XXX-XX
	if (decrypted.length === 11) {
		return decrypted.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
	}
	
	return decrypted
}

/**
 * Validates if encryption key is properly configured
 */
export function validateEncryptionConfig(): { valid: boolean; message?: string } {
	try {
		const key = process.env.ENCRYPTION_KEY
		if (!key) {
			return {
				valid: false,
				message: 'ENCRYPTION_KEY environment variable is required for LGPD compliance'
			}
		}
		
		if (key.length < 16) {
			return {
				valid: false,
				message: 'ENCRYPTION_KEY must be at least 16 characters long'
			}
		}
		
		// Test encryption/decryption
		const testData = 'test encryption'
		const encrypted = encrypt(testData)
		const decrypted = decrypt(encrypted)
		
		if (decrypted !== testData) {
			return {
				valid: false,
				message: 'Encryption configuration test failed'
			}
		}
		
		return { valid: true }
	} catch (error) {
		return {
			valid: false,
			message: `Encryption validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
		}
	}
}
