import '@testing-library/jest-dom/vitest';

import { afterEach, vi } from 'vitest';

// Mock localStorage globally for jsdom environment
const createLocalStorageMock = () => {
	let store: Record<string, string> = {};
	return {
		getItem: vi.fn((key: string) => store[key] ?? null),
		setItem: vi.fn((key: string, value: string) => {
			store[key] = value;
		}),
		removeItem: vi.fn((key: string) => {
			delete store[key];
		}),
		clear: vi.fn(() => {
			store = {};
		}),
		get length() {
			return Object.keys(store).length;
		},
		key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
	};
};

const localStorageMock = createLocalStorageMock();

// Set up localStorage mock on globalThis for jsdom
if (typeof globalThis !== 'undefined') {
	Object.defineProperty(globalThis, 'localStorage', {
		value: localStorageMock,
		writable: true,
		configurable: true,
	});
}

// Also set on window if it exists (for jsdom)
if (typeof window !== 'undefined') {
	Object.defineProperty(window, 'localStorage', {
		value: localStorageMock,
		writable: true,
		configurable: true,
	});

	// Mock matchMedia globally for all tests
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		configurable: true,
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
}

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
	localStorageMock.clear();
	if (typeof document !== 'undefined') {
		document.documentElement.classList.remove('light', 'dark');
		document.documentElement.removeAttribute('style');
	}
});
