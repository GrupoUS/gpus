import '@testing-library/jest-dom/vitest';

import { afterEach, vi } from 'vitest';

// Mock matchMedia globally for all tests
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(), // deprecated
		removeListener: vi.fn(), // deprecated
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})),
});

// Mock startViewTransition globally
if (typeof document !== 'undefined') {
	// @ts-expect-error - Minimal mock for testing, missing some ViewTransition properties
	document.startViewTransition = (cb: () => void) => {
		cb();
		return { finished: Promise.resolve(), ready: Promise.resolve() };
	};

	// Mock Element.animate for Web Animations API
	Element.prototype.animate = vi.fn().mockImplementation(() => ({
		finished: Promise.resolve(),
		cancel: vi.fn(),
		play: vi.fn(),
		pause: vi.fn(),
		reverse: vi.fn(),
		finish: vi.fn(),
		onfinish: null,
		oncancel: null,
		currentTime: 0,
		playState: 'finished',
	}));
}

// Clear localStorage and document classes after each test to prevent state leakage
afterEach(() => {
	localStorage.clear();
	document.documentElement.classList.remove('light', 'dark');
	document.documentElement.removeAttribute('style');
});
