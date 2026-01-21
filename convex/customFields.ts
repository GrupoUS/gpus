import { v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import { internalMutation, mutation, query } from './_generated/server';
import { getOrganizationId, requireAuth, requirePermission } from './lib/auth';
import { PERMISSIONS } from './lib/permissions';
import { sanitizeSearchQuery } from './lib/validation';

// -------------------------------------------------------------------------
// Validators & Constants
// -------------------------------------------------------------------------

const fieldTypeValidator = v.union(
	v.literal('text'),
	v.literal('number'),
	v.literal('boolean'),
	v.literal('date'),
	v.literal('select'),
	v.literal('multiselect'),
);

// Restricted to schema-supported types to ensure type safety
const entityTypeValidator = v.union(v.literal('lead'), v.literal('student'));

// -------------------------------------------------------------------------
// Queries
// -------------------------------------------------------------------------

export const listCustomFields = query({
	args: {
		entityType: entityTypeValidator,
		includeInactive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const organizationId = await getOrganizationId(ctx);

		let fields = await ctx.db
			.query('customFields')
			.withIndex('by_organization_entity', (q) =>
				q.eq('organizationId', organizationId).eq('entityType', args.entityType),
			)
			.collect();

		if (!args.includeInactive) {
			fields = fields.filter((f) => f.active === true);
		}

		return fields.sort((a, b) => a.createdAt - b.createdAt);
	},
});

export const getCustomFieldValues = query({
	args: {
		entityId: v.string(),
		entityType: entityTypeValidator,
	},
	handler: async (ctx, args) => {
		const organizationId = await getOrganizationId(ctx);
		await requireAuth(ctx);

		// 1. Verify entity exists and belongs to organization
		// We cast to any or a union of IDs because we don't handle table selection dynamically for typing
		const entity = await ctx.db.get(args.entityId as Id<'leads'> | Id<'students'>);

		if (!entity) {
			return null;
		}

		if (entity.organizationId !== organizationId) {
			return null;
		}

		// 2. Get all values for this entity
		const values = await ctx.db
			.query('customFieldValues')
			.withIndex('by_entity', (q) =>
				q.eq('entityId', args.entityId).eq('entityType', args.entityType),
			)
			.collect();

		// 3. Get field definitions to include metadata
		// Fetch all for this org/entityType (optimization over N gets)
		const allFields = await ctx.db
			.query('customFields')
			.withIndex('by_organization_entity', (q) =>
				q.eq('organizationId', organizationId).eq('entityType', args.entityType),
			)
			.collect();

		const fieldMap = new Map(allFields.map((f) => [f._id, f]));

		// 4. Transform result
		// biome-ignore lint/suspicious/noExplicitAny: Value comes from database as any
		const result: Record<string, { value: any; name: string; fieldType: string; fieldId: string }> =
			{};
		for (const val of values) {
			const fieldDef = fieldMap.get(val.customFieldId);
			if (fieldDef) {
				result[val.customFieldId] = {
					value: val.value,
					name: fieldDef.name,
					fieldType: fieldDef.fieldType,
					fieldId: fieldDef._id,
				};
			}
		}

		return result;
	},
});

export const batchGetCustomFieldValues = query({
	args: {
		entityIds: v.array(v.string()), // Generic string IDs
		entityType: entityTypeValidator,
	},
	handler: async (ctx, args) => {
		const organizationId = await getOrganizationId(ctx);
		await requireAuth(ctx); // Ensure auth

		if (args.entityIds.length > 100) {
			throw new Error('Batch size limited to 100 entities');
		}

		// 1. Fetch all custom field definitions for this type/org
		const fieldDefs = await ctx.db
			.query('customFields')
			.withIndex('by_organization_entity', (q) =>
				q.eq('organizationId', organizationId).eq('entityType', args.entityType),
			)
			.collect();

		const fieldDefMap = new Map(fieldDefs.map((fd) => [fd._id, fd]));

		// 2. Fetch value strategy: Use by_organization index as requested and filter in memory
		// Note: If dataset is large, this is slow. But following plan verbatim.
		// "Use by_organization index on customFieldValues"
		const allOrgValues = await ctx.db
			.query('customFieldValues')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
			.collect();

		// Filter in memory
		const entityIdSet = new Set(args.entityIds);
		const relevantValues = allOrgValues.filter(
			(val) => val.entityType === args.entityType && entityIdSet.has(val.entityId),
		);

		// 3. Map results
		// biome-ignore lint/suspicious/noExplicitAny: Result values are any
		const results: Record<string, Record<string, any>> = {};

		// Initialize
		for (const id of args.entityIds) {
			results[id] = {};
		}

		for (const val of relevantValues) {
			const fd = fieldDefMap.get(val.customFieldId);
			if (fd) {
				results[val.entityId][val.customFieldId] = {
					value: val.value,
					name: fd.name,
					fieldType: fd.fieldType,
				};
			}
		}

		return results;
	},
});

// -------------------------------------------------------------------------
// Mutations
// -------------------------------------------------------------------------

export const createCustomField = mutation({
	args: {
		name: v.string(),
		fieldType: fieldTypeValidator,
		entityType: entityTypeValidator,
		required: v.boolean(),
		options: v.optional(v.array(v.string())),
		description: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const identity = await requirePermission(ctx, PERMISSIONS.ALL); // Admin only
		const organizationId = await getOrganizationId(ctx);

		// Validation
		const safeName = sanitizeSearchQuery(args.name);
		if (safeName.length < 2 || safeName.length > 50) {
			throw new Error('Name must be between 2 and 50 characters');
		}

		let sanitizedOptions = args.options;
		if (args.fieldType === 'select' || args.fieldType === 'multiselect') {
			if (!args.options || args.options.length === 0) {
				throw new Error('Options required for select/multiselect fields');
			}
			if (args.options.length > 50) {
				throw new Error('Max 50 options allowed');
			}
			sanitizedOptions = args.options.map((o) => sanitizeSearchQuery(o));
		}

		// Check duplicates
		const existing = await ctx.db
			.query('customFields')
			.withIndex('by_organization_entity', (q) =>
				q.eq('organizationId', organizationId).eq('entityType', args.entityType),
			)
			.filter((q) => q.eq(q.field('name'), safeName))
			.first();

		if (existing?.active) {
			throw new Error(`Field '${safeName}' already exists for ${args.entityType}`);
		}

		// Insert
		const fieldId = await ctx.db.insert('customFields', {
			name: safeName,
			fieldType: args.fieldType,
			entityType: args.entityType,
			required: args.required,
			options: sanitizedOptions,
			description: args.description,
			organizationId,
			createdBy: identity.subject,
			createdAt: Date.now(),
			active: true,
		});

		// Activity Log
		await ctx.db.insert('activities', {
			type: 'nota_adicionada',
			description: `Custom field '${safeName}' created for ${args.entityType}`,
			metadata: {
				fieldName: safeName,
				fieldType: args.fieldType,
				entityType: args.entityType,
				fieldId,
			},
			organizationId,
			performedBy: identity.subject,
			createdAt: Date.now(),
		});

		return fieldId;
	},
});

export const updateCustomField = mutation({
	args: {
		fieldId: v.id('customFields'),
		patch: v.object({
			name: v.optional(v.string()),
			required: v.optional(v.boolean()),
			options: v.optional(v.array(v.string())),
			description: v.optional(v.string()),
			active: v.optional(v.boolean()),
		}),
	},
	handler: async (ctx, args) => {
		const identity = await requirePermission(ctx, PERMISSIONS.ALL);
		const organizationId = await getOrganizationId(ctx);

		const field = await ctx.db.get(args.fieldId);
		if (!field || field.organizationId !== organizationId) {
			throw new Error('Field not found or access denied');
		}

		const updates: {
			name?: string;
			required?: boolean;
			options?: string[];
			description?: string;
			active?: boolean;
		} = {};

		const resolveNameUpdate = async (): Promise<string | null> => {
			if (args.patch.name === undefined) {
				return null;
			}

			const safeName = sanitizeSearchQuery(args.patch.name);
			if (safeName.length < 2 || safeName.length > 50) throw new Error('Invalid name length');

			if (safeName !== field.name) {
				const existing = await ctx.db
					.query('customFields')
					.withIndex('by_organization_entity', (q) =>
						q.eq('organizationId', organizationId).eq('entityType', field.entityType),
					)
					.filter((q) => q.eq(q.field('name'), safeName))
					.first();
				if (existing && existing._id !== args.fieldId && existing.active) {
					throw new Error('Field name already exists');
				}
			}

			return safeName;
		};

		const resolveOptionsUpdate = (): string[] | null => {
			if (args.patch.options === undefined) {
				return null;
			}

			if (field.fieldType !== 'select' && field.fieldType !== 'multiselect') {
				return null;
			}

			if (args.patch.options.length === 0 || args.patch.options.length > 50) {
				throw new Error('Invalid options count');
			}

			return args.patch.options.map((option) => sanitizeSearchQuery(option));
		};

		const nameUpdate = await resolveNameUpdate();
		if (nameUpdate !== null) {
			updates.name = nameUpdate;
		}

		const optionsUpdate = resolveOptionsUpdate();
		if (optionsUpdate !== null) {
			updates.options = optionsUpdate;
		}

		if (args.patch.required !== undefined) updates.required = args.patch.required;
		if (args.patch.description !== undefined) updates.description = args.patch.description;
		if (args.patch.active !== undefined) updates.active = args.patch.active;

		await ctx.db.patch(args.fieldId, updates);

		await ctx.db.insert('activities', {
			type: 'nota_adicionada',
			description: `Custom field '${field.name}' updated`,
			metadata: { fieldId: field._id, changes: Object.keys(updates) },
			organizationId,
			performedBy: identity.subject,
			createdAt: Date.now(),
		});

		return true;
	},
});

export const deleteCustomField = mutation({
	args: {
		fieldId: v.id('customFields'),
	},
	handler: async (ctx, args) => {
		const identity = await requirePermission(ctx, PERMISSIONS.ALL);
		const organizationId = await getOrganizationId(ctx);

		const field = await ctx.db.get(args.fieldId);
		if (!field || field.organizationId !== organizationId) {
			throw new Error('Field not found');
		}

		// Soft delete
		await ctx.db.patch(args.fieldId, { active: false });

		await ctx.db.insert('activities', {
			type: 'nota_adicionada',
			description: `Custom field '${field.name}' deleted (soft)`,
			metadata: { fieldId: field._id, entityType: field.entityType },
			organizationId,
			performedBy: identity.subject,
			createdAt: Date.now(),
		});

		return true;
	},
});

export const setCustomFieldValue = mutation({
	args: {
		customFieldId: v.id('customFields'),
		entityId: v.string(),
		entityType: entityTypeValidator,
		value: v.any(),
	},
	handler: async (ctx, args) => {
		const identity = await requireAuth(ctx);
		const organizationId = await getOrganizationId(ctx);

		// 1. Verify access to entityType
		const requiredPerm =
			args.entityType === 'lead' ? PERMISSIONS.LEADS_WRITE : PERMISSIONS.STUDENTS_WRITE;
		await requirePermission(ctx, requiredPerm);

		// 2. Verify Field
		const field = await ctx.db.get(args.customFieldId);
		if (!field || field.organizationId !== organizationId || !field.active) {
			throw new Error('Field not active or not found');
		}
		if (field.entityType !== args.entityType) {
			throw new Error('Field type mismatch');
		}

		// 3. Verify Entity exists in Org
		const entity = await ctx.db.get(args.entityId as Id<'leads'> | Id<'students'>);
		if (!entity || entity.organizationId !== organizationId) {
			throw new Error('Entity not found in organization');
		}

		// 4. Validate Value using shared helper logic
		const validatedValue = validateValueLogic(
			field.fieldType,
			args.value,
			field.required,
			field.options,
		);

		// 5. Upsert
		const existing = await ctx.db
			.query('customFieldValues')
			.withIndex('by_entity', (q) =>
				q.eq('entityId', args.entityId).eq('entityType', args.entityType),
			)
			.filter((q) => q.eq(q.field('customFieldId'), args.customFieldId))
			.first();

		let valueId: Id<'customFieldValues'>;
		if (existing) {
			await ctx.db.patch(existing._id, {
				value: validatedValue,
				updatedBy: identity.subject,
				updatedAt: Date.now(),
			});
			valueId = existing._id;
		} else {
			valueId = await ctx.db.insert('customFieldValues', {
				customFieldId: args.customFieldId,
				entityId: args.entityId,
				entityType: args.entityType,
				value: validatedValue,
				organizationId,
				updatedBy: identity.subject,
				updatedAt: Date.now(),
			});
		}

		// 6. Log (include entityType-specific ID for activity timeline indexing)
		await ctx.db.insert('activities', {
			type: 'nota_adicionada',
			description: `Value updated for field '${field.name}'`,
			metadata: {
				fieldName: field.name,
				entityId: args.entityId,
				previousValue: existing?.value,
				newValue: validatedValue,
			},
			// Link to entity for timeline queries (by_lead / by_student indexes)
			...(args.entityType === 'lead' && { leadId: args.entityId as Id<'leads'> }),
			...(args.entityType === 'student' && { studentId: args.entityId as Id<'students'> }),
			organizationId,
			performedBy: identity.subject,
			createdAt: Date.now(),
		});

		return valueId;
	},
});

export const validateCustomFieldValue = internalMutation({
	args: {
		fieldType: fieldTypeValidator,
		value: v.any(),
		required: v.boolean(),
		options: v.optional(v.array(v.string())),
	},
	handler: (_ctx, args) =>
		validateValueLogic(args.fieldType, args.value, args.required, args.options),
});

// -------------------------------------------------------------------------
// Helpers
// -------------------------------------------------------------------------

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Validation logic requires switch
function validateValueLogic(
	fieldType: string,
	// biome-ignore lint/suspicious/noExplicitAny: Validation logic allows any input
	value: any,
	required: boolean,
	options?: string[],
	// biome-ignore lint/suspicious/noExplicitAny: Returns sanitized value of any type
): any {
	// Check for empty arrays (multiselect/select)
	const isEmptyArray = Array.isArray(value) && value.length === 0;

	// Required check - treat empty arrays as missing for multiselect/select
	if (required && (value === null || value === undefined || value === '' || isEmptyArray)) {
		throw new Error('Field is required');
	}

	// Allow clearing value if not required
	if (value === null || value === undefined || value === '' || isEmptyArray) {
		return null;
	}

	switch (fieldType) {
		case 'text':
			if (typeof value !== 'string') throw new Error('Value must be text');
			if (value.length > 1000) throw new Error('Text too long (max 1000)');
			return sanitizeSearchQuery(value);

		case 'number': {
			const num = Number(value);
			if (Number.isNaN(num) || !Number.isFinite(num)) throw new Error('Invalid number');
			return num;
		}

		case 'boolean':
			if (typeof value !== 'boolean') throw new Error('Value must be boolean');
			return value;

		case 'date': {
			const dateNum = Number(value);
			if (Number.isNaN(dateNum)) throw new Error('Invalid date timestamp');
			if (dateNum < 0 || dateNum > 4_102_444_800_000) {
				throw new Error('Date out of range');
			}
			return dateNum;
		}

		case 'select':
			if (!options?.includes(String(value))) throw new Error('Invalid option selected');
			return String(value);

		case 'multiselect':
			if (!Array.isArray(value)) throw new Error('Value must be array');
			for (const item of value) {
				if (!options?.includes(String(item))) throw new Error(`Invalid option: ${item}`);
			}
			return value.map(String);

		default:
			return value;
	}
}
