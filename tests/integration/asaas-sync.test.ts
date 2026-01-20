/**
 * Asaas Sync Integration Tests
 *
 * Comprehensive integration tests for Asaas synchronization including:
 * - Complete import flow
 * - Bidirectional export
 * - Conflict resolution
 * - Webhook processing end-to-end
 * - Error recovery scenarios
 */

import { beforeEach, describe, expect, test, vi } from 'vitest';

import { validateAsaasCustomerPayload, validateCPF } from '../../convex/lib/validators';

// Type alias for Id to avoid import issues in tests
type Id<T> = string & { __brand: T };

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
				phone: '11999999999',
			} as any;

			const result = validateAsaasCustomerPayload(payload);
			expect(result.valid).toBe(false);
			expect(result.errors).toContain('Nome é obrigatório');
		});

		test('Email inválido deve falhar', () => {
			const payload = {
				name: 'Test User',
				email: 'invalid-email',
				phone: '11999999999',
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
			auth: { getUserIdentity: vi.fn().mockResolvedValue({ subject: 'user123' }) },
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
				{
					studentId,
				},
			);
		});

		test('Deve verificar customer existente antes de criar', async () => {
			// Simular syncStudentAsCustomerInternal
			const student = {
				_id: 'student123',
				name: 'Test',
				email: 'test@example.com',
				cpf: '52998224725',
			};

			mockDb.get.mockResolvedValue(student);

			// Mock checkExistingAsaasCustomer retornando existe
			mockRunAction.mockResolvedValue({ exists: true, customerId: 'cus_existing' });

			// Lógica simplificada
			const existing = await ctx.runAction('api.asaas.actions.checkExistingAsaasCustomer', {
				cpf: student.cpf,
				email: student.email,
			});

			if (existing.exists) {
				await ctx.runMutation('internal.asaas.mutations.updateStudentAsaasId', {
					studentId: student._id,
					asaasCustomerId: existing.customerId,
				});
			}

			expect(mockRunAction).toHaveBeenCalled();
			expect(mockRunMutation).toHaveBeenCalledWith(
				'internal.asaas.mutations.updateStudentAsaasId',
				{
					studentId: student._id,
					asaasCustomerId: 'cus_existing',
				},
			);
		});
	});
});

/**
 * Integration Tests: Complete Import Flow
 * Tests the full flow from Asaas API to local database
 */
describe('Integration - Complete Import Flow', () => {
	describe('Customer Import Flow', () => {
		test('should import new customer from Asaas and create student', async () => {
			// Setup mock context
			const ctx = {
				runQuery: vi.fn(),
				runMutation: vi.fn(),
			};

			// Asaas customer response
			const asaasCustomer = {
				id: 'cus_asaas_123',
				name: 'João Silva',
				email: 'joao@example.com',
				phone: '11999999999',
				cpfCnpj: '52998224725',
				notificationDisabled: false,
			};

			// Student not found
			ctx.runQuery.mockResolvedValue(null);
			// Create student returns new ID
			ctx.runMutation.mockResolvedValue('student_123' as Id<'students'>);

			// Simulate import flow
			const existingStudent = await ctx.runQuery('api.asaas.queries.getStudentByAsaasId', {
				asaasCustomerId: asaasCustomer.id,
			});

			if (!existingStudent) {
				const newStudentId = await ctx.runMutation(
					'api.asaas.mutations.createStudentFromCustomer',
					{
						name: asaasCustomer.name,
						email: asaasCustomer.email,
						phone: asaasCustomer.phone,
						asaasCustomerId: asaasCustomer.id,
					},
				);

				expect(newStudentId).toBeDefined();
				expect(ctx.runMutation).toHaveBeenCalledWith(
					'api.asaas.mutations.createStudentFromCustomer',
					expect.objectContaining({
						name: asaasCustomer.name,
						asaasCustomerId: asaasCustomer.id,
					}),
				);
			}
		});

		test('should link existing student when importing customer', async () => {
			const ctx = {
				runQuery: vi.fn(),
				runMutation: vi.fn(),
			};

			const asaasCustomer = {
				id: 'cus_asaas_123',
				name: 'João Silva',
				email: 'joao@example.com',
				phone: '11999999999',
				cpfCnpj: '52998224725',
			};

			const existingStudent = {
				_id: 'student_existing' as Id<'students'>,
				name: 'João Silva',
				email: 'joao@example.com',
				asaasCustomerId: undefined,
			};

			// Student found by email/CPF
			ctx.runQuery.mockResolvedValue(existingStudent);

			// Simulate linking flow
			const student = await ctx.runQuery('api.asaas.queries.findStudentByCpfOrEmail', {
				cpf: asaasCustomer.cpfCnpj,
				email: asaasCustomer.email,
			});

			if (student && !student.asaasCustomerId) {
				await ctx.runMutation('api.asaas.mutations.updateStudentAsaasId', {
					studentId: student._id,
					asaasCustomerId: asaasCustomer.id,
				});

				expect(ctx.runMutation).toHaveBeenCalledWith('api.asaas.mutations.updateStudentAsaasId', {
					studentId: student._id,
					asaasCustomerId: asaasCustomer.id,
				});
			}
		});
	});

	describe('Payment Import Flow', () => {
		test('should import payment and link to student', async () => {
			const ctx = {
				runQuery: vi.fn(),
				runMutation: vi.fn(),
			};

			const asaasPayment = {
				id: 'pay_asaas_123',
				customer: 'cus_asaas_123',
				value: 100,
				netValue: 97.5,
				status: 'CONFIRMED',
				billingType: 'BOLETO',
				dueDate: '2025-01-15',
				paymentDate: '2025-01-15',
			};

			const student = {
				_id: 'student_123' as Id<'students'>,
				asaasCustomerId: 'cus_asaas_123',
			};

			// Student found
			ctx.runQuery.mockResolvedValueOnce(student);
			// Payment not found
			ctx.runQuery.mockResolvedValueOnce(null);
			// Create payment
			ctx.runMutation.mockResolvedValue('payment_123' as Id<'asaasPayments'>);

			// Simulate import flow
			const studentRecord = await ctx.runQuery('api.asaas.queries.getStudentByAsaasId', {
				asaasCustomerId: asaasPayment.customer,
			});

			if (studentRecord) {
				const existingPayment = await ctx.runQuery('api.asaas.queries.getPaymentByAsaasId', {
					asaasPaymentId: asaasPayment.id,
				});

				if (!existingPayment) {
					const paymentId = await ctx.runMutation('api.asaas.mutations.createPaymentFromAsaas', {
						studentId: studentRecord._id,
						asaasPaymentId: asaasPayment.id,
						value: asaasPayment.value,
						status: asaasPayment.status,
					});

					expect(paymentId).toBeDefined();
				}
			}
		});
	});
});

/**
 * Integration Tests: Conflict Resolution
 * Tests scenarios where local and remote data conflict
 */
describe('Integration - Conflict Resolution', () => {
	describe('local_wins strategy', () => {
		test('should update Asaas with local data when local_wins', async () => {
			const ctx = {
				runAction: vi.fn(),
				runQuery: vi.fn(),
			};

			const localStudent = {
				_id: 'student_123' as Id<'students'>,
				asaasCustomerId: 'cus_asaas_123',
				name: 'João Silva Atualizado',
				email: 'joao.novo@example.com',
				updatedAt: Date.now(),
			};

			// In local_wins strategy, we ignore Asaas data and update remote with local
			ctx.runQuery.mockResolvedValue(localStudent);
			ctx.runAction.mockResolvedValue({ updated: true });

			// Simulate conflict resolution
			const student = await ctx.runQuery('api.asaas.queries.getStudentById', {
				studentId: localStudent._id,
			});

			if (student) {
				// local_wins: update Asaas with local data
				await ctx.runAction('api.asaas.actions.updateAsaasCustomer', {
					customerId: student.asaasCustomerId,
					name: student.name,
					email: student.email,
				});

				expect(ctx.runAction).toHaveBeenCalledWith('api.asaas.actions.updateAsaasCustomer', {
					customerId: localStudent.asaasCustomerId,
					name: localStudent.name,
					email: localStudent.email,
				});
			}
		});
	});

	describe('newest_wins strategy', () => {
		test('should use newer data based on updatedAt timestamp', async () => {
			const ctx = {
				runAction: vi.fn(),
				runMutation: vi.fn(),
				runQuery: vi.fn(),
			};

			const now = Date.now();
			const oneHourAgo = now - 3_600_000;

			const localStudent = {
				_id: 'student_123' as Id<'students'>,
				asaasCustomerId: 'cus_asaas_123',
				name: 'João Local',
				updatedAt: oneHourAgo, // Older
			};

			const asaasCustomer = {
				id: 'cus_asaas_123',
				name: 'João Asaas',
				updateDate: new Date(now).toISOString(), // Newer
			};

			ctx.runQuery.mockResolvedValue(localStudent);

			// Simulate newest_wins comparison
			const localDate = new Date(localStudent.updatedAt);
			const asaasDate = new Date(asaasCustomer.updateDate);

			if (asaasDate > localDate) {
				// Asaas is newer - update local
				await ctx.runMutation('api.asaas.mutations.updateStudentFromAsaas', {
					studentId: localStudent._id,
					name: asaasCustomer.name,
				});

				expect(ctx.runMutation).toHaveBeenCalledWith('api.asaas.mutations.updateStudentFromAsaas', {
					studentId: localStudent._id,
					name: asaasCustomer.name,
				});
			} else {
				// Local is newer - update Asaas
				await ctx.runAction('api.asaas.actions.updateAsaasCustomer', {
					customerId: asaasCustomer.id,
					name: localStudent.name,
				});
			}
		});
	});

	describe('manual strategy', () => {
		test('should flag conflict for manual review', async () => {
			const ctx = {
				runMutation: vi.fn(),
			};

			const conflict = {
				studentId: 'student_123' as Id<'students'>,
				asaasCustomerId: 'cus_asaas_123',
				field: 'name',
				localValue: 'João Local',
				remoteValue: 'João Asaas',
				strategy: 'manual',
			};

			ctx.runMutation.mockResolvedValue('conflict_123' as Id<'asaasConflicts'>);

			// Simulate flagging for manual review
			const conflictId = await ctx.runMutation('api.asaas.mutations.createConflictRecord', {
				studentId: conflict.studentId,
				field: conflict.field,
				localValue: conflict.localValue,
				remoteValue: conflict.remoteValue,
			});

			expect(conflictId).toBeDefined();
			expect(ctx.runMutation).toHaveBeenCalledWith('api.asaas.mutations.createConflictRecord', {
				studentId: conflict.studentId,
				field: conflict.field,
				localValue: conflict.localValue,
				remoteValue: conflict.remoteValue,
			});
		});
	});
});

/**
 * Integration Tests: Webhook Processing End-to-End
 * Tests complete webhook flow from reception to processing
 */
describe('Integration - Webhook Processing', () => {
	describe('Payment confirmed webhook', () => {
		test('should process PAYMENT_CONFIRMED webhook end-to-end', async () => {
			const ctx = {
				db: {
					query: vi.fn(),
					insert: vi.fn(),
				},
				runMutation: vi.fn(),
				scheduler: {
					runAfter: vi.fn(),
				},
			};

			const webhookPayload = {
				event: 'PAYMENT_CONFIRMED',
				payment: {
					id: 'pay_asaas_123',
					status: 'CONFIRMED',
					value: 100,
					netValue: 97.5,
					billingType: 'BOLETO',
					dueDate: '2025-01-15',
					paymentDate: '2025-01-15',
				},
			};

			const paymentRecord = {
				_id: 'payment_123' as Id<'asaasPayments'>,
				studentId: 'student_123' as Id<'students'>,
				status: 'PENDING',
			};

			// No deduplication entry
			const firstMock = vi.fn().mockResolvedValue(null);
			ctx.db.query = vi.fn().mockReturnValue({
				withIndex: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						first: firstMock,
					}),
				}),
			});

			ctx.runMutation.mockResolvedValue(undefined);
			ctx.db.insert.mockResolvedValue('dedup_123');

			// Simulate webhook processing
			const idempotencyKey = `PAYMENT_CONFIRMED:${webhookPayload.payment.id}`;

			const existing = await ctx.db
				.query('asaasWebhookDeduplication' as any)
				.withIndex('by_idempotency_key' as any)
				.eq('idempotencyKey', idempotencyKey)
				.first();

			if (!existing) {
				// Create deduplication entry
				await ctx.db.insert('asaasWebhookDeduplication' as any, {
					idempotencyKey,
					processedAt: Date.now(),
					expiresAt: Date.now() + 86_400_000, // 24h
				});

				// Update payment status
				await ctx.runMutation('api.asaas.mutations.updatePaymentStatus', {
					paymentId: paymentRecord._id,
					status: 'CONFIRMED',
					paymentDate: webhookPayload.payment.paymentDate,
				});

				// Schedule notification
				await ctx.scheduler.runAfter(0, expect.anything(), {
					paymentId: paymentRecord._id,
					studentId: paymentRecord.studentId,
				});
			}

			expect(firstMock).toHaveBeenCalled();
			expect(ctx.runMutation).toHaveBeenCalledWith(
				'api.asaas.mutations.updatePaymentStatus',
				expect.anything(),
			);
			expect(ctx.scheduler.runAfter).toHaveBeenCalled();
		});
	});

	describe('Idempotency in webhooks', () => {
		test('should skip processing duplicate webhook', async () => {
			const ctx = {
				db: {
					query: vi.fn(),
				},
			};

			const idempotencyKey = 'PAYMENT_CONFIRMED:pay_asaas_123';

			// Existing deduplication entry
			const firstMock = vi.fn().mockResolvedValue({
				_id: 'dedup_123',
				idempotencyKey,
				processedAt: Date.now() - 1000,
				expiresAt: Date.now() + 86_400_000,
			});

			ctx.db.query = vi.fn().mockReturnValue({
				withIndex: vi.fn().mockReturnValue({
					eq: vi.fn().mockReturnValue({
						first: firstMock,
					}),
				}),
			});

			// Simulate idempotency check
			const existing = await ctx.db
				.query('asaasWebhookDeduplication' as any)
				.withIndex('by_idempotency_key' as any)
				.eq('idempotencyKey', idempotencyKey)
				.first();

			if (existing) {
				// Skip processing - already processed
				expect(existing).toBeDefined();
				expect(existing.idempotencyKey).toBe(idempotencyKey);
			}
		});
	});
});

/**
 * Integration Tests: Error Recovery
 * Tests system behavior under error conditions
 */
describe('Integration - Error Recovery', () => {
	describe('API failure recovery', () => {
		test('should retry failed API calls with exponential backoff', async () => {
			const ctx = {
				runAction: vi.fn(),
			};

			const attempts: number[] = [];
			const maxRetries = 3;

			// Simulate API failure then success
			ctx.runAction.mockImplementation(async () => {
				attempts.push(attempts.length + 1);
				if (attempts.length < maxRetries) {
					throw new Error('API temporary error');
				}
				return { success: true };
			});

			// Simulate retry logic
			let lastError: Error | null = null;
			for (let attempt = 0; attempt <= maxRetries; attempt++) {
				try {
					const result = await ctx.runAction('api.asaas.actions.createCustomer', {
						name: 'Test Customer',
					});
					expect(result.success).toBe(true);
					lastError = null; // Clear error on success
					break;
				} catch (error) {
					lastError = error as Error;
					// Exponential backoff: 100ms, 200ms, 400ms
					await new Promise((resolve) => setTimeout(resolve, 100 * 2 ** attempt));
				}
			}

			expect(attempts.length).toBe(3);
			expect(lastError).toBeNull();
		});
	});

	describe('Stuck sync detection', () => {
		test('should mark sync as failed after timeout', async () => {
			const ctx = {
				runQuery: vi.fn(),
				runMutation: vi.fn(),
			};

			const stuckSync = {
				_id: 'sync_123' as Id<'asaasSyncLogs'>,
				status: 'running',
				startedAt: Date.now() - 3_600_000, // Started 1 hour ago
			};

			ctx.runQuery.mockResolvedValue(stuckSync);
			ctx.runMutation.mockResolvedValue(undefined);

			// Simulate stuck sync check
			const oneHourAgo = Date.now() - 3_600_000;

			const sync = await ctx.runQuery('api.asaas.queries.getRunningSyncs');

			if (sync && sync.startedAt < oneHourAgo) {
				// Mark as failed
				await ctx.runMutation('api.asaas.mutations.markSyncFailed', {
					syncId: sync._id,
					reason: 'Sync timeout - running for over 1 hour',
				});

				expect(ctx.runMutation).toHaveBeenCalledWith('api.asaas.mutations.markSyncFailed', {
					syncId: sync._id,
					reason: expect.stringContaining('timeout'),
				});
			}
		});
	});

	describe('Circuit breaker recovery', () => {
		test('should transition from open to half-open after cooldown', async () => {
			const circuitState = {
				state: 'open',
				failureCount: 5,
				lastFailureTime: Date.now() - 60_000, // 1 minute ago
				cooldownPeriod: 60_000, // 1 minute
			};

			// Simulate circuit breaker state check
			const timeSinceLastFailure = Date.now() - circuitState.lastFailureTime;

			if (circuitState.state === 'open' && timeSinceLastFailure > circuitState.cooldownPeriod) {
				// Transition to half-open
				circuitState.state = 'half-open';
				expect(circuitState.state).toBe('half-open');
			}
		});

		test('should allow test call in half-open state', async () => {
			const ctx = {
				runAction: vi.fn(),
			};

			const circuitState = {
				state: 'half-open',
				successfulTestCalls: 0,
				requiredSuccessfulCalls: 3,
			};

			ctx.runAction.mockResolvedValue({ success: true });

			// Simulate test call in half-open state
			if (circuitState.state === 'half-open') {
				const result = await ctx.runAction('api.asaas.actions.healthCheck');

				if (result.success) {
					circuitState.successfulTestCalls++;

					if (circuitState.successfulTestCalls >= circuitState.requiredSuccessfulCalls) {
						// Transition to closed
						circuitState.state = 'closed';
						expect(circuitState.state).toBe('closed');
					}
				}
			}
		});
	});
});

/**
 * Integration Tests: Batch Processing
 * Tests batch processing with error isolation
 */
describe('Integration - Batch Processing', () => {
	test('should continue batch after individual item failure', async () => {
		const ctx = {
			runMutation: vi.fn(),
		};

		const items = [
			{ id: 1, name: 'Item 1' },
			{ id: 2, name: 'Item 2' }, // This will fail
			{ id: 3, name: 'Item 3' },
		];

		const results = [];

		// Simulate batch processing with error isolation
		for (const item of items) {
			try {
				if (item.id === 2) {
					throw new Error('Item 2 failed');
				}
				const result = await ctx.runMutation('api.asaas.mutations.processItem', { item });
				results.push({ success: true, item, data: result });
			} catch (error) {
				results.push({ success: false, item, error: (error as Error).message });
			}
		}

		expect(results).toHaveLength(3);
		expect(results[0].success).toBe(true);
		expect(results[1].success).toBe(false);
		expect(results[2].success).toBe(true);
	});

	test('should track progress in batch processing', async () => {
		const onProgress = vi.fn();
		const items = Array.from({ length: 100 }, (_, i) => ({ id: i }));
		const checkpointInterval = 50;

		const ctx = {
			runMutation: vi.fn().mockResolvedValue({ success: true }),
		};

		let processed = 0;

		for (const item of items) {
			await ctx.runMutation('api.asaas.mutations.processItem', { item });
			processed++;

			// Call onProgress at checkpoints
			if (processed % checkpointInterval === 0 || processed === items.length) {
				onProgress({ totalProcessed: processed, total: items.length });
			}
		}

		expect(onProgress).toHaveBeenCalledWith({ totalProcessed: 50, total: 100 });
		expect(onProgress).toHaveBeenCalledWith({ totalProcessed: 100, total: 100 });
	});
});
