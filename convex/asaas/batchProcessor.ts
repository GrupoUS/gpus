/**
 * Asaas Batch Processor
 *
 * Concurrent batch processing with error isolation, progress checkpointing,
 * and adaptive batch sizing for Asaas import operations.
 */

// ═══════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════

/**
 * Configuration for batch processing
 */
export interface BatchProcessorConfig {
	/** Records per batch (default: 10) */
	batchSize: number;
	/** Number of parallel promises (default: 5) */
	concurrency: number;
	/** Delay between batches in ms (default: 100) */
	delayBetweenBatches: number;
	/** Per-record max retries (default: 3) */
	maxRetries: number;
	/** Records before progress update (default: 50) */
	checkpointInterval: number;
	/** Adjust batch size based on error rate */
	adaptiveBatching: boolean;
}

/**
 * Result from processing a single item
 */
export interface WorkerResult<T> {
	success: boolean;
	data?: T;
	error?: string;
	skipped?: boolean;
	reason?: string;
	created?: boolean;
	updated?: boolean;
}

/**
 * Progress statistics for checkpointing
 */
export interface ProgressStats {
	totalProcessed: number;
	successful: number;
	failed: number;
	skipped: number;
	created?: number;
	updated?: number;
	currentBatch: number;
	totalBatches?: number;
}

/**
 * Result from batch processing
 */
export interface BatchResult<T> {
	successful: T[];
	failed: Array<{ item: unknown; error: string }>;
	skipped: Array<{ item: unknown; reason: string }>;
	totalProcessed: number;
	duration: number;
	created?: number;
	updated?: number;
}

// ═══════════════════════════════════════════════════════
// DEFAULTS
// ═══════════════════════════════════════════════════════

const DEFAULT_CONFIG: BatchProcessorConfig = {
	batchSize: 10,
	concurrency: 5,
	delayBetweenBatches: 100,
	maxRetries: 3,
	checkpointInterval: 50,
	adaptiveBatching: true,
};

// ═══════════════════════════════════════════════════════
// BATCH PROCESSOR
// ═══════════════════════════════════════════════════════

/**
 * Sleep utility for delays
 */
function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Process items in concurrent batches with error isolation
 *
 * @template T Input item type
 * @template R Result type
 * @param items Array of items to process
 * @param worker Worker function to process each item
 * @param config Partial batch processor configuration
 * @param onProgress Optional callback for progress updates
 * @returns Batch result with successful, failed, and skipped items
 */
export async function processBatch<T, R>(
	items: T[],
	worker: (item: T) => Promise<WorkerResult<R>>,
	config: Partial<BatchProcessorConfig> = {},
	onProgress?: (stats: ProgressStats) => Promise<void>,
): Promise<BatchResult<R>> {
	const startTime = Date.now();
	const fullConfig = { ...DEFAULT_CONFIG, ...config };

	// Initialize results
	const successful: R[] = [];
	const failed: Array<{ item: unknown; error: string }> = [];
	const skipped: Array<{ item: unknown; reason: string }> = [];
	let createdCount = 0;
	let updatedCount = 0;

	// Calculate total batches
	const totalBatches = Math.ceil(items.length / fullConfig.batchSize);
	let currentBatch = 0;
	let totalProcessed = 0;

	// Adaptive batch sizing state
	let currentBatchSize = fullConfig.batchSize;

	// Process items in batches
	for (let i = 0; i < items.length; i += currentBatchSize) {
		currentBatch++;
		const batch = items.slice(i, i + currentBatchSize);

		// Process batch with concurrency control
		const batchResults = await processConcurrentBatch(
			batch,
			worker,
			fullConfig.concurrency,
			fullConfig.maxRetries,
		);

		// Aggregate results
		const aggregation = aggregateBatchResults(batch, batchResults);
		successful.push(...aggregation.successful);
		failed.push(...aggregation.failed);
		skipped.push(...aggregation.skipped);
		createdCount += aggregation.createdCount;
		updatedCount += aggregation.updatedCount;
		totalProcessed += batchResults.length;

		// Adaptive batch sizing
		if (fullConfig.adaptiveBatching) {
			currentBatchSize = calculateNextBatchSize(
				currentBatchSize,
				aggregation.consecutiveErrors,
				batch.length,
				fullConfig.batchSize,
			);
		}

		// Progress callback
		if (onProgress && totalProcessed % fullConfig.checkpointInterval === 0) {
			await onProgress({
				totalProcessed,
				successful: successful.length,
				failed: failed.length,
				skipped: skipped.length,
				created: createdCount,
				updated: updatedCount,
				currentBatch,
				totalBatches,
			});
		}

		// Delay between batches to avoid rate limiting
		if (i + currentBatchSize < items.length) {
			await sleep(fullConfig.delayBetweenBatches);
		}
	}

	// Final progress update
	if (onProgress) {
		await onProgress({
			totalProcessed,
			successful: successful.length,
			failed: failed.length,
			skipped: skipped.length,
			created: createdCount,
			updated: updatedCount,
			currentBatch,
			totalBatches,
		});
	}

	return {
		successful,
		failed,
		skipped,
		totalProcessed,
		duration: Date.now() - startTime,
		created: createdCount,
		updated: updatedCount,
	};
}

/**
 * Calculate next batch size based on error rate
 */
function calculateNextBatchSize(
	currentSize: number,
	consecutiveErrors: number,
	batchLength: number,
	maxSize: number,
): number {
	const errorRate = consecutiveErrors / batchLength;
	if (errorRate > 0.5) {
		// Reduce batch size if error rate is high
		return Math.max(3, Math.floor(currentSize / 2));
	}

	if (errorRate < 0.1 && currentSize < maxSize * 2) {
		// Increase batch size if error rate is low
		return Math.min(maxSize * 2, currentSize + 2);
	}

	return currentSize;
}

/**
 * Process a single batch with concurrency control
 */
async function processConcurrentBatch<T, R>(
	batch: T[],
	worker: (item: T) => Promise<WorkerResult<R>>,
	concurrency: number,
	maxRetries: number,
): Promise<WorkerResult<R>[]> {
	const results: WorkerResult<R>[] = [];

	// Process items in chunks based on concurrency
	for (let i = 0; i < batch.length; i += concurrency) {
		const chunk = batch.slice(i, i + concurrency);

		// Execute all items in chunk concurrently
		const chunkResults = await Promise.all(
			chunk.map((item) => processItemWithRetry(item, worker, maxRetries)),
		);

		results.push(...chunkResults);
	}

	return results;
}

/**
 * Process a single item with retry logic
 */
async function processItemWithRetry<T, R>(
	item: T,
	worker: (input: T) => Promise<WorkerResult<R>>,
	maxRetries: number,
): Promise<WorkerResult<R>> {
	let lastError: string | undefined;

	// Retry logic for individual items
	for (let attempt = 0; attempt <= maxRetries; attempt++) {
		try {
			return await worker(item);
		} catch (error) {
			lastError = error instanceof Error ? error.message : String(error);

			// Don't retry on last attempt
			if (attempt === maxRetries) {
				break;
			}

			// Exponential backoff for retries
			const delay = Math.min(1000 * 2 ** attempt, 5000);
			await sleep(delay);
		}
	}

	// All retries failed
	return {
		success: false,
		error: lastError || 'Max retries exceeded',
	} as WorkerResult<R>;
}

// ═══════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════

/**
 * Calculate estimated time remaining
 */
export function calculateETR(startTime: number, processed: number, total: number): string {
	const elapsed = Date.now() - startTime;
	const avgTimePerItem = elapsed / processed;
	const remaining = total - processed;
	const etrMs = avgTimePerItem * remaining;

	if (etrMs < 60_000) {
		return `${Math.round(etrMs / 1000)}s`;
	}
	if (etrMs < 3_600_000) {
		return `${Math.round(etrMs / 60_000)}m`;
	}
	return `${Math.round(etrMs / 3_600_000)}h`;
}

/**
 * Format progress percentage
 */
export function formatProgress(processed: number, total: number): string {
	return `${((processed / total) * 100).toFixed(1)}%`;
}

/**
 * Aggregate results from a batch
 */
function aggregateBatchResults<T, R>(batch: T[], batchResults: WorkerResult<R>[]) {
	const successful: R[] = [];
	const failed: Array<{ item: unknown; error: string }> = [];
	const skipped: Array<{ item: unknown; reason: string }> = [];
	let createdCount = 0;
	let updatedCount = 0;
	let consecutiveErrors = 0;

	for (let i = 0; i < batchResults.length; i++) {
		const result = batchResults[i];
		const item = batch[i];

		if (result.success && result.data) {
			successful.push(result.data);
			if (result.created) createdCount++;
			if (result.updated) updatedCount++;
			consecutiveErrors = 0;
		} else if (result.skipped) {
			skipped.push({
				item,
				reason: result.reason || 'Skipped',
			});
			consecutiveErrors = 0;
		} else {
			failed.push({
				item,
				error: result.error || 'Unknown error',
			});
			consecutiveErrors++;
		}
	}

	return {
		successful,
		failed,
		skipped,
		createdCount,
		updatedCount,
		consecutiveErrors,
	};
}
