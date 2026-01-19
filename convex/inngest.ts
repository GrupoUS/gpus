import { z } from 'zod';

import {
	type ContextSource,
	calculateRelevance,
	classifyContext,
	compressContext,
	factCheckContext,
	processAPI,
	processDatabase,
	processPDF,
	processSpreadsheet,
} from './lib/contextProcessor';
import { inngest } from './lib/inngest';

// Define schemas for our context gathering functions
const ContextGatherEventSchema = z.object({
	sources: z.array(
		z.object({
			type: z.enum(['pdf', 'spreadsheet', 'api', 'database']),
			url: z.string().optional(),
			path: z.string().optional(),
			query: z.string().optional(),
			priority: z.number().default(1),
		}),
	),
	filters: z
		.object({
			dateRange: z
				.object({
					start: z
						.string()
						.transform((str) => new Date(str))
						.optional(),
					end: z
						.string()
						.transform((str) => new Date(str))
						.optional(),
				})
				.optional(),
			keywords: z.array(z.string()).optional(),
			relevanceThreshold: z.number().default(0.7),
		})
		.optional(),
	userId: z.string(),
});

// Context gathering function
export const gatherContext = inngest.createFunction(
	{ id: 'gather-context' },
	{ event: 'context/gather' },
	async ({ event, step }) => {
		const { sources, filters, userId } = ContextGatherEventSchema.parse(event.data);

		// Process each source in parallel
		const contextPromises = sources.map(async (source) => {
			switch (source.type) {
				case 'pdf':
					return await step.run(`process-pdf-${source.path}`, async () => {
						if (!source.path) throw new Error('PDF path required');
						const data = await processPDF(source.path, filters);
						return {
							type: 'pdf',
							source: source.path,
							data,
							relevance: calculateRelevance(data, filters),
						} as ContextSource;
					});

				case 'spreadsheet':
					return await step.run(`process-spreadsheet-${source.path}`, async () => {
						if (!source.path) throw new Error('Spreadsheet path required');
						const data = await processSpreadsheet(source.path, filters);
						return {
							type: 'spreadsheet',
							source: source.path,
							data,
							relevance: calculateRelevance(data, filters),
						} as ContextSource;
					});

				case 'api':
					return await step.run(`process-api-${source.url}`, async () => {
						if (!source.url) throw new Error('API URL required');
						const data = await processAPI(source.url, source.query, filters);
						return {
							type: 'api',
							source: source.url,
							data,
							relevance: calculateRelevance(data, filters),
						} as ContextSource;
					});

				case 'database':
					return await step.run('process-database', async () => {
						const data = await processDatabase(source.query, filters);
						return {
							type: 'database',
							source: 'internal',
							data,
							relevance: calculateRelevance(data, filters),
						} as ContextSource;
					});

				default:
					return null;
			}
		});

		// Wait for all context gathering to complete
		const results = await Promise.all(contextPromises);

		// Filter out null results and sort by relevance
		const validResults = results
			.filter((r): r is ContextSource => r !== null)
			.sort((a, b) => b.relevance - a.relevance);

		// Trigger context augmentation
		await step.sendEvent('trigger-augmentation', {
			name: 'context/augment',
			data: {
				context: validResults,
				userId,
				query: event.data.filters?.keywords?.join(' ') || 'General Context',
			},
		});

		return {
			userId,
			context: validResults,
			processedAt: new Date().toISOString(),
			totalSources: sources.length,
			processedSources: validResults.length,
		};
	},
);

// Context augmentation function
export const augmentContext = inngest.createFunction(
	{ id: 'augment-context' },
	{ event: 'context/augment' },
	async ({ event, step }) => {
		const { context, query, userId } = event.data;

		// 1. Compress and structure context for LLM input
		const compressedContext = await step.run('compress-context', async () => {
			return await compressContext(context);
		});

		// 2. Fact check the compressed context
		const factCheckedContext = await step.run('fact-check-context', async () => {
			return await factCheckContext(compressedContext);
		});

		// 3. Classify the context
		const classifiedContext = await step.run('classify-context', async () => {
			return await classifyContext(factCheckedContext);
		});

		return {
			userId,
			originalQuery: query,
			augmentedContext: classifiedContext,
			processedAt: new Date().toISOString(),
		};
	},
);
