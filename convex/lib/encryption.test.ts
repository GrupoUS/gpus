import { describe, expect, it, vi } from 'vitest'
import { encrypt, decrypt, hashSensitiveData, encryptCPF, decryptCPF, isEncrypted } from './encryption'

// Mock environment variable
vi.stubEnv('ENCRYPTION_KEY', 'test-encryption-key-at-least-16-chars')

describe('Encryption Utilities (LGPD Compliance)', () => {
  it('should encrypt and decrypt data correctly', async () => {
    const originalData = 'Sensitive Student Data'
    const encrypted = await encrypt(originalData)
    
    expect(encrypted).toBeDefined()
    expect(typeof encrypted).toBe('string')
    expect(encrypted).not.toBe(originalData)
    
    const decrypted = await decrypt(encrypted)
    expect(decrypted).toBe(originalData)
  })

  it('should generate different ciphertexts for the same input (IV uniqueness)', async () => {
    const data = 'Same Data'
    const encrypted1 = await encrypt(data)
    const encrypted2 = await encrypt(data)
    
    expect(encrypted1).not.toBe(encrypted2)
    expect(await decrypt(encrypted1)).toBe(data)
    expect(await decrypt(encrypted2)).toBe(data)
  })

  it('should correctly identify encrypted strings', async () => {
    const plainText = 'not encrypted'
    const encrypted = await encrypt('secret')
    
    expect(isEncrypted(encrypted)).toBe(true)
    expect(isEncrypted(plainText)).toBe(false)
  })

  it('should hash sensitive data consistently for indexing', async () => {
    const data = '123.456.789-00'
    const hash1 = await hashSensitiveData(data)
    const hash2 = await hashSensitiveData(data)
    
    expect(hash1).toBe(hash2)
    expect(hash1).toHaveLength(64) // SHA-256 hex
  })

  it('should handle CPF encryption and formatting', async () => {
    const rawCPF = '12345678900'
    const formattedCPF = '123.456.789-00'
    
    const encrypted = await encryptCPF(formattedCPF)
    const decrypted = await decryptCPF(encrypted)
    
    expect(decrypted).toBe(formattedCPF)
    
    // Verify it strips formatting before encryption but restores it after decryption
    const encryptedRaw = await encryptCPF(rawCPF)
    const decryptedRaw = await decryptCPF(encryptedRaw)
    expect(decryptedRaw).toBe(formattedCPF)
  })

  it('should throw error if ENCRYPTION_KEY is missing', async () => {
    vi.stubEnv('ENCRYPTION_KEY', '')
    await expect(encrypt('data')).rejects.toThrow('ENCRYPTION_KEY environment variable is required')
    vi.stubEnv('ENCRYPTION_KEY', 'test-encryption-key-at-least-16-chars')
  })
})
