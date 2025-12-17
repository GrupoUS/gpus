import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider, useTheme } from '../theme-provider';

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
	writable: true,
	value: vi.fn().mockImplementation((query) => ({
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

// Mock startViewTransition
if (typeof document !== 'undefined') {
	(document as any).startViewTransition = (cb: any) => {
		cb();
		return { finished: Promise.resolve(), ready: Promise.resolve() };
	};
}

// Helper component to test hook
const TestComponent = () => {
	const { theme, setTheme } = useTheme();
	return (
		<div>
			<span data-testid="theme-value">{theme}</span>
			<button onClick={() => setTheme('dark')}>Set Dark</button>
			<button onClick={() => setTheme('light')}>Set Light</button>
			<button onClick={() => setTheme('system')}>Set System</button>
		</div>
	);
};

describe('ThemeProvider', () => {
	beforeEach(() => {
		localStorage.clear();
		document.documentElement.classList.remove('light', 'dark');
	});

	it('uses default theme (system) if no storage', () => {
		render(
			<ThemeProvider>
				<TestComponent />
			</ThemeProvider>,
		);
		expect(screen.getByTestId('theme-value')).toHaveTextContent('system');
	});

	it('uses stored theme from localStorage', () => {
		localStorage.setItem('vite-ui-theme', 'dark');
		render(
			<ThemeProvider>
				<TestComponent />
			</ThemeProvider>,
		);
		expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
		expect(document.documentElement.classList.contains('dark')).toBe(true);
	});

	it('updates theme and storage when setTheme is called', () => {
		render(
			<ThemeProvider defaultTheme="light">
				<TestComponent />
			</ThemeProvider>,
		);

		const darkButton = screen.getByText('Set Dark');
		act(() => {
			darkButton.click();
		});

		expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
		expect(localStorage.getItem('vite-ui-theme')).toBe('dark');
		expect(document.documentElement.classList.contains('dark')).toBe(true);
	});
});
