// @vitest-environment jsdom
import { act, render, renderHook, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { ThemeProvider, useTheme } from '../theme-provider';

// Storage key used by ThemeProvider (must match implementation)
const STORAGE_KEY = 'vite-ui-theme';

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
	beforeEach(() => {
		localStorage.clear();
		document.documentElement.classList.remove('light', 'dark', 'system');
	});

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
		localStorage.setItem('theme', 'light');
		const { result } = renderHook(() => useTheme());
		expect(result.current.theme).toBe('light');
	});

	it('updates theme and storage when setTheme is called', () => {
		const { result } = renderHook(() => useTheme());
		act(() => {
			result.current.setTheme('dark');
		});
		expect(result.current.theme).toBe('dark');
		expect(localStorage.getItem('theme')).toBe('dark');
	});

	it('falls back to default theme for invalid stored values', () => {
		localStorage.setItem('theme', 'invalid-theme');
		const { result } = renderHook(() => useTheme());
		expect(result.current.theme).toBe('system');
	});

	it('updates theme and storage when setTheme is called', () => {
		render(
			<ThemeProvider>
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

	it('falls back to system theme for invalid stored values', () => {
		// Simulate user with non-standard preference
		localStorage.setItem(STORAGE_KEY, 'invalid-theme');
		render(
			<ThemeProvider>
				<TestComponent />
			</ThemeProvider>,
		);
		expect(screen.getByTestId('theme-value')).toHaveTextContent('system');
	});
});
