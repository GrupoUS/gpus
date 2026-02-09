// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PipelineKanban } from './pipeline-kanban';

// Mock tRPC - LeadForm inside PipelineKanban uses trpc
vi.mock('@/lib/trpc', () => ({
	trpc: {
		leads: {
			create: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) },
			updateStage: { useMutation: () => ({ mutateAsync: vi.fn() }) },
		},
		users: {
			listSystemUsers: { useQuery: () => ({ data: [] }) },
		},
	},
}));

// Mock Clerk auth
vi.mock('@clerk/clerk-react', () => ({
	useAuth: () => ({ isSignedIn: true, userId: 'test-user' }),
	useUser: () => ({ user: { id: 'test-user' } }),
}));

// Mock sonner
vi.mock('sonner', () => ({
	toast: { success: vi.fn(), error: vi.fn() },
}));

// Mock Framer Motion to avoid animation issues in tests
// biome-ignore lint/suspicious/noExplicitAny: test mock
function stripMotionProps(props: any): Record<string, unknown> {
	const {
		animate,
		initial,
		exit,
		transition,
		variants,
		whileHover,
		whileTap,
		whileDrag,
		layout,
		layoutId,
		layoutScroll,
		drag,
		dragConstraints,
		dragElastic,
		dragMomentum,
		dragTransition,
		onDrag,
		onDragStart,
		onDragEnd,
		onReorder,
		onHoverStart,
		onHoverEnd,
		axis,
		values,
		value,
		...domProps
	} = props;

	return domProps;
}

vi.mock('framer-motion', () => ({
	motion: {
		// biome-ignore lint/suspicious/noExplicitAny: test mock
		div: ({ children, ...props }: any) => (
			<div {...(stripMotionProps(props) as React.ComponentProps<'div'>)}>{children}</div>
		),
		// biome-ignore lint/suspicious/noExplicitAny: test mock
		button: ({ children, ...props }: any) => (
			<button {...(stripMotionProps(props) as React.ComponentProps<'button'>)}>{children}</button>
		),
		// biome-ignore lint/suspicious/noExplicitAny: test mock
		span: ({ children, ...props }: any) => (
			<span {...(stripMotionProps(props) as React.ComponentProps<'span'>)}>{children}</span>
		),
		create:
			// biome-ignore lint/suspicious/noExplicitAny: test mock
			(Component: React.ElementType) => (props: any) => (
				<Component {...(stripMotionProps(props) as React.ComponentProps<typeof Component>)} />
			),
	},
	Reorder: {
		// biome-ignore lint/suspicious/noExplicitAny: test mock
		Group: ({ children, ...props }: any) => (
			<div {...(stripMotionProps(props) as React.ComponentProps<'div'>)}>{children}</div>
		),
		// biome-ignore lint/suspicious/noExplicitAny: test mock
		Item: ({ children, ...props }: any) => (
			<div {...(stripMotionProps(props) as React.ComponentProps<'div'>)}>{children}</div>
		),
	},
	AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
	LayoutGroup: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock FlipButton components
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
global.ResizeObserver = vi.fn().mockImplementation(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));

describe('PipelineKanban', () => {
	const mockLeads: React.ComponentProps<typeof PipelineKanban>['leads'] = [
		{
			id: '1',
			name: 'Lead 1',
			phone: '123456789',
			stage: 'novo',
			temperature: 'quente',
		},
		{
			id: '2',
			name: 'Lead 2',
			phone: '987654321',
			stage: 'novo',
			temperature: 'frio',
		},
		{
			id: '3',
			name: 'Lead 3',
			phone: '555555555',
			stage: 'qualificado',
			temperature: 'morno',
		},
	];

	const mockOnDragEnd = vi.fn();
	const mockOnLeadClick = vi.fn();

	beforeEach(() => {
		vi.clearAllMocks();
	});

	it('renders correctly with leads', () => {
		render(
			<PipelineKanban leads={mockLeads} onDragEnd={mockOnDragEnd} onLeadClick={mockOnLeadClick} />,
		);

		expect(screen.getByText('Lead 1')).toBeDefined();
		expect(screen.getByText('Lead 2')).toBeDefined();
		expect(screen.getByText('Lead 3')).toBeDefined();
		expect(screen.getByText('Novo')).toBeDefined();
		expect(screen.getByText('Qualificado')).toBeDefined();
	});

	it('calls onLeadClick when a lead is clicked', () => {
		render(
			<PipelineKanban leads={mockLeads} onDragEnd={mockOnDragEnd} onLeadClick={mockOnLeadClick} />,
		);

		const openButtons = screen.getAllByLabelText('Abrir lead');
		fireEvent.click(openButtons[0]);

		expect(mockOnLeadClick).toHaveBeenCalledWith(1);
	});

	it('shows empty placeholders for columns without leads', () => {
		render(<PipelineKanban leads={[]} onDragEnd={mockOnDragEnd} onLeadClick={mockOnLeadClick} />);

		const placeholders = screen.getAllByText('Arraste para cá');
		expect(placeholders).toHaveLength(6);
	});

	it('opens WhatsApp without triggering lead click', () => {
		const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

		render(
			<PipelineKanban leads={mockLeads} onDragEnd={mockOnDragEnd} onLeadClick={mockOnLeadClick} />,
		);

		const whatsappButtons = screen.getAllByRole('button', { name: 'WhatsApp' });
		fireEvent.click(whatsappButtons[0]);

		expect(openSpy).toHaveBeenCalledWith('https://wa.me/123456789', '_blank');
		expect(mockOnLeadClick).not.toHaveBeenCalled();

		openSpy.mockRestore();
	});
});
