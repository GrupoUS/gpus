// @vitest-environment jsdom
import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { ThemeProvider, useTheme } from '../theme-provider';

// matchMedia and startViewTransition mocks are in src/test/setup.ts

// Storage key used by ThemeProvider (must match implementation)
const STORAGE_KEY = 'gpus-ui-theme';

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

	it('uses default theme (dark) if no storage', () => {
		render(
			<ThemeProvider>
				<TestComponent />
			</ThemeProvider>,
		);
		// ThemeProvider defaults to 'dark' when no storage value exists
		expect(screen.getByTestId('theme-value')).toHaveTextContent('dark');
	});

	it('uses stored theme from localStorage', () => {
		localStorage.setItem(STORAGE_KEY, 'light');
		render(
			<ThemeProvider>
				<TestComponent />
			</ThemeProvider>,
		);
		expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
		expect(document.documentElement.classList.contains('light')).toBe(true);
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
		expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
		expect(document.documentElement.classList.contains('dark')).toBe(true);
	});

	it('respects custom defaultTheme prop', () => {
		render(
			<ThemeProvider defaultTheme="system">
				<TestComponent />
			</ThemeProvider>,
		);
		expect(screen.getByTestId('theme-value')).toHaveTextContent('system');
	});
});
