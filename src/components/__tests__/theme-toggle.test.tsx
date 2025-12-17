// @vitest-environment jsdom
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ThemeProvider } from '../theme-provider';
import { ThemeToggle } from '../theme-toggle';

// Mock icons to avoid rendering large SVGs in tests
vi.mock('lucide-react', () => ({
	Moon: () => <span data-testid="moon-icon">Moon</span>,
	Sun: () => <span data-testid="sun-icon">Sun</span>,
	Laptop: () => <span data-testid="laptop-icon">Laptop</span>,
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

	const renderThemeToggle = (defaultTheme: 'light' | 'dark' | 'system' = 'system') => {
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

		it('renders with accessible label', () => {
			renderThemeToggle();
			expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument();
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

	describe('Dropdown Menu Interaction', () => {
		it('opens dropdown menu when button is clicked', async () => {
			const user = userEvent.setup();
			renderThemeToggle();

			const button = screen.getByRole('button', { name: /toggle theme/i });
			await user.click(button);

			await waitFor(() => {
				expect(screen.getByRole('menu')).toBeInTheDocument();
			});
		});

		it('shows all three theme options in dropdown', async () => {
			const user = userEvent.setup();
			renderThemeToggle();

			const button = screen.getByRole('button', { name: /toggle theme/i });
			await user.click(button);

			await waitFor(() => {
				expect(screen.getByRole('menuitem', { name: /light/i })).toBeInTheDocument();
				expect(screen.getByRole('menuitem', { name: /dark/i })).toBeInTheDocument();
				expect(screen.getByRole('menuitem', { name: /system/i })).toBeInTheDocument();
			});
		});
	});

	describe('Theme Selection', () => {
		it('calls handleThemeChange with "light" when Light option is clicked', async () => {
			const user = userEvent.setup();
			renderThemeToggle('dark');

			const button = screen.getByRole('button', { name: /toggle theme/i });
			await user.click(button);

			await waitFor(() => {
				expect(screen.getByRole('menu')).toBeInTheDocument();
			});

			const lightOption = screen.getByRole('menuitem', { name: /light/i });
			await user.click(lightOption);

			expect(mockAnimateThemeChange).toHaveBeenCalledWith(
				'light',
				expect.any(Function),
				expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
			);
		});

		it('calls handleThemeChange with "dark" when Dark option is clicked', async () => {
			const user = userEvent.setup();
			renderThemeToggle('light');

			const button = screen.getByRole('button', { name: /toggle theme/i });
			await user.click(button);

			await waitFor(() => {
				expect(screen.getByRole('menu')).toBeInTheDocument();
			});

			const darkOption = screen.getByRole('menuitem', { name: /dark/i });
			await user.click(darkOption);

			expect(mockAnimateThemeChange).toHaveBeenCalledWith(
				'dark',
				expect.any(Function),
				expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
			);
		});

		it('calls handleThemeChange with "system" when System option is clicked', async () => {
			const user = userEvent.setup();
			renderThemeToggle('dark');

			const button = screen.getByRole('button', { name: /toggle theme/i });
			await user.click(button);

			await waitFor(() => {
				expect(screen.getByRole('menu')).toBeInTheDocument();
			});

			const systemOption = screen.getByRole('menuitem', { name: /system/i });
			await user.click(systemOption);

			expect(mockAnimateThemeChange).toHaveBeenCalledWith(
				'system',
				expect.any(Function),
				expect.objectContaining({ x: expect.any(Number), y: expect.any(Number) }),
			);
		});
	});

	describe('Active Theme Highlighting', () => {
		it('highlights Light option when theme is light', async () => {
			const user = userEvent.setup();
			renderThemeToggle('light');

			const button = screen.getByRole('button', { name: /toggle theme/i });
			await user.click(button);

			await waitFor(() => {
				const lightOption = screen.getByRole('menuitem', { name: /light/i });
				expect(lightOption).toHaveClass('bg-accent');
			});
		});

		it('highlights Dark option when theme is dark', async () => {
			const user = userEvent.setup();
			renderThemeToggle('dark');

			const button = screen.getByRole('button', { name: /toggle theme/i });
			await user.click(button);

			await waitFor(() => {
				const darkOption = screen.getByRole('menuitem', { name: /dark/i });
				expect(darkOption).toHaveClass('bg-accent');
			});
		});

		it('highlights System option when theme is system', async () => {
			const user = userEvent.setup();
			renderThemeToggle('system');

			const button = screen.getByRole('button', { name: /toggle theme/i });
			await user.click(button);

			await waitFor(() => {
				const systemOption = screen.getByRole('menuitem', { name: /system/i });
				expect(systemOption).toHaveClass('bg-accent');
			});
		});
	});

	describe('Click Coordinates', () => {
		it('passes click coordinates to animateThemeChange', async () => {
			const user = userEvent.setup();
			renderThemeToggle('light');

			const button = screen.getByRole('button', { name: /toggle theme/i });
			await user.click(button);

			await waitFor(() => {
				expect(screen.getByRole('menu')).toBeInTheDocument();
			});

			const darkOption = screen.getByRole('menuitem', { name: /dark/i });

			// Use fireEvent with specific coordinates after menu is open
			fireEvent.click(darkOption, { clientX: 100, clientY: 200 });

			expect(mockAnimateThemeChange).toHaveBeenCalledWith(
				'dark',
				expect.any(Function),
				expect.objectContaining({ x: 100, y: 200 }),
			);
		});
	});

	describe('Theme Persistence', () => {
		it('saves theme to localStorage when changed', async () => {
			const user = userEvent.setup();
			renderThemeToggle('light');

			const button = screen.getByRole('button', { name: /toggle theme/i });
			await user.click(button);

			await waitFor(() => {
				expect(screen.getByRole('menu')).toBeInTheDocument();
			});

			const darkOption = screen.getByRole('menuitem', { name: /dark/i });
			await user.click(darkOption);

			await waitFor(() => {
				expect(localStorage.getItem('test-theme')).toBe('dark');
			});
		});
	});

	describe('Keyboard Navigation', () => {
		it('opens dropdown with keyboard', async () => {
			const user = userEvent.setup();
			renderThemeToggle();

			const button = screen.getByRole('button', { name: /toggle theme/i });
			button.focus();
			await user.keyboard('{Enter}');

			await waitFor(() => {
				expect(screen.getByRole('menu')).toBeInTheDocument();
			});
		});
	});
});
