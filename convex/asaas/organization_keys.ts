import { v } from "convex/values";
import { mutation, query, internalMutation, internalQuery, internalAction } from "../_generated/server";
import { api } from "../_generated/api";
import { requireAuth, hasPermission } from "../lib/auth";
import { PERMISSIONS } from "../lib/permissions";
import { encrypt, decrypt } from "../lib/encryption";
import type { Doc } from "../_generated/dataModel";

// ═══════════════════════════════════════════════════════════════════
// ORGANIZATION ASAAS API KEYS MANAGEMENT
// Multi-tenant: Cada organização pode ter múltiplas chaves
// LGPD-compliant: apiKey e webhookSecret são criptografados
// ═══════════════════════════════════════════════════════════════════

/**
 * Get active Asaas API key for current user's organization
 * Retorna a chave descriptografada para uso no frontend
 */
export const getActiveKey = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user?.organizationId) {
      throw new Error("Organization ID not found for user");
    }

    // Check permissions
    if (!await hasPermission(ctx, PERMISSIONS.STUDENTS_READ)) {
      throw new Error("Unauthorized: Insufficient permissions");
    }

    // Get active API key for this organization
    const activeKey = await ctx.db
      .query("organizationAsaasApiKeys")
      .withIndex("by_organization_active", (q) =>
        q.eq("organizationId", user.organizationId),
        q.eq("isActive", true)
      )
      .first();

    // Decrypt sensitive values for display
    let apiKey: string | null = null;
    let webhookSecret: string | null = null;

    if (activeKey?.apiKey && typeof activeKey.apiKey === "string") {
      try {
        apiKey = await decrypt(activeKey.apiKey);
      } catch (error) {
        console.error("Error decrypting API key:", error);
        apiKey = null;
      }
    }

    if (activeKey?.webhookSecret && typeof activeKey.webhookSecret === "string") {
      try {
        webhookSecret = await decrypt(activeKey.webhookSecret);
      } catch (error) {
        console.error("Error decrypting webhook secret:", error);
        webhookSecret = null;
      }
    }

    return {
      apiKey,
      baseUrl: activeKey?.baseUrl || null,
      environment: activeKey?.environment || null,
      webhookSecret,
      label: activeKey?.label || null,
      isActive: activeKey?.isActive ?? true,
    };
  },
});

/**
 * List all Asaas API keys for organization (admin only)
 * Retorna lista de chaves com API key mascarado por segurança
 */
export const listKeys = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user?.organizationId) {
      return [];
    }

    // Check admin permissions
    if (!await hasPermission(ctx, PERMISSIONS.ALL)) {
      throw new Error("Unauthorized: Admin permissions required");
    }

    // Get all API keys for this organization
    const keys = await ctx.db
      .query("organizationAsaasApiKeys")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .collect();

    // Mask sensitive values for display
    const maskedKeys = keys.map((key) => ({
      ...key,
      apiKey: key.apiKey ? "•••••••" : null,
      webhookSecret: key.webhookSecret ? "•••••••••" : null,
    }));

    return maskedKeys;
  },
});

/**
 * Create a new Asaas API key for organization (admin only)
 */
export const createKey = mutation({
  args: {
    label: v.string().min(1, "Label é obrigatório"),
    baseUrl: v.string().url("URL inválida"),
    apiKey: v.string().min(1, "API Key é obrigatória"),
    environment: v.union(v.literal("production"), v.literal("sandbox")),
    webhookSecret: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user?.organizationId) {
      throw new Error("Organization ID not found for user");
    }

    // Check admin permissions
    if (!await hasPermission(ctx, PERMISSIONS.ALL)) {
      throw new Error("Unauthorized: Admin permissions required");
    }

    // Encrypt sensitive values (LGPD compliance)
    const encryptedApiKey = await encrypt(args.apiKey);
    const encryptedWebhookSecret = args.webhookSecret ? await encrypt(args.webhookSecret) : null;

    const now = Date.now();

    // If setting isActive to true, deactivate all other keys for this organization
    if (args.isActive ?? true) {
      await ctx.db
        .query("organizationAsaasApiKeys")
        .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
        .collect()
        .then(async (keys) => {
          for (const key of keys) {
            await ctx.db.patch(key._id, { isActive: false, updatedAt: now });
          }
        });
    }

    // Create new key
    const keyId = await ctx.db.insert("organizationAsaasApiKeys", {
      organizationId: user.organizationId,
      apiKey: encryptedApiKey,
      baseUrl: args.baseUrl,
      environment: args.environment,
      webhookSecret: encryptedWebhookSecret,
      label: args.label,
      isActive: args.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, keyId };
  },
});

/**
 * Update an existing Asaas API key (admin only)
 */
export const updateKey = mutation({
  args: {
    keyId: v.id("organizationAsaasApiKeys"),
    label: v.optional(v.string()),
    baseUrl: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    environment: v.optional(v.union(v.literal("production"), v.literal("sandbox"))),
    webhookSecret: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user?.organizationId) {
      throw new Error("Organization ID not found for user");
    }

    // Check admin permissions
    if (!await hasPermission(ctx, PERMISSIONS.ALL)) {
      throw new Error("Unauthorized: Admin permissions required");
    }

    const key = await ctx.db.get(args.keyId);
    if (!key) {
      throw new Error("API key not found");
    }

    // Verify ownership
    if (key.organizationId !== user.organizationId) {
      throw new Error("Unauthorized: You can only update keys for your organization");
    }

    // Prepare update object
    const updates: Partial<Doc<"organizationAsaasApiKeys">> = { updatedAt: Date.now() };
    if (args.label !== undefined) updates.label = args.label;
    if (args.baseUrl !== undefined) updates.baseUrl = args.baseUrl;
    if (args.isActive !== undefined) updates.isActive = args.isActive;

    // Encrypt sensitive values if provided
    if (args.apiKey !== undefined) {
      updates.apiKey = await encrypt(args.apiKey);
    }
    if (args.webhookSecret !== undefined) {
      updates.webhookSecret = await encrypt(args.webhookSecret);
    }

    // If setting isActive to true, deactivate all other keys
    if (args.isActive === true) {
      const now = Date.now();
      await ctx.db
        .query("organizationAsaasApiKeys")
        .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
        .collect()
        .then(async (keys) => {
          for (const k of keys) {
            if (k._id !== args.keyId) {
              await ctx.db.patch(k._id, { isActive: false, updatedAt: now });
            }
          }
        });
    }

    await ctx.db.patch(args.keyId, updates);
    return { success: true };
  },
});

/**
 * Delete an Asaas API key (admin only)
 */
export const deleteKey = mutation({
  args: {
    keyId: v.id("organizationAsaasApiKeys"),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .first();

    if (!user?.organizationId) {
      throw new Error("Organization ID not found for user");
    }

    // Check admin permissions
    if (!await hasPermission(ctx, PERMISSIONS.ALL)) {
      throw new Error("Unauthorized: Admin permissions required");
    }

    const key = await ctx.db.get(args.keyId);
    if (!key) {
      throw new Error("API key not found");
    }

    // Verify ownership
    if (key.organizationId !== user.organizationId) {
      throw new Error("Unauthorized: You can only delete keys for your organization");
    }

    await ctx.db.delete(args.keyId);
    return { success: true };
  },
});

/**
 * Get active key for Asaas client (internal)
 * Retorna a chave descriptografada para uso interno
 */
export const getActiveKeyForClient = internalQuery({
  args: {},
  handler: async (ctx) => {
    // Get current organization from users table (first user found)
    const users = await ctx.db.query("users").collect();
    if (users.length === 0) {
      return null;
    }

    // Get organization ID from first user
    const organizationId = users[0].organizationId;
    if (!organizationId) {
      return null;
    }

    // Get active API key for this organization
    const activeKey = await ctx.db
      .query("organizationAsaasApiKeys")
      .withIndex("by_organization_active", (q) =>
        q.eq("organizationId", organizationId),
        q.eq("isActive", true)
      )
      .first();

    if (!activeKey) {
      return null;
    }

    // Decrypt sensitive values
    let apiKey: string | null = null;
    let webhookSecret: string | null = null;

    if (activeKey.apiKey && typeof activeKey.apiKey === "string") {
      try {
        apiKey = await decrypt(activeKey.apiKey);
      } catch (error) {
        console.error("Error decrypting API key:", error);
        apiKey = null;
      }
    }

    if (activeKey.webhookSecret && typeof activeKey.webhookSecret === "string") {
      try {
        webhookSecret = await decrypt(activeKey.webhookSecret);
      } catch (error) {
        console.error("Error decrypting webhook secret:", error);
        webhookSecret = null;
      }
    }

    return {
      apiKey: apiKey || undefined,
      baseUrl: activeKey.baseUrl,
      environment: activeKey.environment,
      webhookSecret: webhookSecret || undefined,
    };
  },
});
