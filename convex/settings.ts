import { v } from "convex/values";
import { mutation, query, internalQuery } from "./_generated/server";
import { requireAuth, hasOrgRole } from "./lib/auth";
import { encrypt, decrypt, isEncrypted } from "./lib/encryption";

// Keys that should always be encrypted
const SENSITIVE_KEYS = [
  "integration_asaas_api_key",
  "integration_asaas_webhook_secret",
  "integration_evolution_key",
  "integration_dify_key",
];

function isSensitiveKey(key: string): boolean {
  return SENSITIVE_KEYS.includes(key) || key.endsWith("_key") || key.endsWith("_secret") || key.endsWith("_token");
}

// List all settings (Admin only)
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requireAuth(ctx);

    // Only admins can see all settings
    if (!await hasOrgRole(ctx, ["admin"])) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.query("settings").collect();
  },
});

// Get a specific setting by key
export const get = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);
    const isAdmin = await hasOrgRole(ctx, ["admin"]);

    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (!setting) return null;

    // If sensitive, decrypt only if admin
    if (isSensitiveKey(args.key)) {
      if (!isAdmin) return null; // Mask for non-admins
      if (typeof setting.value === 'string' && isEncrypted(setting.value)) {
        return await decrypt(setting.value);
      }
    }

    return setting.value;
  },
});

// Set a setting (Admin only)
export const set = mutation({
  args: {
    key: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    if (!await hasOrgRole(ctx, ["admin"])) {
      throw new Error("Unauthorized");
    }

    let valueToStore = args.value;

    // Encrypt sensitive keys
    if (isSensitiveKey(args.key) && typeof args.value === 'string') {
      valueToStore = await encrypt(args.value);
    }

    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: valueToStore,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("settings", {
        key: args.key,
        value: valueToStore,
        updatedAt: Date.now(),
      });
    }
  },
});

// Helper to get integration config (internal use via runQuery or protected query)
export const getIntegrationConfig = query({
  args: { integrationName: v.string() }, // e.g., "asaas", "evolution", "dify"
  handler: async (ctx, args) => {
    // Protected query, restricted to admin
    await requireAuth(ctx);
    if (!await hasOrgRole(ctx, ["admin"])) {
      return {
        baseUrl: null,
        apiKey: null,
        webhookSecret: null,
      };
    }

    const baseUrlSetting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", `integration_${args.integrationName}_base_url`))
      .unique();

    const apiKeySetting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", `integration_${args.integrationName}_api_key`))
      .unique();

    const webhookSecretSetting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", `integration_${args.integrationName}_webhook_secret`))
      .unique();

    // Decrypt sensitive values
    let decryptedApiKey: string | null = null;
    let decryptedWebhookSecret: string | null = null;

    if (apiKeySetting?.value && typeof apiKeySetting.value === 'string') {
      try {
        decryptedApiKey = await decrypt(apiKeySetting.value);
      } catch {
        // If decryption fails, might be plain text (migration)
        decryptedApiKey = apiKeySetting.value;
      }
    }

    if (webhookSecretSetting?.value && typeof webhookSecretSetting.value === 'string') {
      try {
        decryptedWebhookSecret = await decrypt(webhookSecretSetting.value);
      } catch {
        decryptedWebhookSecret = webhookSecretSetting.value;
      }
    }

    return {
      baseUrl: baseUrlSetting?.value ?? null,
      apiKey: decryptedApiKey,
      webhookSecret: decryptedWebhookSecret,
    };
  }
});

// Internal helper for system actions (bypassing admin check)
export const internalGetIntegrationConfig = internalQuery({
  args: { integrationName: v.string() },
  handler: async (ctx, args) => {
    const prefix = `integration_${args.integrationName}_`;
    const settings = await ctx.db.query("settings").collect();

    const config: Record<string, any> = {};

    for (const setting of settings) {
      if (setting.key.startsWith(prefix)) {
        const key = setting.key.replace(prefix, "");
        let value = setting.value;

        if (isSensitiveKey(setting.key) && typeof value === 'string' && isEncrypted(value)) {
           value = await decrypt(value);
        }

        config[key] = value;
      }
    }

    return config;
  }
});

// Get user-specific setting (e.g., notifications, appearance)
export const getUserSetting = query({
  args: { settingType: v.string() },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) return null;

    const key = `user_${args.settingType}_${user._id}`;
    const setting = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();

    return setting?.value ?? null;
  },
});

// Set user-specific setting
export const setUserSetting = mutation({
  args: {
    settingType: v.string(),
    value: v.any(),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx);

    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique();

    if (!user) throw new Error("User not found");

    const key = `user_${args.settingType}_${user._id}`;

    const existing = await ctx.db
      .query("settings")
      .withIndex("by_key", (q) => q.eq("key", key))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        value: args.value,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.insert("settings", {
        key,
        value: args.value,
        updatedAt: Date.now(),
      });
    }
  },
});

// Alias for compatibility
export const getSetting = get;
export const setSetting = set;
export const getAllSettings = list;
