// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LeadForm } from './lead-form';

// Mock dependencies
vi.mock('convex/react', () => ({
	useMutation: vi.fn(),
}));

vi.mock('sonner', () => ({
	toast: {
		success: vi.fn(),
		error: vi.fn(),
	},
}));

// Mock FlipButton components to avoid complex animations in tests
vi.mock('@/components/ui/flip-button', async () => {
	const React = await import('react');
	return {
		FlipButton: React.forwardRef(
			(
				{ children, className, initial, ...props }: React.ComponentProps<'div'> & { initial?: any },
				ref: React.Ref<HTMLDivElement>,
			) => (
				<div
					ref={ref}
					className={className}
					{...props}
					role="button"
					tabIndex={0}
					onKeyDown={() => {}}
				>
					{children}
				</div>
			),
		),
		FlipButtonFront: ({ children, className }: React.ComponentProps<'div'>) => (
			<div className={className} data-testid="flip-front">
				{children}
			</div>
		),
		FlipButtonBack: ({ children, className }: React.ComponentProps<'div'>) => (
			<div className={className} data-testid="flip-back">
				{children}
			</div>
		),
	};
});

// Mock HoverBorderGradient
vi.mock('@/components/ui/hover-border-gradient', () => ({
	HoverBorderGradient: ({
		children,
		className,
		containerClassName,
		clockwise,
		...props
	}: React.ComponentProps<'div'> & { containerClassName?: string; clockwise?: boolean }) => (
		<div className={className} {...props}>
			{children}
		</div>
	),
}));

// Mock matchMedia for Radix UI (Dialog often uses it)
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

// Mock ResizeObserver
class ResizeObserver {
	observe = vi.fn();
	unobserve = vi.fn();
	disconnect = vi.fn();
}
global.ResizeObserver = ResizeObserver;
window.ResizeObserver = ResizeObserver;

describe('LeadForm', () => {
	const mockCreateLead = vi.fn();

	beforeEach(async () => {
		vi.clearAllMocks();
		const { useMutation } = await import('convex/react');
		(useMutation as unknown as ReturnType<typeof vi.fn>).mockReturnValue(mockCreateLead);
	});

	it('renders the trigger button correctly', () => {
		render(<LeadForm />);
		expect(screen.getByText('Novo Lead')).toBeDefined();
		expect(screen.getByText('Cadastrar')).toBeDefined();
	});

	it('opens the dialog when clicked', async () => {
		const user = userEvent.setup();
		render(<LeadForm />);

		// Use the role button from our mock
		const triggers = screen.getAllByRole('button');
		const trigger = triggers[0]; // The first one is the flip button container
		await user.click(trigger);

		await waitFor(() => {
			expect(screen.getByRole('dialog')).toBeDefined();
			expect(screen.getByText('Nome Completo')).toBeDefined();
		});
	});

	it('validates required fields', async () => {
		const user = userEvent.setup();
		render(<LeadForm />);

		const triggers = screen.getAllByRole('button');
		await user.click(triggers[0]);

		await waitFor(() => screen.getByRole('dialog'));

		// Submit empty form
		const submitBtn = screen.getByRole('button', { name: 'Criar Lead' });
		await user.click(submitBtn);

		await waitFor(() => {
			expect(screen.getByText('Nome deve ter pelo menos 2 caracteres')).toBeDefined();
			expect(screen.getByText('Telefone inválido')).toBeDefined();
		});
	});

	it('submits valid form data', async () => {
		const user = userEvent.setup();
		mockCreateLead.mockResolvedValue({ _id: '123' });

		render(<LeadForm />);

		const triggers = screen.getAllByRole('button');
		await user.click(triggers[0]);
		await waitFor(() => screen.getByRole('dialog'));

		// Fill fields
		const nameInput = screen.getByPlaceholderText('Ex: João Silva');
		const phoneInput = screen.getByPlaceholderText('Ex: 11999999999');

		await user.type(nameInput, 'Test User');
		await user.type(phoneInput, '11999999999');

		// Submit
		const submitBtn = screen.getByRole('button', { name: 'Criar Lead' });
		await user.click(submitBtn);

		await waitFor(() => {
			expect(mockCreateLead).toHaveBeenCalledWith(
				expect.objectContaining({
					name: 'Test User',
					phone: '11999999999',
					source: 'instagram',
					temperature: 'frio',
					stage: 'novo',
				}),
			);
		});
	});

	it('handles optional clinic fields', async () => {
		const user = userEvent.setup();
		render(<LeadForm />);

		const triggers = screen.getAllByRole('button');
		await user.click(triggers[0]);
		await waitFor(() => screen.getByRole('dialog'));

		// Check "hasClinic"
		const hasClinicCheckbox = screen.getByRole('checkbox');
		await user.click(hasClinicCheckbox);

		// Now clinic fields should be visible
		await waitFor(() => {
			expect(screen.getByText('Nome da Clínica')).toBeDefined();
		});

		// Try to submit without clinic name (should fail validation)
		await user.type(screen.getByPlaceholderText('Ex: João Silva'), 'Test User');
		await user.type(screen.getByPlaceholderText('Ex: 11999999999'), '11999999999');

		await user.click(screen.getByRole('button', { name: 'Criar Lead' }));

		await waitFor(() => {
			expect(screen.getByText('Nome da clínica é obrigatório')).toBeDefined();
		});

		// Fill clinic name
		await user.type(screen.getByPlaceholderText('Ex: Clínica Estética Bella'), 'My Clinic');

		await user.click(screen.getByRole('button', { name: 'Criar Lead' }));

		await waitFor(() => {
			expect(mockCreateLead).toHaveBeenCalledWith(
				expect.objectContaining({
					hasClinic: true,
					clinicName: 'My Clinic',
				}),
			);
		});
	});

	it('handles submission error', async () => {
		const user = userEvent.setup();
		const { toast } = await import('sonner');
		mockCreateLead.mockRejectedValue(new Error('API Error'));

		render(<LeadForm />);

		const triggers = screen.getAllByRole('button');
		await user.click(triggers[0]);
		await waitFor(() => screen.getByRole('dialog'));

		await user.type(screen.getByPlaceholderText('Ex: João Silva'), 'Test User');
		await user.type(screen.getByPlaceholderText('Ex: 11999999999'), '11999999999');

		await user.click(screen.getByRole('button', { name: 'Criar Lead' }));

		await waitFor(() => {
			expect(toast.error).toHaveBeenCalledWith('Erro ao criar lead: API Error');
		});
	});
});
