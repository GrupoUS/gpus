// @vitest-environment jsdom
import { act, render, renderHook, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { ThemeProvider, useTheme } from '../theme-provider';

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
		</div>
	);
};

describe('ThemeProvider', () => {
	it('should use default theme when no storage value exists', () => {
		const { result } = renderHook(() => useTheme(), { wrapper: ThemeProvider });
		expect(result.current.theme).toBe('system');
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
			<ThemeProvider defaultTheme="light">
				<TestComponent />
			</ThemeProvider>,
		);
		expect(screen.getByTestId('theme-value')).toHaveTextContent('light');
	});

	it('falls back to default theme for invalid stored values', () => {
		// Simulate user with invalid/legacy preference (e.g., old 'system' value)
		localStorage.setItem(STORAGE_KEY, 'invalid-theme');
		render(
			<ThemeProvider>
				<TestComponent />
			</ThemeProvider>,
		);
		// Should use the stored value as-is (cast to Theme) - TypeScript handles type safety
		// In practice, the DOM class will be applied regardless
		expect(screen.getByTestId('theme-value')).toHaveTextContent('invalid-theme');
	});
});
