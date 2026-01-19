import { v } from 'convex/values';

import { internalMutation, internalQuery } from '../_generated/server';

// Helper for tests to insert raw data
export const insertStudent = internalMutation({
	args: v.any(),
	handler: async (ctx, args) => {
		return await ctx.db.insert('students', args);
	},
});

export const getStudent = internalQuery({
	args: { id: v.id('students') },
	handler: async (ctx, args) => {
		return await ctx.db.get(args.id);
	},
});

export const getAllStudents = internalQuery({
	args: {},
	handler: async (ctx) => {
		return await ctx.db.query('students').collect();
	},
});
