import { v } from 'convex/values';

import type { Doc, Id } from './_generated/dataModel';
import { internalMutation, type MutationCtx, mutation, query } from './_generated/server';
import { getOrganizationId, requireAuth, requireOrgRole } from './lib/auth';

// -------------------------------------------------------------------------
// Types
// -------------------------------------------------------------------------

type CustomFieldValueWithDefinition = Doc<'customFieldValues'> & {
	fieldDefinition: Doc<'customFields'>;
};

interface CustomFieldValueInput {
	customFieldId: Id<'customFields'>;
	entityId: string;
	entityType: 'lead' | 'student';
	value: unknown;
	userId: string;
	organizationId: string;
}

// -------------------------------------------------------------------------
// Queries
// -------------------------------------------------------------------------

export const listCustomFields = query({
	args: {
		entityType: v.union(v.literal('lead'), v.literal('student')),
	},
	handler: async (ctx, args) => {
		const organizationId = await getOrganizationId(ctx);

		const fields = await ctx.db
			.query('customFields')
			.withIndex('by_organization_entity', (q) =>
				q.eq('organizationId', organizationId).eq('entityType', args.entityType),
			)
			.filter((q) => q.eq(q.field('active'), true))
			.collect();

		return fields;
	},
});

export const getCustomFieldValues = query({
	args: {
		entityId: v.string(),
		entityType: v.union(v.literal('lead'), v.literal('student')),
	},
	handler: async (ctx, args) => {
		const organizationId = await getOrganizationId(ctx);

		const values = await ctx.db
			.query('customFieldValues')
			.withIndex('by_entity', (q) =>
				q.eq('entityId', args.entityId).eq('entityType', args.entityType),
			)
			.filter((q) => q.eq(q.field('organizationId'), organizationId))
			.collect();

		if (values.length === 0) return [];

		const valuesWithDefinitions = await Promise.all(
			values.map(async (val) => {
				const fieldDef = await ctx.db.get(val.customFieldId);
				if (!fieldDef) return null;

				return {
					...val,
					fieldDefinition: fieldDef,
				};
			}),
		);

		return valuesWithDefinitions.filter(
			(item): item is CustomFieldValueWithDefinition => item !== null,
		);
	},
});

// -------------------------------------------------------------------------
// Mutations
// -------------------------------------------------------------------------

export const createCustomField = mutation({
	args: {
		name: v.string(),
		fieldType: v.union(
			v.literal('text'),
			v.literal('number'),
			v.literal('date'),
			v.literal('select'),
			v.literal('multiselect'),
			v.literal('boolean'),
		),
		entityType: v.union(v.literal('lead'), v.literal('student')),
		required: v.boolean(),
		options: v.optional(v.array(v.string())),
	},
	handler: async (ctx, args) => {
		// Require admin role
		await requireOrgRole(ctx, ['org:admin', 'org:owner', 'admin', 'owner']);
		const identity = await requireAuth(ctx);
		const organizationId = await getOrganizationId(ctx);

		// Count existing fields for ordering
		const existingFields = await ctx.db
			.query('customFields')
			.withIndex('by_organization_entity', (q) =>
				q.eq('organizationId', organizationId).eq('entityType', args.entityType),
			)
			.collect();

		const displayOrder = existingFields.length;

		const id = await ctx.db.insert('customFields', {
			organizationId,
			name: args.name,
			fieldType: args.fieldType,
			entityType: args.entityType,
			required: args.required,
			options: args.options,
			displayOrder,
			active: true,
			createdBy: identity.subject,
			createdAt: Date.now(),
			updatedAt: Date.now(),
		});

		return id;
	},
});

export const updateCustomField = mutation({
	args: {
		id: v.id('customFields'),
		name: v.optional(v.string()),
		required: v.optional(v.boolean()),
		options: v.optional(v.array(v.string())),
		displayOrder: v.optional(v.number()),
		active: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		await requireOrgRole(ctx, ['org:admin', 'org:owner', 'admin', 'owner']);
		const organizationId = await getOrganizationId(ctx);

		const field = await ctx.db.get(args.id);
		if (!field || field.organizationId !== organizationId) {
			throw new Error('Field not found');
		}

		const { id, ...updates } = args;
		await ctx.db.patch(id, {
			...updates,
			updatedAt: Date.now(),
		});
	},
});

export const deleteCustomField = mutation({
	args: {
		id: v.id('customFields'),
	},
	handler: async (ctx, args) => {
		await requireOrgRole(ctx, ['org:admin', 'org:owner', 'admin', 'owner']);
		const organizationId = await getOrganizationId(ctx);

		const field = await ctx.db.get(args.id);
		if (!field || field.organizationId !== organizationId) {
			throw new Error('Field not found');
		}

		// Soft delete by setting active to false
		await ctx.db.patch(args.id, {
			active: false,
			updatedAt: Date.now(),
		});
	},
});

// -------------------------------------------------------------------------
// Custom Field Value Handling
// -------------------------------------------------------------------------

export async function setCustomFieldValueInternal(ctx: MutationCtx, args: CustomFieldValueInput) {
	const field = await ctx.db.get(args.customFieldId);
	if (!field || field.organizationId !== args.organizationId) {
		throw new Error('Field not found');
	}

	validateValue(field, args.value);

	const existingValue = await ctx.db
		.query('customFieldValues')
		.withIndex('by_entity', (q) =>
			q.eq('entityId', args.entityId).eq('entityType', args.entityType),
		)
		.filter((q) => q.eq(q.field('customFieldId'), args.customFieldId))
		.first();

	if (existingValue) {
		await ctx.db.patch(existingValue._id, {
			value: args.value,
			updatedBy: args.userId,
			updatedAt: Date.now(),
		});
	} else {
		await ctx.db.insert('customFieldValues', {
			customFieldId: args.customFieldId,
			entityId: args.entityId,
			entityType: args.entityType,
			value: args.value,
			organizationId: args.organizationId,
			updatedBy: args.userId,
			updatedAt: Date.now(),
		});
	}
}

export const setCustomFieldValue = mutation({
	args: {
		customFieldId: v.id('customFields'),
		entityId: v.string(),
		entityType: v.union(v.literal('lead'), v.literal('student')),
		value: v.any(),
	},
	handler: async (ctx, args) => {
		const identity = await requireAuth(ctx);
		const organizationId = await getOrganizationId(ctx);
		await setCustomFieldValueInternal(ctx, {
			...args,
			userId: identity.subject,
			organizationId,
		});
	},
});

// -------------------------------------------------------------------------
// Internal Validation
// -------------------------------------------------------------------------

export const validateCustomFieldValue = internalMutation({
	args: {
		fieldId: v.id('customFields'),
		value: v.any(),
	},
	handler: async (ctx, args) => {
		const field = await ctx.db.get(args.fieldId);
		if (!field) throw new Error('Field not found');
		validateValue(field, args.value);
	},
});

// Validation Helpers
function isEmptyValue(value: unknown): boolean {
	if (value === null || value === undefined || value === '') return true;
	// Treat empty arrays as empty for required multiselect validation
	if (Array.isArray(value) && value.length === 0) return true;
	return false;
}

function assertNumber(field: Doc<'customFields'>, value: unknown): asserts value is number {
	if (typeof value !== 'number') {
		throw new Error(`Invalid type for ${field.name}, expected number`);
	}
}

function assertBoolean(field: Doc<'customFields'>, value: unknown): asserts value is boolean {
	if (typeof value !== 'boolean') {
		throw new Error(`Invalid type for ${field.name}, expected boolean`);
	}
}

function assertDateValue(field: Doc<'customFields'>, value: unknown): void {
	if (typeof value !== 'number' && typeof value !== 'string') {
		throw new Error(`Invalid date format for ${field.name}`);
	}
}

function assertSelectValue(field: Doc<'customFields'>, value: unknown): void {
	if (field.options && (typeof value !== 'string' || !field.options.includes(value))) {
		throw new Error(`Invalid option for ${field.name}`);
	}
}

function assertMultiSelectValue(field: Doc<'customFields'>, value: unknown): void {
	if (!Array.isArray(value)) {
		throw new Error(`Expected array for multiselect ${field.name}`);
	}
	if (field.options) {
		for (const item of value) {
			if (typeof item !== 'string' || !field.options.includes(item)) {
				throw new Error(`Invalid option '${item}' for ${field.name}`);
			}
		}
	}
}

function assertTextValue(field: Doc<'customFields'>, value: unknown): asserts value is string {
	if (typeof value !== 'string') {
		throw new Error(`Expected string for ${field.name}`);
	}
}

function validateValue(field: Doc<'customFields'>, value: unknown) {
	if (field.required && isEmptyValue(value)) {
		throw new Error(`Field ${field.name} is required`);
	}

	if (isEmptyValue(value)) return;

	switch (field.fieldType) {
		case 'number':
			assertNumber(field, value);
			return;
		case 'boolean':
			assertBoolean(field, value);
			return;
		case 'date':
			assertDateValue(field, value);
			return;
		case 'select':
			assertSelectValue(field, value);
			return;
		case 'multiselect':
			assertMultiSelectValue(field, value);
			return;
		case 'text':
			assertTextValue(field, value);
			return;
		default:
			return;
	}
}
