import { v } from 'convex/values'
import { internalMutation, mutation, query } from './_generated/server'
// import { requireAuth } from './lib/auth'

/**
 * Get current user from Clerk auth
 */
export const current = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return null
    }
    const user = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', identity.subject))
      .unique()
    return user
  },
})

/**
 * List all users (for dropdowns, assignments, etc.)
 * SECURITY: Admin-only access - prevents unauthorized user enumeration
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    try {
      console.log('Starting users:list query (Inlined Auth)');

      const identity = await ctx.auth.getUserIdentity();
      console.log('Identity raw:', identity);

      if (!identity) {
        throw new Error('Não autenticado. Faça login para continuar.');
      }

      // Safe access subject
      const subject = identity.subject;
      if (!subject) {
        throw new Error('Identity missing subject claim.');
      }

      // Get current user to check role
      const currentUser = await ctx.db
        .query('users')
        .withIndex('by_clerk_id', (q) => q.eq('clerkId', subject))
        .first();

      console.log('Current user query result:', currentUser);

      // Allow if admin or if checking self (optional extension, but here strictly admin as per original)
      if (!currentUser || currentUser.role !== 'admin') {
        console.log('Permission denied logic triggered. Role:', currentUser?.role);
        throw new Error('Permissão negada. Apenas administradores podem listar usuários.');
      }

      console.log('Fetching all users');
      return await ctx.db.query('users').collect();
    } catch (error: any) {
      console.error('CRITICAL ERROR in users:list:', error);
      throw new Error(`Debug: ${error.message} \nStack: ${error.stack}`);
    }
  },
})

/**
 * List CS (Customer Success) users for dropdowns
 * SECURITY: Requires authentication but NOT admin role
 * Returns minimal data (LGPD compliance): only _id, name, email
 */
export const listCSUsers = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      throw new Error('Não autenticado. Faça login para continuar.')
    }

    // Filter for active CS users only
    const csUsers = await ctx.db
      .query('users')
      .filter((q) =>
        q.and(
          q.eq(q.field('role'), 'cs'),
          q.eq(q.field('isActive'), true)
        )
      )
      .collect()

    // Return minimal data for LGPD compliance
    return csUsers.map((user) => ({
      _id: user._id,
      name: user.name,
      email: user.email,
    }))
  },
})

/**
 * Create or update a user (sync from Clerk webhooks)
 *
 * SECURITY: This is an internalMutation - only callable from:
 * - Clerk webhooks (via internal action)
 * - Other internal Convex functions
 * - HTTP actions with proper authentication
 *
 * NOT callable from the frontend client.
 */
export const syncUser = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    name: v.string(),
    avatar: v.optional(v.string()),
    role: v.optional(v.union(
      v.literal('admin'),
      v.literal('sdr'),
      v.literal('cs'),
      v.literal('support')
    )),
    organizationId: v.optional(v.string()),
    organizationRole: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_clerk_id', (q) => q.eq('clerkId', args.clerkId))
      .unique()

    if (existingUser) {
      const patches: Record<string, unknown> = {
        email: args.email,
        name: args.name,
        updatedAt: Date.now(),
      }
      if (args.avatar) patches.avatar = args.avatar
      // Role and org updates from trusted source (webhook)
      if (args.role) patches.role = args.role
      if (args.organizationId !== undefined) patches.organizationId = args.organizationId
      if (args.organizationRole !== undefined) patches.organizationRole = args.organizationRole

      await ctx.db.patch(existingUser._id, patches)
      return existingUser._id
    }

    // New User - Default Role: SDR
    const newUserId = await ctx.db.insert('users', {
      clerkId: args.clerkId,
      email: args.email,
      name: args.name,
      avatar: args.avatar,
      role: args.role ?? 'sdr',
      isActive: true,
      organizationId: args.organizationId,
      organizationRole: args.organizationRole,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    })
    return newUserId
  },
})


/**
 * Update a user's role or details
 */
export const updateUser = mutation({
  args: {
    userId: v.id('users'),
    patch: v.object({
      name: v.optional(v.string()),
      email: v.optional(v.string()),
      role: v.optional(v.union(
        v.literal('admin'),
        v.literal('sdr'),
        v.literal('cs'),
        v.literal('support')
      )),
      isActive: v.optional(v.boolean()),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    await ctx.db.patch(args.userId, {
      ...args.patch,
      updatedAt: Date.now(),
    })
  },
})

export const deleteUser = mutation({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) throw new Error('Unauthenticated')

    // Soft delete by setting isActive to false
    await ctx.db.patch(args.userId, {
      isActive: false,
      updatedAt: Date.now(),
    })
  },
})
