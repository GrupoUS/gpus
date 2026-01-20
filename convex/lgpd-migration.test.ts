import { describe, expect, it, vi } from 'vitest';

const SHA256_HEX_REGEX = /^[a-f0-9]{64}$/;

// Set encryption key BEFORE any imports that use it
process.env.ENCRYPTION_KEY = 'test-encryption-key-at-least-16-chars';

import { createStudentFromAsaas } from './asaas/mutations';
import { encryptLegacyCpfs } from './migrations';

type ConvexHandler = (ctx: unknown, args: unknown) => Promise<unknown> | unknown;

// Helper to access handler from Convex mutation object
const getHandler = (mutation: unknown): ConvexHandler => {
	if (mutation && typeof mutation === 'object') {
		const handler = (mutation as { handler?: unknown }).handler;
		if (typeof handler === 'function') return handler as ConvexHandler;
		// biome-ignore lint/style/useNamingConvention: Convex internal handler uses _handler
		const internalHandler = (mutation as { _handler?: unknown })._handler;
		if (typeof internalHandler === 'function') return internalHandler as ConvexHandler;
	}
	throw new Error('Could not resolve handler from mutation object');
};

describe('LGPD CPF Encryption & Migration (Unit)', () => {
	it('should encrypt CPF and generate hash when creating student from Asaas', async () => {
		const args = {
			name: 'Test Student',
			email: 'test@example.com',
			phone: '11999999999',
			cpf: '123.456.789-00',
			asaasCustomerId: 'cus_123',
			organizationId: 'org_123',
		};

		const mockDb = {
			insert: vi.fn().mockResolvedValue('student_123'),
			get: vi.fn(),
			patch: vi.fn(),
			query: vi.fn(),
		};

		// Mock auth to allow requireAuth/getOrganizationId to work if they were called
		// But this is an internalMutation, so it might not call them (or we mock them if it does)
		// createStudentFromAsaas does NOT call requireAuth (it's internal).

		const mockCtx: { db: typeof mockDb; auth: { getUserIdentity: () => unknown } } = {
			db: mockDb,
			auth: { getUserIdentity: vi.fn() },
		};

		const handler = getHandler(createStudentFromAsaas);
		if (typeof handler !== 'function') {
			throw new Error(
				`Could not find handler function on mutation object. Keys: ${Object.keys(createStudentFromAsaas)}`,
			);
		}

		await handler(mockCtx, args);

		// Verify insert was called with encrypted fields
		expect(mockDb.insert).toHaveBeenCalledTimes(1);
		const insertCall = mockDb.insert.mock.calls[0];
		const tableName = insertCall[0];
		const data = insertCall[1];

		expect(tableName).toBe('students');
		expect(data.cpf).toBe(args.cpf); // Plaintext still kept for now
		expect(data.encryptedCPF).toBeDefined();
		expect(data.encryptedCPF).not.toBe(args.cpf); // Should be encrypted
		expect(data.cpfHash).toBeDefined();
		// Verify hash format (SHA-256 hex is 64 chars)
		expect(data.cpfHash).toMatch(SHA256_HEX_REGEX);
	});

	it('should migrate legacy students with plaintext CPF', async () => {
		const limit = 10;

		const legacyStudent = {
			// biome-ignore lint/style/useNamingConvention: Convex document ids use _id
			_id: 'student_legacy',
			name: 'Legacy Student',
			cpf: '111.222.333-44',
			// missing encryptedCPF and cpfHash
		};

		// Mock query chain: ctx.db.query().collect()
		const mockCollect = vi.fn().mockResolvedValue([legacyStudent]);
		const mockQuery = {
			collect: mockCollect,
		};

		const mockDb = {
			query: vi.fn().mockReturnValue(mockQuery),
			patch: vi.fn().mockResolvedValue(undefined),
		};

		const mockCtx: { db: typeof mockDb } = {
			db: mockDb,
		};

		const handler = getHandler(encryptLegacyCpfs);

		const result = (await handler(mockCtx, { limit })) as {
			processed: number;
			updated: number;
			remaining: number;
		};

		expect(result.processed).toBe(1);
		expect(result.updated).toBe(1);

		expect(mockDb.patch).toHaveBeenCalledTimes(1);
		const patchCall = mockDb.patch.mock.calls[0];
		const id = patchCall[0];
		const patches = patchCall[1];

		expect(id).toBe(legacyStudent._id);
		expect(patches.encryptedCPF).toBeDefined();
		expect(patches.cpfHash).toBeDefined();
	});
});
