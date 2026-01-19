/**
 * LGPD-Compliant Encryption Utilities
 *
 * Provides AES-256-GCM encryption for sensitive PII data
 * following Brazilian data protection requirements.
 *
 * Uses Web Crypto API for Convex V8 runtime compatibility.
 */

// Text encoder/decoder for string conversion
const encoder = new TextEncoder();
const decoder = new TextDecoder();

/**
 * Encryption configuration for LGPD compliance
 */
const ENCRYPTION_CONFIG = {
	algorithm: 'AES-GCM' as const,
	keyLength: 256, // bits
	ivLength: 12, // 96 bits recommended for AES-GCM
	tagLength: 128, // bits
} as const;

/**
 * Converts ArrayBuffer to hex string
 */
function bufferToHex(buffer: ArrayBuffer): string {
	return Array.from(new Uint8Array(buffer))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

/**
 * Converts hex string to Uint8Array
 */
function hexToBuffer(hex: string): Uint8Array {
	const bytes = new Uint8Array(hex.length / 2);
	for (let i = 0; i < hex.length; i += 2) {
		bytes[i / 2] = Number.parseInt(hex.substring(i, i + 2), 16);
	}
	return bytes;
}

/**
 * Derives encryption key from environment variable
 * Uses SHA-256 to ensure proper key length
 */
async function getEncryptionKey(): Promise<CryptoKey> {
	const keyString = process.env.ENCRYPTION_KEY;
	if (!keyString) {
		throw new Error('ENCRYPTION_KEY environment variable is required for LGPD compliance');
	}

	// Hash the key string to get exactly 256 bits
	const keyMaterial = encoder.encode(keyString);
	const keyHash = await crypto.subtle.digest('SHA-256', keyMaterial);

	// Import as AES-GCM key
	return crypto.subtle.importKey('raw', keyHash, { name: ENCRYPTION_CONFIG.algorithm }, false, [
		'encrypt',
		'decrypt',
	]);
}

/**
 * Generates cryptographically secure random IV
 */
function generateIV(): Uint8Array {
	return crypto.getRandomValues(new Uint8Array(ENCRYPTION_CONFIG.ivLength));
}

/**
 * Encrypts sensitive data using AES-256-GCM
 *
 * @param data Plain text data to encrypt
 * @returns Encrypted data with IV (hex encoded)
 */
export async function encrypt(data: string): Promise<string> {
	if (!data) return data;

	try {
		const key = await getEncryptionKey();
		const iv = generateIV();
		const encodedData = encoder.encode(data);

		const encrypted = await crypto.subtle.encrypt(
			{
				name: ENCRYPTION_CONFIG.algorithm,
				iv: iv as Uint8Array<ArrayBuffer>,
				tagLength: ENCRYPTION_CONFIG.tagLength,
			},
			key,
			encodedData,
		);

		// Combine IV + encrypted data (which includes auth tag in Web Crypto)
		const combined = new Uint8Array(iv.length + encrypted.byteLength);
		combined.set(iv, 0);
		combined.set(new Uint8Array(encrypted), iv.length);

		return bufferToHex(combined.buffer as ArrayBuffer);
	} catch (error) {
		if (error instanceof Error && error.message.includes('ENCRYPTION_KEY')) {
			throw error;
		}
		throw new Error('Failed to encrypt sensitive data');
	}
}

/**
 * Decrypts sensitive data using AES-256-GCM
 *
 * @param encryptedData Combined encrypted data (IV + encrypted, hex encoded)
 * @returns Decrypted plain text data
 */
export async function decrypt(encryptedData: string): Promise<string> {
	if (!encryptedData) return encryptedData;

	try {
		const key = await getEncryptionKey();

		// Extract IV and encrypted data from hex string
		const combined = hexToBuffer(encryptedData);
		const iv = combined.slice(0, ENCRYPTION_CONFIG.ivLength);
		const encrypted = combined.slice(ENCRYPTION_CONFIG.ivLength);

		const decrypted = await crypto.subtle.decrypt(
			{
				name: ENCRYPTION_CONFIG.algorithm,
				iv,
				tagLength: ENCRYPTION_CONFIG.tagLength,
			},
			key,
			encrypted,
		);

		return decoder.decode(decrypted);
	} catch (error) {
		if (error instanceof Error && error.message.includes('ENCRYPTION_KEY')) {
			throw error;
		}
		throw new Error('Failed to decrypt sensitive data');
	}
}

/**
 * Checks if a string appears to be encrypted
 * (basic heuristic for migration purposes)
 */
export function isEncrypted(data: string): boolean {
	if (!data || data.length < ENCRYPTION_CONFIG.ivLength * 2 + 32) {
		return false;
	}

	// Check if data is valid hex
	const hexRegex = /^[0-9a-fA-F]+$/;
	return hexRegex.test(data);
}

/**
 * Hashes sensitive data for comparison without decrypting
 * Used for secure data validation and indexing
 */
export async function hashSensitiveData(data: string): Promise<string> {
	if (!data) return '';

	// Ensure normalization (trim and lowercase)
	const normalized = data.trim().toLowerCase();
	const encoded = encoder.encode(normalized);
	const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
	return bufferToHex(hashBuffer);
}

/**
 * Normalizes and hashes CPF for blind indexing
 */
export async function hashCPF(cpf: string): Promise<string> {
	if (!cpf) return '';

	// Strict normalization: only digits
	const cleanCPF = cpf.replace(/[^\d]/g, '');
	return hashSensitiveData(cleanCPF);
}

/**
 * Encrypts CPF with specific formatting for Brazilian compliance
 */
export async function encryptCPF(cpf: string): Promise<string> {
	if (!cpf) return cpf;

	// Remove formatting before encryption
	const cleanCPF = cpf.replace(/[^\d]/g, '');
	return encrypt(cleanCPF);
}

/**
 * Decrypts CPF and formats it for display
 */
export async function decryptCPF(encryptedCPF: string): Promise<string> {
	if (!encryptedCPF) return encryptedCPF;

	const decrypted = await decrypt(encryptedCPF);

	// Format CPF: XXX.XXX.XXX-XX
	if (decrypted.length === 11) {
		return decrypted.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
	}

	return decrypted;
}

/**
 * Validates if encryption key is properly configured
 */
export async function validateEncryptionConfig(): Promise<{ valid: boolean; message?: string }> {
	try {
		const key = process.env.ENCRYPTION_KEY;
		if (!key) {
			return {
				valid: false,
				message: 'ENCRYPTION_KEY environment variable is required for LGPD compliance',
			};
		}

		if (key.length < 16) {
			return {
				valid: false,
				message: 'ENCRYPTION_KEY must be at least 16 characters long',
			};
		}

		// Test encryption/decryption
		const testData = 'test encryption';
		const encrypted = await encrypt(testData);
		const decrypted = await decrypt(encrypted);

		if (decrypted !== testData) {
			return {
				valid: false,
				message: 'Encryption configuration test failed',
			};
		}

		return { valid: true };
	} catch (error) {
		return {
			valid: false,
			message: `Encryption validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
		};
	}
}
