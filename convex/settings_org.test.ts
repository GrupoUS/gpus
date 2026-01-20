import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock _generated/server
vi.mock('./_generated/server', () => ({
	mutation: (args: any) => args,
	query: (args: any) => args,
	internalQuery: (args: any) => args,
}));

// Mock dependencies BEFORE importing settings
vi.mock('./lib/auth', () => ({
	getOrganizationId: vi.fn(),
	requireAuth: vi.fn(),
	hasPermission: vi.fn(),
}));

vi.mock('./lib/encryption', () => ({
	encrypt: vi.fn(async (val) => `encrypted_${val}`),
	decrypt: vi.fn(async (val) => val.replace('encrypted_', '')),
	isEncrypted: vi.fn((val) => val.startsWith('encrypted_')),
}));

import { getOrganizationId, hasPermission, requireAuth } from './lib/auth';
import {
	getCashbackSettings,
	getOrganizationSettings,
	updateOrganizationSettings,
} from './settings';

describe('Organization Settings', () => {
	const mockDb = {
		query: vi.fn(),
		insert: vi.fn(),
		patch: vi.fn(),
	};

	const mockCtx = {
		db: mockDb,
		auth: { getUserIdentity: vi.fn() },
	} as any;

	const mockIdentity = {
		subject: 'user_123',
		org_id: 'org_123',
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getOrganizationId).mockResolvedValue('org_123');
		vi.mocked(requireAuth).mockResolvedValue(mockIdentity);
		// Default permission denied unless specified
		vi.mocked(hasPermission).mockResolvedValue(false);
	});

	describe('getOrganizationSettings', () => {
		it('should throw if not admin', async () => {
			vi.mocked(hasPermission).mockResolvedValue(false);
			// biome-ignore lint/suspicious/noExplicitAny: Test mock access
			const handler = (getOrganizationSettings as any).handler;
			await expect(handler(mockCtx, { organizationId: 'org_123' })).rejects.toThrow('Unauthorized');
		});

		it('should return settings for valid admin', async () => {
			vi.mocked(hasPermission).mockResolvedValue(true);

			const mockSettings = [
				{ key: 'org_org_123_testKey', value: 'testValue' },
				{ key: 'org_org_123_secretKey', value: 'encrypted_secret' }, // sensitive key, stripped is 'secretKey' which ends with 'Key' but check casing
				// update: isSensitiveKey uses cleanKey.endsWith('_key'). 'secretKey' doesn't end with '_key'.
				// 'secret_key' does.
				{ key: 'org_org_123_api_key', value: 'encrypted_secret_api' },
				{ key: 'other_global_setting', value: 'ignore' },
			];

			const mockQueryBuilder = {
				withIndex: vi.fn().mockReturnThis(), // handle withIndex
				collect: vi.fn().mockResolvedValue(mockSettings),
			};
			mockDb.query.mockReturnValue(mockQueryBuilder);

			// biome-ignore lint/suspicious/noExplicitAny: Test mock access
			const handler = (getOrganizationSettings as any).handler;
			const result = await handler(mockCtx, { organizationId: 'org_123' });

			expect(result).toEqual({
				testKey: 'testValue',
				secretKey: 'encrypted_secret',
				api_key: 'secret_api', // decrypted
			});
			// 'secretKey' skipped because logic? No, loop:
			// if (setting.key.startsWith(prefix)) -> 'org_org_123_secretKey' starts with prefix.
			// key = 'secretKey'.
			// isSensitiveKey('secretKey')?
			// implementation: endsWith('_key'), endsWith('_secret'). 'secretKey' ends with neither. SENSITIVE_KEYS? No.
			// So 'secretKey' returned as is.
			// Wait, my mock values: 'encrypted_secret'. If NOT sensitive, decrypt is NOT called.
			// So result should be 'encrypted_secret'.

			// Correction: 'api_key' ends with '_key', so it is sensitive, so decrypted.
		});
	});

	describe('getCashbackSettings', () => {
		it('should return null if no settings', async () => {
			const mockQueryBuilder = {
				withIndex: vi.fn().mockReturnThis(),
				unique: vi.fn().mockResolvedValue(null),
			};
			mockDb.query.mockReturnValue(mockQueryBuilder);

			// biome-ignore lint/suspicious/noExplicitAny: Test mock access
			const handler = (getCashbackSettings as any).handler;
			const result = await handler(mockCtx, { organizationId: 'org_123' });
			expect(result).toBeNull();
		});

		it('should return settings if exist', async () => {
			// Mock sequence of queries: amount, then type
			const amountMock = { value: 10 };
			const typeMock = { value: 'percentage' };

			const mockQueryBuilder = {
				withIndex: vi.fn().mockReturnThis(),
				unique: vi.fn().mockResolvedValueOnce(amountMock).mockResolvedValueOnce(typeMock),
			};
			mockDb.query.mockReturnValue(mockQueryBuilder);

			// biome-ignore lint/suspicious/noExplicitAny: Test mock access
			const handler = (getCashbackSettings as any).handler;
			const result = await handler(mockCtx, { organizationId: 'org_123' });
			expect(result).toEqual({
				cashbackAmount: 10,
				cashbackType: 'percentage',
			});
		});

		it('should throw if org mismatch and not admin', async () => {
			vi.mocked(getOrganizationId).mockResolvedValue('org_other');
			vi.mocked(hasPermission).mockResolvedValue(false);

			// biome-ignore lint/suspicious/noExplicitAny: Test mock access
			const handler = (getCashbackSettings as any).handler;
			await expect(handler(mockCtx, { organizationId: 'org_123' })).rejects.toThrow('Unauthorized');
		});

		it('should allow if org mismatch but IS admin', async () => {
			vi.mocked(getOrganizationId).mockResolvedValue('org_other');
			vi.mocked(hasPermission).mockResolvedValue(true);

			const mockQueryBuilder = {
				withIndex: vi.fn().mockReturnThis(),
				unique: vi.fn().mockResolvedValue({ value: 'dummy' }), // simplified
			};
			mockDb.query.mockReturnValue(mockQueryBuilder);

			// biome-ignore lint/suspicious/noExplicitAny: Test mock access
			const handler = (getCashbackSettings as any).handler;
			await handler(mockCtx, { organizationId: 'org_123' });
			// Should not throw
		});
	});

	describe('updateOrganizationSettings', () => {
		it('should validate inputs', async () => {
			vi.mocked(hasPermission).mockResolvedValue(true);
			// Invalid cashback
			const args = {
				organizationId: 'org_123',
				settings: { cashbackAmount: 150, cashbackType: 'percentage' },
			};
			// biome-ignore lint/suspicious/noExplicitAny: Test mock access
			const handler = (updateOrganizationSettings as any).handler;
			await expect(handler(mockCtx, args)).rejects.toThrow(
				'Porcentagem de cashback deve estar entre 0 e 100.',
			);
		});

		it('should update settings and log activity', async () => {
			vi.mocked(hasPermission).mockResolvedValue(true);
			const args = {
				organizationId: 'org_123',
				settings: {
					cashbackAmount: 10,
					cashbackType: 'percentage',
					some_api_key: 'secret_123',
				},
			};

			// Mock existing check to return null (insert)
			const mockQueryBuilder = {
				withIndex: vi.fn().mockReturnThis(), // by_key
				unique: vi.fn().mockResolvedValue(null),
			};
			mockDb.query.mockReturnValue(mockQueryBuilder);

			// biome-ignore lint/suspicious/noExplicitAny: Test mock access
			const handler = (updateOrganizationSettings as any).handler;
			await handler(mockCtx, args);

			// Verify inserts
			// API key should be encrypted
			expect(mockDb.insert).toHaveBeenCalledWith(
				'settings',
				expect.objectContaining({
					key: 'org_org_123_some_api_key',
					value: 'encrypted_secret_123',
				}),
			);

			// Activity log
			expect(mockDb.insert).toHaveBeenCalledWith(
				'activities',
				expect.objectContaining({
					type: 'integracao_configurada',
					organizationId: 'org_123',
					metadata: expect.objectContaining({
						changedSettings: expect.arrayContaining(['cashbackAmount', 'some_api_key']),
					}),
				}),
			);
		});
	});
});
