import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as authLib from './lib/auth';

// Define mocks
vi.mock('./lib/auth', () => ({
	requireOrgRole: vi.fn(),
	getOrganizationId: vi.fn(),
}));

vi.mock('./_generated/server', () => ({
	mutation: (args: any) => ({ ...args, isMock: true, handler: args.handler }),
	internalMutation: (args: any) => ({ ...args, isMock: true, handler: args.handler }),
}));

// Import module under test
import { adoptOrphanedStudents, adoptOrphanedStudentsManual } from './scripts';

describe('Admin Scripts Security', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	describe('adoptOrphanedStudents', () => {
		it('should be a mock mutation', () => {
			expect((adoptOrphanedStudents as any).isMock).toBe(true);
			expect((adoptOrphanedStudents as any).handler).toBeDefined();
		});

		it('should require authentication', async () => {
			const handler = (adoptOrphanedStudents as any).handler;
			const mockCtx = {
				auth: { getUserIdentity: vi.fn().mockResolvedValue(null) },
			} as any;

			// Mock requireOrgRole to throw
			(authLib.requireOrgRole as any).mockRejectedValueOnce(new Error('Unauthorized'));

			await expect(handler(mockCtx, {})).rejects.toThrow();
		});

		it('should require organizationId', async () => {
			const handler = (adoptOrphanedStudents as any).handler;
			const mockCtx = {
				auth: { getUserIdentity: vi.fn().mockResolvedValue({ subject: 'user1' }) },
			} as any;

			// Mock requireOrgRole success
			(authLib.requireOrgRole as any).mockResolvedValueOnce(undefined);

			// Mock getOrganizationId return undefined
			(authLib.getOrganizationId as any).mockResolvedValueOnce(undefined);

			await expect(handler(mockCtx, {})).rejects.toThrow(/Organization ID not found/);
		});
	});

	describe('adoptOrphanedStudentsManual', () => {
		it('should call requireOrgRole with admin roles', async () => {
			const handler = (adoptOrphanedStudentsManual as any).handler;
			const mockCtx = {
				auth: { getUserIdentity: vi.fn().mockResolvedValue({ subject: 'user1' }) },
				db: { query: vi.fn() },
			} as any;

			// Mock requireOrgRole success
			(authLib.requireOrgRole as any).mockResolvedValueOnce(undefined);

			const mockQuery = {
				filter: vi.fn().mockReturnThis(),
				take: vi.fn().mockResolvedValue([]),
			};
			mockCtx.db.query = vi.fn().mockReturnValue(mockQuery);

			await handler(mockCtx, { organizationId: 'org_123' });

			expect(authLib.requireOrgRole).toHaveBeenCalledWith(mockCtx, ['org:admin', 'admin']);
		});

		it('should throw if requireOrgRole throws', async () => {
			const handler = (adoptOrphanedStudentsManual as any).handler;
			const mockCtx = {} as any;
			(authLib.requireOrgRole as any).mockRejectedValueOnce(new Error('Permissão negada'));

			await expect(handler(mockCtx, { organizationId: 'org_123' })).rejects.toThrow(
				'Permissão negada',
			);
		});
	});
});
