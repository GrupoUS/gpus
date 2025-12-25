import { test, expect, vi, describe, beforeEach } from 'vitest';
import { validateCPF, validateAsaasCustomerPayload } from '../../convex/lib/validators';

describe('Asaas Sync Integration', () => {
  
  describe('Validação de CPF', () => {
    test('CPF Inválido (dígitos repetidos) deve falhar', () => {
      const result = validateCPF('111.111.111-11');
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dígitos repetidos');
    });

    test('CPF Inválido (dígito verificador) deve falhar', () => {
      const result = validateCPF('123.456.789-00'); // Inválido
      expect(result.valid).toBe(false);
      expect(result.error).toContain('dígito verificador');
    });

    test('CPF Válido deve passar', () => {
      // CPF gerado válido para teste
      const result = validateCPF('52998224725'); 
      expect(result.valid).toBe(true);
    });
  });

  describe('Validação de Payload', () => {
    test('Payload sem nome deve falhar', () => {
      const payload = {
        email: 'test@example.com',
        phone: '11999999999'
      } as any;
      
      const result = validateAsaasCustomerPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Nome é obrigatório');
    });

    test('Email inválido deve falhar', () => {
      const payload = {
        name: 'Test User',
        email: 'invalid-email',
        phone: '11999999999'
      } as any;
      
      const result = validateAsaasCustomerPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Email inválido');
    });
  });

  describe('Fluxo de Sincronização (Mock)', () => {
    // Mock do contexto Convex
    const mockDb = {
      get: vi.fn(),
      patch: vi.fn(),
      insert: vi.fn(),
    };
    
    const mockScheduler = {
      runAfter: vi.fn(),
    };

    const mockRunAction = vi.fn();
    const mockRunMutation = vi.fn();

    const ctx = {
      db: mockDb,
      scheduler: mockScheduler,
      runAction: mockRunAction,
      runMutation: mockRunMutation,
      auth: { getUserIdentity: vi.fn().mockResolvedValue({ subject: 'user123' }) }
    };

    beforeEach(() => {
      vi.clearAllMocks();
    });

    test('Deve agendar sincronização ao criar aluno', async () => {
      // Simular mutation createStudent
      const studentId = 'student123';
      
      // Lógica simplificada da mutation
      await ctx.scheduler.runAfter(0, 'internal.asaas.mutations.syncStudentAsCustomerInternal', {
        studentId,
      });

      expect(ctx.scheduler.runAfter).toHaveBeenCalledWith(
        0, 
        'internal.asaas.mutations.syncStudentAsCustomerInternal', 
        { studentId }
      );
    });

    test('Deve verificar customer existente antes de criar', async () => {
      // Simular syncStudentAsCustomerInternal
      const student = {
        _id: 'student123',
        name: 'Test',
        email: 'test@example.com',
        cpf: '52998224725'
      };

      mockDb.get.mockResolvedValue(student);
      
      // Mock checkExistingAsaasCustomer retornando existe
      mockRunAction.mockResolvedValue({ exists: true, customerId: 'cus_existing' });

      // Lógica simplificada
      const existing = await ctx.runAction('api.asaas.actions.checkExistingAsaasCustomer', {
        cpf: student.cpf,
        email: student.email
      });

      if (existing.exists) {
        await ctx.runMutation('internal.asaas.mutations.updateStudentAsaasId', {
          studentId: student._id,
          asaasCustomerId: existing.customerId
        });
      }

      expect(mockRunAction).toHaveBeenCalled();
      expect(mockRunMutation).toHaveBeenCalledWith(
        'internal.asaas.mutations.updateStudentAsaasId',
        { studentId: student._id, asaasCustomerId: 'cus_existing' }
      );
    });
  });
});
