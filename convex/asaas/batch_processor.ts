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
	let consecutiveErrors = 0;
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
		for (const result of batchResults) {
			totalProcessed++;

			if (result.success && result.data) {
				successful.push(result.data);
				if (result.created) createdCount++;
				if (result.updated) updatedCount++;
			} else if (result.skipped) {
				skipped.push({
					item: batch[batchResults.indexOf(result)],
					reason: result.reason || 'Skipped',
				});
			} else if (result.success) {
				consecutiveErrors = 0;
			} else {
				failed.push({
					item: batch[batchResults.indexOf(result)],
					error: result.error || 'Unknown error',
				});
				consecutiveErrors++;
			}
		}

		// Adaptive batch sizing
		if (fullConfig.adaptiveBatching) {
			const errorRate = consecutiveErrors / batch.length;
			if (errorRate > 0.5) {
				// Reduce batch size if error rate is high
				currentBatchSize = Math.max(3, Math.floor(currentBatchSize / 2));
			} else if (errorRate < 0.1 && currentBatchSize < fullConfig.batchSize * 2) {
				// Increase batch size if error rate is low
				currentBatchSize = Math.min(fullConfig.batchSize * 2, currentBatchSize + 2);
			}
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
			chunk.map(async (item) => {
				let lastError: string | undefined;

				// Retry logic for individual items
				for (let attempt = 0; attempt <= maxRetries; attempt++) {
					try {
						const result = await worker(item);
						return result;
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
			}),
		);

		results.push(...chunkResults);
	}

	return results;
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
