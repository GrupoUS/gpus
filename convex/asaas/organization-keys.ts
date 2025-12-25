import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { requireAuth, hasPermission } from "../lib/auth";
import { PERMISSIONS } from "../lib/permissions";
import { encrypt, decrypt } from "../lib/encryption";
import { api } from "../_generated/api";

// ═════════════════════════════════════
// ORGANIZAÇÃO ASAAS - API Keys por Organização
// ═══════════════════════════════════════════════

/**
 * Get active Asaas API key for current organization
 */
export const getActiveOrganizationAsaasKey = query({
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

    // Check user permissions
    if (!await hasPermission(ctx, PERMISSIONS.STUDENTS_WRITE)) {
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

    // Decrypt sensitive values
    let apiKey: string | null = null;
    let webhookSecret: string | null = null;

    if (activeKey?.apiKey && typeof activeKey.apiKey === 'string') {
      try {
        apiKey = await decrypt(activeKey.apiKey);
      } catch (error) {
        console.error("Error decrypting API key:", error);
        apiKey = null;
      }
    }

    if (activeKey?.webhookSecret && typeof activeKey.webhookSecret === 'string') {
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
    };
  },
});

/**
 * List all Asaas API keys for organization (admin only)
 */
export const listOrganizationAsaasKeys = query({
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

    // Decrypt keys for display
    const decryptedKeys = await Promise.all(
      keys.map(async (key) => {
        let apiKey: string | null = null;
        let webhookSecret: string | null = null;

        try {
          if (key.apiKey && typeof key.apiKey === 'string') {
            apiKey = await decrypt(key.apiKey);
          }
          if (key.webhookSecret && typeof key.webhookSecret === 'string') {
            webhookSecret = await decrypt(key.webhookSecret);
          }
        } catch (error) {
          console.error("Error decrypting key:", error);
        }

        return {
          ...key,
          apiKey: apiKey ? "••••••••" : null, // Masked
          webhookSecret: webhookSecret ? "•••••••" : null, // Masked
        };
      })
    );

    return decryptedKeys;
  },
});

/**
 * Create a new Asaas API key for organization (admin only)
 */
export const createOrganizationAsaasKey = mutation({
  args: {
    label: v.string().min(1, "Label é obrigatório"),
    baseUrl: v.string().url("URL inválida"),
    apiKey: v.string().min(1, "API Key é obrigatória"),
    environment: v.union(v.literal('production'), v.literal('sandbox')),
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

    // Encrypt sensitive values
    const encryptedApiKey = await encrypt(args.apiKey);
    const encryptedWebhookSecret = args.webhookSecret ? await encrypt(args.webhookSecret) : null;

    // Deactivate all existing keys for this organization
    await ctx.db
      .query("organizationAsaasApiKeys")
      .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
      .collect()
      .then(async (keys) => {
        for (const key of keys) {
          await ctx.db.patch(key._id, { isActive: false });
        }
      });

    // Create new key (isActive defaults to true)
    const now = Date.now();
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
 * Update an Asaas API key (admin only)
 */
export const updateOrganizationAsaasKey = mutation({
  args: {
    keyId: v.id("organizationAsaasApiKeys"),
    label: v.optional(v.string()),
    baseUrl: v.optional(v.string()),
    apiKey: v.optional(v.string()),
    environment: v.optional(v.union(v.literal('production'), v.literal('sandbox'))),
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
    const updates: any = { updatedAt: Date.now() };
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
      await ctx.db
        .query("organizationAsaasApiKeys")
        .withIndex("by_organization", (q) => q.eq("organizationId", user.organizationId))
        .collect()
        .then(async (keys) => {
          for (const k of keys) {
            if (k._id !== args.keyId) {
              await ctx.db.patch(k._id, { isActive: false });
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
export const deleteOrganizationAsaasKey = mutation({
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
