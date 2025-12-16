import { mutation } from './_generated/server'
import { encrypt, decrypt, encryptCPF, decryptCPF } from './lib/encryption'
import { logAudit } from './lgpd'

export const test = mutation({
  args: {},
  handler: async (ctx) => {
    console.log('Starting LGPD Flow Verification...')

    // 1. Verify Encryption
    const originalEmail = 'test@example.com'
    const encrypted = encrypt(originalEmail)
    const decrypted = decrypt(encrypted)

    if (decrypted !== originalEmail) {
      throw new Error(`Encryption failed: ${originalEmail} -> ${encrypted} -> ${decrypted}`)
    }
    console.log('Encryption/Decryption: OK')

    // 2. Verify CPF Encryption
    const originalCPF = '123.456.789-00'
    const encryptedCPFVal = encryptCPF(originalCPF)
    const decryptedCPFVal = decryptCPF(encryptedCPFVal)

    // decryptCPF reformats it, so it should match original if original was formatted
    if (decryptedCPFVal !== originalCPF) {
      throw new Error(`CPF Encryption failed: ${originalCPF} -> ${encryptedCPFVal} -> ${decryptedCPFVal}`)
    }
    console.log('CPF Encryption: OK')

    // 3. Verify Log Audit
    const auditId = await ctx.db.insert('lgpdAudit', {
      actionType: 'data_creation',
      actorId: 'test_runner',
      dataCategory: 'test_data',
      description: 'Test audit log',
      legalBasis: 'test_execution',
      createdAt: Date.now()
    })

    const log = await ctx.db.get(auditId)
    if (!log) throw new Error('Failed to retrieve audit log')
    if (log.actorId !== 'test_runner') throw new Error('Audit log data mismatch')

    console.log('Audit Logging: OK')

    return 'SUCCESS: All LGPD checks passed'
  }
})
