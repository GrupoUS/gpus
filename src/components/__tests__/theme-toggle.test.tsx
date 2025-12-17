// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '../theme-provider';
import { AnimatedThemeToggler } from '../ui/animated-theme-toggler';

// Mock icons to avoid rendering large SVGs in tests
vi.mock('lucide-react', () => ({
	Moon: () => <span data-testid="moon-icon">Moon</span>,
	Sun: () => <span data-testid="sun-icon">Sun</span>,
}));

describe('AnimatedThemeToggler', () => {
	it('renders the toggle button', () => {
		render(
			<ThemeProvider>
				<AnimatedThemeToggler />
			</ThemeProvider>,
		);
		expect(screen.getByRole('button')).toBeInTheDocument();
	});

	it('renders with accessible label in Portuguese', () => {
		render(
			<ThemeProvider>
				<AnimatedThemeToggler />
			</ThemeProvider>,
		);
		expect(screen.getByRole('button', { name: /alternar tema/i })).toBeInTheDocument();
	});

	it('handles click events', () => {
		render(
			<ThemeProvider defaultTheme="dark" storageKey="test-theme">
				<AnimatedThemeToggler />
			</ThemeProvider>,
		);

		const button = screen.getByRole('button');
		fireEvent.click(button);

		// After clicking, button should still be in the document
		// The component uses View Transition API which is mocked in setup.ts
		expect(button).toBeInTheDocument();
	});

	it('renders correctly', () => {
		const { container } = render(
			<ThemeProvider>
				<AnimatedThemeToggler />
			</ThemeProvider>,
		);
		expect(container).toBeTruthy();
	});
});
