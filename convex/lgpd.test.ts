import { describe, expect, it, vi } from 'vitest'
import { logAudit } from './lgpd'
import type { MutationCtx } from './_generated/server'

describe('LGPD Audit Logging', () => {
  it('should insert audit record with correct parameters', async () => {
    const mockInsert = vi.fn()
    const mockGetUserIdentity = vi.fn().mockResolvedValue({ subject: 'user_123' })
    
    const mockCtx = {
      db: {
        insert: mockInsert,
      },
      auth: {
        getUserIdentity: mockGetUserIdentity,
      },
    } as unknown as MutationCtx

    const auditParams = {
      actionType: 'data_access' as const,
      dataCategory: 'personal_info',
      description: 'User accessed student profile',
      legalBasis: 'contract',
      studentId: 'student_abc' as any,
    }

    await logAudit(mockCtx, auditParams)

    expect(mockInsert).toHaveBeenCalledWith('lgpdAudit', expect.objectContaining({
      actionType: 'data_access',
      actorId: 'user_123',
      dataCategory: 'personal_info',
      description: 'User accessed student profile',
      legalBasis: 'contract',
      studentId: 'student_abc',
    }))
    expect(mockInsert.mock.calls[0][1].createdAt).toBeDefined()
  })

  it('should fallback to system actor if no identity is present', async () => {
    const mockInsert = vi.fn()
    const mockGetUserIdentity = vi.fn().mockResolvedValue(null)
    
    const mockCtx = {
      db: {
        insert: mockInsert,
      },
      auth: {
        getUserIdentity: mockGetUserIdentity,
      },
    } as unknown as MutationCtx

    await logAudit(mockCtx, {
      actionType: 'security_event' as const,
      dataCategory: 'system',
      description: 'System maintenance',
      legalBasis: 'legal_obligation',
    })

    expect(mockInsert).toHaveBeenCalledWith('lgpdAudit', expect.objectContaining({
      actorId: 'system',
    }))
  })
})
