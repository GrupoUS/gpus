// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PipelineKanban } from './pipeline-kanban';

// Mock Framer Motion to avoid animation issues in tests
type UnknownProps = Record<string, unknown>;

function stripMotionProps<T extends UnknownProps>(props: T): UnknownProps {
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
		div: ({ children, ...props }: { children?: React.ReactNode } & UnknownProps) => (
			<div {...(stripMotionProps(props) as React.ComponentProps<'div'>)}>{children}</div>
		),
		button: ({ children, ...props }: { children?: React.ReactNode } & UnknownProps) => (
			<button {...(stripMotionProps(props) as React.ComponentProps<'button'>)}>{children}</button>
		),
		span: ({ children, ...props }: { children?: React.ReactNode } & UnknownProps) => (
			<span {...(stripMotionProps(props) as React.ComponentProps<'span'>)}>{children}</span>
		),
		create:
			(Component: React.ElementType) =>
			(props: React.ComponentProps<typeof Component> & UnknownProps) => (
				<Component
					{...(stripMotionProps(props as UnknownProps) as React.ComponentProps<typeof Component>)}
				/>
			),
	},
	Reorder: {
		Group: ({ children, ...props }: { children?: React.ReactNode } & UnknownProps) => (
			<div {...(stripMotionProps(props) as React.ComponentProps<'div'>)}>{children}</div>
		),
		Item: ({ children, ...props }: { children?: React.ReactNode } & UnknownProps) => (
			<div {...(stripMotionProps(props) as React.ComponentProps<'div'>)}>{children}</div>
		),
	},
	AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
	LayoutGroup: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('convex/react', () => ({
	useMutation: () => vi.fn(),
	useQuery: () => null,
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
			_id: '1',
			name: 'Lead 1',
			phone: '123456789',
			stage: 'novo',
			temperature: 'quente',
		},
		{
			_id: '2',
			name: 'Lead 2',
			phone: '987654321',
			stage: 'novo',
			temperature: 'frio',
		},
		{
			_id: '3',
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

		// Click the overlay button for the first lead (updated for a11y fix)
		const openButtons = screen.getAllByLabelText('Abrir lead');
		fireEvent.click(openButtons[0]);

		expect(mockOnLeadClick).toHaveBeenCalledWith('1');
	});

	// Note: Testing actual drag and drop with Framer Motion in JSDOM is difficult
	// without extensive mocking of pointer events and layout system.
	// We verify the component structure and interactions instead.
});
