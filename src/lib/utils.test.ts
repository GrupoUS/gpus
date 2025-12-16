import { describe, expect, it } from 'vitest';

import { cn } from './utils';

describe('cn utility', () => {
	it('merges class names correctly', () => {
		expect(cn('c1', 'c2')).toBe('c1 c2');
	});

	it('handles conditional classes', () => {
		expect(cn('c1', 'c2', false)).toBe('c1 c2');
	});

	it('merges tailwind classes', () => {
		expect(cn('p-4 p-2')).toBe('p-2');
		expect(cn('bg-red-500', 'bg-blue-500')).toBe('bg-blue-500');
	});
});
