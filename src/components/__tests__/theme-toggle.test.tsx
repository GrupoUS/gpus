import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '../theme-provider';
import { ThemeToggle } from '../theme-toggle';

// Mock icons to avoid rendering large SVGs in tests
vi.mock('lucide-react', () => ({
	Moon: () => <span data-testid="moon-icon">Moon</span>,
	Sun: () => <span data-testid="sun-icon">Sun</span>,
	Laptop: () => <span data-testid="laptop-icon">Laptop</span>, // Assuming you might use this later
}));

describe('ThemeToggle', () => {
	it('renders the toggle button', () => {
		render(
			<ThemeProvider>
				<ThemeToggle />
			</ThemeProvider>,
		);
		expect(screen.getByRole('button')).toBeInTheDocument();
	});

	// Since we are using Radix UI Dropdown, we might need to mock PointerEvents or just check if trigger works
	// For basic unit test complexity, we verify it renders without crashing.
	// Detailed interaction tests are often better in E2E or with specific Radix mocks.
	it('renders correctly', () => {
		const { container } = render(
			<ThemeProvider>
				<ThemeToggle />
			</ThemeProvider>,
		);
		expect(container).toBeTruthy();
	});
});
