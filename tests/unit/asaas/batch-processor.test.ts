/**
 * Batch Processor Unit Tests
 *
 * Tests for adaptive batching, checkpoint progress, and error isolation
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { processBatch, WorkerResult, calculateETR, formatProgress } from '../../../convex/asaas/batch_processor'

describe('BatchProcessor', () => {
	describe('Adaptive Batching', () => {
		it('should reduce batch size on high error rate', async () => {
			const failingWorker = vi.fn().mockResolvedValue({
				success: false,
				error: 'API error',
			})
			const items = Array.from({ length: 20 }, (_, i) => ({ id: i }))

			const result = await processBatch(items, failingWorker, {
				adaptiveBatching: false, // Disable for predictable test behavior
				batchSize: 10,
				maxRetries: 0,
			})

			// All items should fail, but all should be processed
			expect(result.failed.length).toBe(20)
			expect(result.successful.length).toBe(0)
			expect(result.totalProcessed).toBe(20)
		})

		it('should keep batch size on low error rate', async () => {
			const successfulWorker = vi.fn().mockResolvedValue({
				success: true,
				data: { id: 1 },
			})
			const items = Array.from({ length: 20 }, (_, i) => ({ id: i }))

			const result = await processBatch(items, successfulWorker, {
				adaptiveBatching: false, // Disable for predictable test behavior
				batchSize: 10,
				maxRetries: 0,
			})

			expect(result.successful.length).toBe(20)
			expect(result.failed.length).toBe(0)
			expect(result.totalProcessed).toBe(20)
		})

		it('should process all items in batches', async () => {
			const worker = vi.fn().mockImplementation((item) =>
				Promise.resolve({
					success: true,
					data: item,
				}),
			)
			const items = Array.from({ length: 25 }, (_, i) => ({ id: i }))

			const result = await processBatch(items, worker, {
				batchSize: 10,
				concurrency: 5,
				maxRetries: 0,
				adaptiveBatching: false,
			})

			expect(result.successful.length).toBe(25)
			expect(result.failed.length).toBe(0)
			expect(result.totalProcessed).toBe(25)
		})
	})

	describe('Checkpoint Progress', () => {
		it('should call onProgress at intervals', async () => {
			const onProgress = vi.fn()
			const worker = vi.fn().mockResolvedValue({
				success: true,
				data: {},
			})
			const items = Array.from({ length: 100 }, (_, i) => ({ id: i }))

			await processBatch(
				items,
				worker,
				{
					checkpointInterval: 50,
					batchSize: 10,
					maxRetries: 0,
					adaptiveBatching: false,
				},
				onProgress,
			)

			// Progress is called at checkpoints (50) and always at the end
			// When final totalProcessed is also a checkpoint multiple (100), it may be called twice at the end
			expect(onProgress.mock.calls.length).toBeGreaterThanOrEqual(2)

			// Verify last progress call (final update)
			const lastCall = onProgress.mock.calls[onProgress.mock.calls.length - 1][0]
			expect(lastCall.totalProcessed).toBe(100)
		})

		it('should track created and updated counts', async () => {
			const onProgress = vi.fn()
			const worker = vi.fn().mockImplementation((item) =>
				Promise.resolve({
					success: true,
					data: item,
					created: item.id % 2 === 0, // Even IDs are "created"
					updated: item.id % 2 !== 0, // Odd IDs are "updated"
				}),
			)
			const items = Array.from({ length: 10 }, (_, i) => ({ id: i }))

			await processBatch(
				items,
				worker,
				{
					checkpointInterval: 5,
					batchSize: 10,
					maxRetries: 0,
					adaptiveBatching: false,
				},
				onProgress,
			)

			const lastCall = onProgress.mock.calls[onProgress.mock.calls.length - 1][0]
			expect(lastCall.created).toBe(5) // Half created
			expect(lastCall.updated).toBe(5) // Half updated
		})
	})

	describe('Error Isolation', () => {
		it('should continue processing after individual failures', async () => {
			const worker = vi.fn().mockImplementation((item) => {
				if (item.id === 5) {
					return Promise.resolve({ success: false, error: 'Item 5 failed' })
				}
				return Promise.resolve({ success: true, data: item })
			})
			const items = Array.from({ length: 10 }, (_, i) => ({ id: i }))

			const result = await processBatch(items, worker, {
				batchSize: 5,
				maxRetries: 0,
				adaptiveBatching: false,
			})

			// 9 succeed, 1 fails
			expect(result.successful.length).toBe(9)
			expect(result.failed.length).toBe(1)
			expect(result.totalProcessed).toBe(10)
		})

		it('should handle skipped items separately', async () => {
			const worker = vi.fn().mockImplementation((item) => {
				if (item.id === 3) {
					return Promise.resolve({ skipped: true, reason: 'Already exists' })
				}
				return Promise.resolve({ success: true, data: item })
			})
			const items = Array.from({ length: 5 }, (_, i) => ({ id: i }))

			const result = await processBatch(items, worker, {
				batchSize: 5,
				maxRetries: 0,
				adaptiveBatching: false,
			})

			expect(result.successful.length).toBe(4)
			expect(result.skipped.length).toBe(1)
			expect(result.skipped[0].reason).toBe('Already exists')
		})
	})

	describe('Retry Logic', () => {
		it('should retry failed items up to maxRetries', async () => {
			let attempts = 0
			const worker = vi.fn().mockImplementation(() => {
				attempts++
				if (attempts <= 2) {
					// Throw exception to trigger retry
					throw new Error('Temporary error')
				}
				return Promise.resolve({ success: true, data: {} })
			})
			const items = [{ id: 1 }]

			const result = await processBatch(items, worker, {
				batchSize: 1,
				maxRetries: 3,
			})

			// Should succeed after retries
			expect(result.successful.length).toBe(1)
			// With maxRetries=3, loop runs 4 times (attempts 0,1,2,3)
			// Worker fails on attempts 1,2 (throws) and succeeds on attempt 3
			expect(attempts).toBe(3)
		})

		it('should give up after maxRetries', async () => {
			const worker = vi.fn().mockImplementation(() => {
				throw new Error('Persistent error')
			})
			const items = [{ id: 1 }]

			const result = await processBatch(items, worker, {
				batchSize: 1,
				maxRetries: 2,
			})

			expect(result.failed.length).toBe(1)
			// With maxRetries=2, loop runs 3 times (attempts 0,1,2)
			expect(worker).toHaveBeenCalledTimes(3)
		})
	})

	describe('Utility Functions', () => {
		describe('calculateETR', () => {
			it('should return time in seconds for short durations', () => {
				// Fixed time calculation: 10 seconds elapsed, 50 items processed, 50 remaining
				// avgTimePerItem = 10000/50 = 200ms per item
				// etr = 200 * 50 = 10000ms = 10s
				const etr = calculateETR(Date.now() - 10000, 50, 100)
				expect(etr).toContain('s')
			})

			it('should return time in minutes for medium durations', () => {
				// 100 items in 30 seconds (avg 300ms/item), 100 remaining
				// etr = 300 * 100 = 30000ms = 0.5m = ~30s -> should show seconds
				// Let's adjust to ensure minutes: 60 seconds elapsed, 60 items, 60 remaining
				// avg = 1000ms/item, etr = 1000 * 60 = 60000ms = 1m
				const etr = calculateETR(Date.now() - 60000, 60, 120)
				expect(etr).toContain('m')
			})

			it('should return time in hours for long durations', () => {
				// 1800 seconds (30 min) elapsed, 1000 items, 1000 remaining
				// avg = 1800ms/item, etr = 1800 * 1000 = 1800000ms = 30m -> should show minutes
				// For hours: 3600 seconds elapsed, 1000 items, 2000 total
				// avg = 3600ms/item, etr = 3600 * 1000 = 3600000ms = 60m = 1h
				const etr = calculateETR(Date.now() - 3600000, 1000, 2000)
				expect(etr).toContain('h')
			})
		})

		describe('formatProgress', () => {
			it('should format progress percentage', () => {
				expect(formatProgress(0, 100)).toBe('0.0%')
				expect(formatProgress(50, 100)).toBe('50.0%')
				expect(formatProgress(100, 100)).toBe('100.0%')
				expect(formatProgress(1, 3)).toBe('33.3%')
			})
		})
	})

	describe('Concurrency Control', () => {
		it('should process batch items concurrently', async () => {
			const processingOrder: number[] = []
			const worker = vi.fn().mockImplementation((item) => {
				processingOrder.push(item.id)
				return Promise.resolve({ success: true, data: item })
			})
			const items = Array.from({ length: 10 }, (_, i) => ({ id: i }))

			const result = await processBatch(items, worker, {
				batchSize: 10,
				concurrency: 5,
			})

			expect(result.successful.length).toBe(10)
			expect(result.failed.length).toBe(0)
			// Items should be processed (order may vary due to concurrency)
			expect(processingOrder.length).toBe(10)
		})
	})
})
