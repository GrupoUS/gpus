import { v } from 'convex/values';

import type { Id } from './_generated/dataModel';
import { internalMutation, mutation, query } from './_generated/server';
import { getOrganizationId, requireAuth, requirePermission } from './lib/auth';
import { PERMISSIONS } from './lib/permissions';
import { sanitizeSearchQuery } from './lib/validation';

// Validators
const fieldTypeValidator = v.union(
	v.literal('text'),
	v.literal('number'),
	v.literal('date'),
	v.literal('select'),
	v.literal('multiselect'),
	v.literal('boolean'),
);

const entityTypeValidator = v.union(v.literal('lead'), v.literal('student'));

export const listCustomFields = query({
	args: {
		entityType: entityTypeValidator,
		includeInactive: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const organizationId = await getOrganizationId(ctx);

		const fields = await ctx.db
			.query('customFields')
			.withIndex('by_organization_entity', (q) =>
				q.eq('organizationId', organizationId).eq('entityType', args.entityType),
			)
			.collect();

		if (args.includeInactive) {
			return fields;
		}

		return fields.filter((field) => field.active);
	},
});

export const getCustomFieldValues = query({
	args: {
		entityId: v.id('leads'), // using leads as generic ID type, validation happens below
		entityType: entityTypeValidator,
	},
	handler: async (ctx, args) => {
		const organizationId = await getOrganizationId(ctx);
		await requireAuth(ctx);

		// Verify entity exists and belongs to organization
		const entity = await ctx.db.get(args.entityId as Id<'leads'> | Id<'students'>);
		if (!entity || entity.organizationId !== organizationId) {
			return {};
		}

		// Get all values for this entity
		// We use the generic 'by_entity' index. Note that keys in index are strings or IDs?
		// In schema: by_entity: ['entityId', 'entityType'] where entityId is v.string()
		const values = await ctx.db
			.query('customFieldValues')
			.withIndex('by_entity', (q) =>
				q.eq('entityId', args.entityId).eq('entityType', args.entityType),
			)
			.collect();

		// Get field definitions to include metadata
		const fieldIds = values.map((v) => v.customFieldId);
		const fields = await Promise.all(fieldIds.map((id) => ctx.db.get(id)));

		const result: Record<string, { value: unknown; name: string; fieldType: string }> = {};

		for (const val of values) {
			const field = fields.find((f) => f?._id === val.customFieldId);
			if (field && field.organizationId === organizationId) {
				result[val.customFieldId] = {
					value: val.value,
					name: field.name,
					fieldType: field.fieldType,
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
		await requireAuth(ctx);

		if (args.entityIds.length > 100) {
			throw new Error('Batch size limit exceeded. Max 100 entities per request.');
		}

		// Fetch all values for the organization and entity type??
		// Plan says: "Use by_organization index on customFieldValues, filter by entityIds in memory"
		// This is potentially heavy but requested verbatim.
		// Optimizing: We can filter by entityType if the index supported it, but 'by_organization' is just ['organizationId'].
		// Assuming 'customFieldValues' table isn't massive per org, or we should use 'by_entity' per ID.
		// Given the specific instruction to use 'by_organization' and memory filter:

		const allValues = await ctx.db
			.query('customFieldValues')
			.withIndex('by_organization', (q) => q.eq('organizationId', organizationId))
			.collect();

		// Filter for the requested entities and type
		const headerSet = new Set(args.entityIds);
		const relevantValues = allValues.filter(
			(v) => v.entityType === args.entityType && headerSet.has(v.entityId),
		);

		// Group by entityId
		const result: Record<string, Record<string, unknown>> = {};

		// Initialize result objects
		for (const id of args.entityIds) {
			result[id] = {};
		}

		for (const val of relevantValues) {
			result[val.entityId][val.customFieldId] = val.value;
		}

		return result;
	},
});

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
		const identity = await requirePermission(ctx, PERMISSIONS.ALL);
		const organizationId = await getOrganizationId(ctx);

		// Validation
		const sanitizedName = sanitizeSearchQuery(args.name);
		if (sanitizedName.length < 2 || sanitizedName.length > 50) {
			throw new Error('Nome do campo deve ter entre 2 e 50 caracteres.');
		}

		if (
			(args.fieldType === 'select' || args.fieldType === 'multiselect') &&
			(!args.options || args.options.length === 0)
		) {
			throw new Error('Campos de seleção requerem pelo menos uma opção.');
		}

		if (args.options && args.options.length > 50) {
			throw new Error('Máximo de 50 opções permitidas.');
		}

		// Check duplicates
		const existing = await ctx.db
			.query('customFields')
			.withIndex('by_organization_entity', (q) =>
				q.eq('organizationId', organizationId).eq('entityType', args.entityType),
			)
			.filter((q) => q.eq(q.field('name'), sanitizedName))
			.first();

		if (existing?.active) {
			throw new Error('Já existe um campo com este nome para esta entidade.');
		}

		const fieldId = await ctx.db.insert('customFields', {
			name: sanitizedName,
			fieldType: args.fieldType,
			entityType: args.entityType,
			required: args.required,
			options: args.options?.map((o) => sanitizeSearchQuery(o)),
			organizationId,
			createdBy: identity.subject,
			createdAt: Date.now(),
			active: true,
		});

		await ctx.db.insert('activities', {
			type: 'nota_adicionada', // Using existing type as requested
			description: `Campo personalizado '${sanitizedName}' criado para ${args.entityType}`,
			organizationId,
			performedBy: identity.subject,
			createdAt: Date.now(),
			metadata: {
				fieldName: sanitizedName,
				fieldType: args.fieldType,
				entityType: args.entityType,
				customFieldId: fieldId,
			},
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
			throw new Error('Campo não encontrado.');
		}

		const updateData: Partial<{
			name: string;
			required: boolean;
			options: string[];
			active: boolean;
		}> = {};
		if (args.patch.name) {
			const name = sanitizeSearchQuery(args.patch.name);
			if (name.length < 2 || name.length > 50) throw new Error('Nome inválido.');
			updateData.name = name;
		}
		if (args.patch.required !== undefined) updateData.required = args.patch.required;
		if (args.patch.options && (field.fieldType === 'select' || field.fieldType === 'multiselect')) {
			if (args.patch.options.length === 0 || args.patch.options.length > 50) {
				throw new Error('Opções inválidas.');
			}
			updateData.options = args.patch.options.map((o) => sanitizeSearchQuery(o));
		}
		if (args.patch.active !== undefined) updateData.active = args.patch.active;

		await ctx.db.patch(args.fieldId, updateData);

		await ctx.db.insert('activities', {
			type: 'nota_adicionada',
			description: `Campo personalizado '${field.name}' atualizado`,
			organizationId,
			performedBy: identity.subject,
			createdAt: Date.now(),
			metadata: {
				fieldId: args.fieldId,
				changes: args.patch,
			},
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
			throw new Error('Campo não encontrado.');
		}

		// Soft delete
		await ctx.db.patch(args.fieldId, { active: false });

		await ctx.db.insert('activities', {
			type: 'nota_adicionada',
			description: `Campo personalizado '${field.name}' desativado`,
			organizationId,
			performedBy: identity.subject,
			createdAt: Date.now(),
			metadata: {
				fieldName: field.name,
				entityType: field.entityType,
			},
		});

		return true;
	},
});

export const validateCustomFieldValue = internalMutation({
	args: {
		fieldType: fieldTypeValidator,
		value: v.any(),
		required: v.boolean(),
		options: v.optional(v.array(v.string())),
	},
	handler: async (_ctx, args) => {
		if (args.required && (args.value === null || args.value === undefined || args.value === '')) {
			throw new Error('Este campo é obrigatório.');
		}

		if (args.value === null || args.value === undefined || args.value === '') {
			return null;
		}

		switch (args.fieldType) {
			case 'text':
				if (typeof args.value !== 'string') throw new Error('Valor deve ser texto.');
				if (args.value.length > 1000) throw new Error('Texto muito longo.');
				return sanitizeSearchQuery(args.value);

			case 'number': {
				const num = Number(args.value);
				if (Number.isNaN(num)) throw new Error('Valor deve ser numérico.');
				return num;
			}

			case 'boolean':
				if (typeof args.value !== 'boolean') throw new Error('Valor deve ser booleano.');
				return args.value;

			case 'date': {
				const date = Number(args.value);
				if (Number.isNaN(date)) throw new Error('Data inválida.');
				if (date < 0 || date > 4_102_444_800_000) throw new Error('Data fora do intervalo.'); // ~2100
				return date;
			}

			case 'select':
				if (!args.options?.includes(String(args.value))) {
					throw new Error('Opção inválida.');
				}
				return String(args.value);

			case 'multiselect':
				if (!Array.isArray(args.value)) throw new Error('Valor deve ser lista.');
				for (const item of args.value) {
					if (!args.options?.includes(String(item))) throw new Error(`Opção inválida: ${item}`);
				}
				return args.value.map(String);

			default:
				return args.value;
		}
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

		const field = await ctx.db.get(args.customFieldId);
		if (!field || field.organizationId !== organizationId || !field.active) {
			throw new Error('Campo inválido.');
		}

		if (field.entityType !== args.entityType) {
			throw new Error('Mismatch de tipo de entidade.');
		}

		// Verify permission
		const requiredPermission =
			args.entityType === 'lead' ? PERMISSIONS.LEADS_WRITE : PERMISSIONS.STUDENTS_WRITE;
		await requirePermission(ctx, requiredPermission); // This throws if false

		// Verify entity exists
		const entity = await ctx.db.get(args.entityId as Id<'leads'> | Id<'students'>);
		if (!entity || entity.organizationId !== organizationId) {
			throw new Error('Entidade não encontrada.');
		}

		// Validate value via internal mutation? Using internal mutation inside mutation is not standard.
		// Usually internalMutation is called via ctx.runMutation, but that's for other mutation contexts or scheduled jobs.
		// Inside the same transaction, we can just run the logic.
		// The plan says "Call internal `validateCustomFieldValue` mutation".
		// But in Convex you should avoid `ctx.runMutation` inside a mutation if possible because it splits transactions?
		// Actually, standard Convex pattern is fine calling internal functions if organizing logic.
		// But here I'll just inline the logic or use a helper function to keep it atomic in one transaction easily.
		// Wait, `internalMutation` is an entry point.
		// I will extract the logic to a helper function within this file or just call it if I must.
		// Calling `ctx.scheduler.runAfter(0, ...)` is async. `ctx.runMutation` is not available in MutationCtx?
		// Ah, standard mutations cannot call other mutations synchronously in the same transaction easily without `ctx.runMutation` which generally implies a separate transaction or specific handling.
		// PROPOSAL: I will implementing the validation logic HERE to ensure atomicity, or move `validateCustomFieldValue` to a helper function that is exported but not a mutation.
		// However, plan says "Internal Mutation: validateCustomFieldValue".
		// If I must ensure it is available as a reusable unit, I will keep it as internalMutation but I will duplicate the logic or call a shared helper.
		// Better: Create a plain function `validateValue` and use it in both places.

		const validatedValue = await validateValue(
			field.fieldType,
			args.value,
			field.required,
			field.options,
		);

		// Upsert
		const existing = await ctx.db
			.query('customFieldValues')
			.withIndex('by_entity', (q) =>
				q.eq('entityId', args.entityId).eq('entityType', args.entityType),
			)
			.filter((q) => q.eq(q.field('customFieldId'), args.customFieldId))
			.first();

		let valueId: string;
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
				entityId: args.entityId, // stored as string
				entityType: args.entityType,
				value: validatedValue,
				organizationId,
				updatedBy: identity.subject,
				updatedAt: Date.now(),
			});
		}

		await ctx.db.insert('activities', {
			type: 'nota_adicionada',
			description: `Valor atualizado para '${field.name}'`,
			organizationId,
			performedBy: identity.subject,
			createdAt: Date.now(),
			metadata: {
				fieldId: field._id,
				entityId: args.entityId,
				oldValue: existing?.value,
				newValue: validatedValue,
			},
		});

		return valueId;
	},
});

// Helper validation function
function validateValue(
	fieldType: string,
	value: unknown,
	required: boolean,
	options?: string[],
): unknown {
	if (required && (value === null || value === undefined || value === '')) {
		throw new Error('Este campo é obrigatório.');
	}

	if (value === null || value === undefined || value === '') {
		return null;
	}

	switch (fieldType) {
		case 'text':
			if (typeof value !== 'string') throw new Error('Valor deve ser texto.');
			if (value.length > 1000) throw new Error('Texto muito longo.');
			return sanitizeSearchQuery(value);

		case 'number': {
			const num = Number(value);
			if (Number.isNaN(num)) throw new Error('Valor deve ser numérico.');
			return num;
		}

		case 'boolean':
			if (typeof value !== 'boolean') throw new Error('Valor deve ser booleano.');
			return value;

		case 'date': {
			const date = Number(value);
			if (Number.isNaN(date)) throw new Error('Data inválida.');
			if (date < 0 || date > 4_102_444_800_000) throw new Error('Data fora do intervalo.');
			return date;
		}

		case 'select':
			if (!options?.includes(String(value))) {
				throw new Error('Opção inválida.');
			}
			return String(value);

		case 'multiselect':
			if (!Array.isArray(value)) throw new Error('Valor deve ser lista.');
			for (const item of value) {
				if (!options?.includes(String(item))) throw new Error(`Opção inválida: ${item}`);
			}
			return value.map(String);

		default:
			return value;
	}
}
