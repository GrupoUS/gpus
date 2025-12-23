// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '../theme-provider';
import { ThemeToggle } from '../theme-toggle';

// Mock icons to avoid rendering large SVGs in tests
vi.mock('lucide-react', () => ({
	Moon: () => <span data-testid="moon-icon">Moon</span>,
	Sun: () => <span data-testid="sun-icon">Sun</span>,
}));

// Mock the theme transition hook
const mockAnimateThemeChange = vi.fn(
	(_theme: string, callback: () => void, _position?: { x: number; y: number }) => {
		callback();
	},
);

vi.mock('@/lib/theme-transitions', () => ({
	useThemeTransition: () => ({
		animateThemeChange: mockAnimateThemeChange,
	}),
}));

describe('ThemeToggle', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		localStorage.clear();
	});

	const renderThemeToggle = (defaultTheme: 'light' | 'dark' = 'dark') => {
		return render(
			<ThemeProvider defaultTheme={defaultTheme} storageKey="test-theme">
				<ThemeToggle />
			</ThemeProvider>,
		);
	};

	describe('Rendering', () => {
		it('renders the toggle button', () => {
			renderThemeToggle();
			expect(screen.getByRole('button')).toBeInTheDocument();
		});

		it('renders with accessible label in Portuguese when dark', () => {
			renderThemeToggle('dark');
			expect(screen.getByRole('button', { name: /alternar para tema claro/i })).toBeInTheDocument();
		});

		it('renders with accessible label in Portuguese when light', () => {
			renderThemeToggle('light');
			expect(
				screen.getByRole('button', { name: /alternar para tema escuro/i }),
			).toBeInTheDocument();
		});

		it('renders sun and moon icons in the button', () => {
			renderThemeToggle();
			expect(screen.getByTestId('sun-icon')).toBeInTheDocument();
			expect(screen.getByTestId('moon-icon')).toBeInTheDocument();
		});

		it('renders correctly with container', () => {
			const { container } = renderThemeToggle();
			expect(container).toBeTruthy();
		});
	});

	describe('Toggle Behavior', () => {
		it('toggles from dark to light when clicked', () => {
			renderThemeToggle('dark');

			const button = screen.getByRole('button');
			fireEvent.click(button, { clientX: 100, clientY: 200 });

			expect(mockAnimateThemeChange).toHaveBeenCalledWith(
				'light',
				expect.any(Function),
				expect.objectContaining({ x: 100, y: 200 }),
			);
		});

		it('toggles from light to dark when clicked', () => {
			renderThemeToggle('light');

			const button = screen.getByRole('button');
			fireEvent.click(button, { clientX: 150, clientY: 250 });

			expect(mockAnimateThemeChange).toHaveBeenCalledWith(
				'dark',
				expect.any(Function),
				expect.objectContaining({ x: 150, y: 250 }),
			);
		});
	});

	describe('Click Coordinates', () => {
		it('passes click coordinates to animateThemeChange', () => {
			renderThemeToggle('light');

			const button = screen.getByRole('button');
			fireEvent.click(button, { clientX: 100, clientY: 200 });

			expect(mockAnimateThemeChange).toHaveBeenCalledWith(
				'dark',
				expect.any(Function),
				expect.objectContaining({ x: 100, y: 200 }),
			);
		});
	});

	describe('Theme Persistence', () => {
		it('saves theme to localStorage when toggled', () => {
			renderThemeToggle('light');

			const button = screen.getByRole('button');
			fireEvent.click(button);

			expect(localStorage.getItem('test-theme')).toBe('dark');
		});

		it('alternates theme correctly on multiple clicks', () => {
			renderThemeToggle('dark');

			const button = screen.getByRole('button');

			// First click: dark -> light
			fireEvent.click(button);
			expect(localStorage.getItem('test-theme')).toBe('light');

			// Second click: light -> dark
			fireEvent.click(button);
			expect(localStorage.getItem('test-theme')).toBe('dark');
		});
	});

	describe('Accessibility', () => {
		it('is keyboard accessible', () => {
			renderThemeToggle('dark');
			const button = screen.getByRole('button');
			expect(button).toBeVisible();
			expect(button).not.toBeDisabled();
		});

		it('has aria-label that updates with theme', () => {
			const { rerender } = render(
				<ThemeProvider defaultTheme="dark" storageKey="test-theme">
					<ThemeToggle />
				</ThemeProvider>,
			);

			expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Alternar para tema claro');

			// Toggle theme
			fireEvent.click(screen.getByRole('button'));

			rerender(
				<ThemeProvider defaultTheme="light" storageKey="test-theme">
					<ThemeToggle />
				</ThemeProvider>,
			);

			expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Alternar para tema escuro');
		});
	});
});
