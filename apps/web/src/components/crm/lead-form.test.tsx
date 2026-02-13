// @vitest-environment jsdom
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { LeadForm } from './lead-form';

const mockMutateAsync = vi.fn();

// Mock tRPC
vi.mock('@/lib/trpc', () => ({
	trpc: {
		leads: {
			create: {
				useMutation: () => ({ mutateAsync: mockMutateAsync, isPending: false }),
			},
			get: { useQuery: () => ({ data: null }) },
			list: { useQuery: () => ({ data: [] }) },
			search: { useQuery: () => ({ data: [] }) },
		},
		users: {
			listSystemUsers: { useQuery: () => ({ data: [] }) },
		},
		tags: {
			getLeadTags: { useQuery: () => ({ data: [] }) },
		},
		customFields: {
			list: { useQuery: () => ({ data: [] }) },
		},
	},
}));

// Mock Clerk
vi.mock('@clerk/clerk-react', () => ({
	useAuth: () => ({ isSignedIn: true, userId: 'test-user' }),
	useUser: () => ({ user: { id: 'test-user' } }),
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
				// biome-ignore lint/suspicious/noExplicitAny: test mock
				{ children, className, initial: _initial, ...props }: any,
				ref: React.Ref<HTMLButtonElement>,
			) => (
				<button className={className} ref={ref} {...props} type="button">
					{children}
				</button>
			),
		),
		// biome-ignore lint/suspicious/noExplicitAny: test mock
		FlipButtonFront: ({ children, className }: any) => (
			<div className={className} data-testid="flip-front">
				{children}
			</div>
		),
		// biome-ignore lint/suspicious/noExplicitAny: test mock
		FlipButtonBack: ({ children, className }: any) => (
			<div className={className} data-testid="flip-back">
				{children}
			</div>
		),
	};
});

// Mock HoverBorderGradient
vi.mock('@/components/ui/hover-border-gradient', () => ({
	// biome-ignore lint/suspicious/noExplicitAny: test mock
	HoverBorderGradient: ({ children, className, ...props }: any) => (
		<div className={className} {...props}>
			{children}
		</div>
	),
}));

// Mock ResizeObserver
class ResizeObserverMock {
	observe = vi.fn();
	unobserve = vi.fn();
	disconnect = vi.fn();
}
global.ResizeObserver = ResizeObserverMock;
window.ResizeObserver = ResizeObserverMock;

// Mock PointerEvent for Radix UI
// @ts-expect-error - minimal PointerEvent mock for tests
window.PointerEvent = class PointerEvent extends Event {
	button: number;
	ctrlKey: boolean;
	metaKey: boolean;
	shiftKey: boolean;
	constructor(type: string, props: PointerEventInit) {
		super(type, props);
		this.button = props.button || 0;
		this.ctrlKey = props.ctrlKey ?? false;
		this.metaKey = props.metaKey ?? false;
		this.shiftKey = props.shiftKey ?? false;
	}
};
window.HTMLElement.prototype.scrollIntoView = vi.fn();
window.HTMLElement.prototype.releasePointerCapture = vi.fn();
window.HTMLElement.prototype.hasPointerCapture = vi.fn();

describe('LeadForm', () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders the trigger button correctly', () => {
		render(<LeadForm />);
		expect(screen.getByText('Novo Lead')).toBeDefined();
		expect(screen.getByText('Cadastrar')).toBeDefined();
	});

	it('opens the dialog when clicked', async () => {
		const user = userEvent.setup();
		render(<LeadForm />);

		const triggers = screen.getAllByRole('button');
		const trigger = triggers[0];
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
		mockMutateAsync.mockResolvedValue({ id: 123 });

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
			expect(mockMutateAsync).toHaveBeenCalledWith(
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

	it('handles submission error', async () => {
		const user = userEvent.setup();
		const { toast } = await import('sonner');
		mockMutateAsync.mockRejectedValue(new Error('API Error'));

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
