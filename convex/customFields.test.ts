import type { Id } from './_generated/dataModel';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock _generated/server BEFORE importing customFields
vi.mock('./_generated/server', () => ({
	mutation: <T>(args: T) => args,
	query: <T>(args: T) => args,
	internalMutation: <T>(args: T) => args,
}));

import { createCustomField, listCustomFields, setCustomFieldValue } from './customFields';
import { getOrganizationId, requireAuth, requirePermission } from './lib/auth';

// Mock lib/auth
vi.mock('./lib/auth', () => ({
	getOrganizationId: vi.fn(),
	requireAuth: vi.fn(),
	requirePermission: vi.fn(),
}));

describe('Custom Fields System', () => {
	const mockDb = {
		query: vi.fn(),
		get: vi.fn(),
		insert: vi.fn(),
		patch: vi.fn(),
	};

	const mockCtx: { db: typeof mockDb; auth: { getUserIdentity: () => unknown } } = {
		db: mockDb,
		auth: { getUserIdentity: vi.fn() },
	};

	const mockIdentity = {
		subject: 'user_123',
		org_id: 'org_123',
		tokenIdentifier: 'test|user_123',
		issuer: 'https://test.clerk.dev',
	};

	beforeEach(() => {
		vi.clearAllMocks();
		vi.mocked(getOrganizationId).mockResolvedValue('org_123');
		vi.mocked(requireAuth).mockResolvedValue(mockIdentity);
		vi.mocked(requirePermission).mockResolvedValue(mockIdentity);
	});

	describe('createCustomField', () => {
		it('should create a custom field successfully', async () => {
			const args = {
				name: 'Favorite Color',
				fieldType: 'text' as const,
				entityType: 'lead' as const,
				required: false,
			};

			// Mock query for duplicate check
			const mockQueryBuilder = {
				withIndex: vi.fn().mockReturnThis(),
				filter: vi.fn().mockReturnThis(),
				first: vi.fn().mockResolvedValue(null),
			};
			mockDb.query.mockReturnValue(mockQueryBuilder);
			mockDb.insert.mockResolvedValue('field_123');

			// @ts-expect-error
			const result = await createCustomField.handler(mockCtx, args);

			expect(requirePermission).toHaveBeenCalled();
			expect(mockDb.insert).toHaveBeenCalledWith(
				'customFields',
				expect.objectContaining({
					name: 'Favorite Color',
					fieldType: 'text',
					entityType: 'lead',
					organizationId: 'org_123',
					active: true,
				}),
			);
			expect(mockDb.insert).toHaveBeenCalledWith(
				'activities',
				expect.objectContaining({
					type: 'nota_adicionada',
					description: "Custom field 'Favorite Color' created for lead",
				}),
			);
			expect(result).toBe('field_123');
		});

		it('should throw error for duplicate field name', async () => {
			const args = {
				name: 'Existing Field',
				fieldType: 'text' as const,
				entityType: 'lead' as const,
				required: false,
			};

			const mockQueryBuilder = {
				withIndex: vi.fn().mockReturnThis(),
				filter: vi.fn().mockReturnThis(),
				first: vi.fn().mockResolvedValue({
					// biome-ignore lint/style/useNamingConvention: Convex document ids use _id
					_id: 'existing_id',
					active: true,
				}),
			};
			mockDb.query.mockReturnValue(mockQueryBuilder);

			// @ts-expect-error
			await expect(createCustomField.handler(mockCtx, args)).rejects.toThrow(
				"Field 'Existing Field' already exists",
			);
		});
	});

	describe('setCustomFieldValue', () => {
		it('should set a valid value successfully', async () => {
			const args = {
				customFieldId: 'field_123' as Id<'customFields'>,
				entityId: 'lead_123',
				entityType: 'lead' as const,
				value: 'Blue',
			};

			// Mock field definition
			mockDb.get.mockImplementation((id: string) => {
				if (id === 'field_123')
					return {
						// biome-ignore lint/style/useNamingConvention: Convex document ids use _id
						_id: 'field_123',
						name: 'Favorite Color',
						fieldType: 'text',
						entityType: 'lead',
						organizationId: 'org_123',
						active: true,
						required: false,
					};
				if (id === 'lead_123')
					return {
						// biome-ignore lint/style/useNamingConvention: Convex document ids use _id
						_id: 'lead_123',
						organizationId: 'org_123',
					};
				return null;
			});

			// Mock existing value check (not found -> insert)
			const mockQueryBuilder = {
				withIndex: vi.fn().mockReturnThis(),
				filter: vi.fn().mockReturnThis(),
				first: vi.fn().mockResolvedValue(null),
			};
			mockDb.query.mockReturnValue(mockQueryBuilder);

			mockDb.insert.mockResolvedValue('value_123');

			// @ts-expect-error
			await setCustomFieldValue.handler(mockCtx, args);

			expect(mockDb.insert).toHaveBeenCalledWith(
				'customFieldValues',
				expect.objectContaining({
					customFieldId: 'field_123',
					entityId: 'lead_123',
					value: 'Blue',
				}),
			);
		});
	});

	describe('listCustomFields', () => {
		it('should list fields for organization and entity type', async () => {
			const mockFields = [
				{
					// biome-ignore lint/style/useNamingConvention: Convex document ids use _id
					_id: 'f1',
					name: 'Field 1',
					createdAt: 100,
					active: true,
				},
				{
					// biome-ignore lint/style/useNamingConvention: Convex document ids use _id
					_id: 'f2',
					name: 'Field 2',
					createdAt: 200,
					active: false,
				},
			];

			const mockQueryBuilder = {
				withIndex: vi.fn().mockReturnThis(),
				collect: vi.fn().mockResolvedValue(mockFields),
			};
			mockDb.query.mockReturnValue(mockQueryBuilder);

			// @ts-expect-error
			const result = await listCustomFields.handler(mockCtx, { entityType: 'lead' });

			expect(result).toHaveLength(1); // Default excludes inactive
			expect(result[0]._id).toBe('f1');
		});
	});
});
