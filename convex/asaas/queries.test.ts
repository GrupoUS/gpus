
import { describe, test, expect, vi } from "vitest";

// Mock dependencies BEFORE imports
vi.mock("../lib/auth", () => ({
  requireAuth: vi.fn(),
  getOrganizationId: vi.fn().mockResolvedValue("org_123"),
}));

// We need to mock how convex-test or the runtime registers queries
// Since we are unit testing the logic inside handler, let's just expose handler
vi.mock("../_generated/server", () => ({
  query: (args: any) => ({ ...args, isMock: true }),
  internalQuery: (args: any) => ({ ...args, isMock: true }),
}));

import { getPendingPayments, getFinancialSummary, getAllPayments } from "./queries";

// Helper to access the handler whether it's mocked or the real internal property
const getHandler = (queryObj: any) => {
  return queryObj.handler || queryObj._handler;
};

describe("Asaas Queries Multi-tenant Security", () => {
  test("DEBUG: Verify structure", () => {
    // console.log("getPendingPayments keys:", Object.keys(getPendingPayments));
  });

  test("getPendingPayments filters by organizationId", async () => {
    const mockCollect = vi.fn().mockResolvedValue([]);
    const mockOrder = vi.fn().mockReturnValue({ collect: mockCollect });
    const mockWithIndex = vi.fn().mockImplementation((indexName, qFn) => {
        // Execute the query function to ensure it uses the correct filters
        const q = {
            eq: vi.fn().mockReturnThis(),
        };
        qFn(q);
        // Verify organizationId filter was applied
        expect(q.eq).toHaveBeenCalledWith("organizationId", "org_123");
        return { order: mockOrder };
    });
    const mockQuery = vi.fn().mockReturnValue({ withIndex: mockWithIndex });
    
    const ctx = {
      db: { query: mockQuery },
    } as any;

    const handler = getHandler(getPendingPayments);
    if (!handler) throw new Error("Could not find handler on query object");
    await handler(ctx, {});

    expect(mockQuery).toHaveBeenCalledWith("asaasPayments");
    expect(mockWithIndex).toHaveBeenCalledWith("by_organization_status", expect.any(Function));
  });

  test("getFinancialSummary filters by organizationId", async () => {
    const mockCollect = vi.fn().mockResolvedValue([]);
    const mockWithIndex = vi.fn().mockImplementation((indexName, qFn) => {
        const q = {
            eq: vi.fn().mockReturnThis(),
        };
        qFn(q);
        expect(q.eq).toHaveBeenCalledWith("organizationId", "org_123");
        return { collect: mockCollect };
    });
    const mockQuery = vi.fn().mockReturnValue({ withIndex: mockWithIndex });
    
    const ctx = {
      db: { query: mockQuery },
    } as any;

    const handler = getHandler(getFinancialSummary);
    await handler(ctx, {});

    expect(mockQuery).toHaveBeenCalledWith("asaasPayments");
    // It queries multiple times, verify at least one organization index usage
    expect(mockWithIndex).toHaveBeenCalledWith("by_organization", expect.any(Function));
  });

  test("getAllPayments filters by organizationId", async () => {
    const mockCollect = vi.fn().mockResolvedValue([]);
    const mockOrder = vi.fn().mockReturnValue({ collect: mockCollect });
    const mockWithIndex = vi.fn().mockImplementation((indexName, qFn) => {
        const q = {
            eq: vi.fn().mockReturnThis(),
            gte: vi.fn().mockReturnThis(),
            lte: vi.fn().mockReturnThis(),
        };
        qFn(q);
        expect(q.eq).toHaveBeenCalledWith("organizationId", "org_123");
        return { order: mockOrder };
    });
    const mockQuery = vi.fn().mockReturnValue({ withIndex: mockWithIndex });
    
    const ctx = {
      db: { query: mockQuery },
    } as any;

    const handler = getHandler(getAllPayments);
    await handler(ctx, {});

    expect(mockQuery).toHaveBeenCalledWith("asaasPayments");
    expect(mockWithIndex).toHaveBeenCalledWith("by_organization", expect.any(Function));
  });
});
