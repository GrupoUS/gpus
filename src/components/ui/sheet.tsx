'use client';

import {
	Close,
	Content,
	Description,
	Overlay,
	Portal,
	Root,
	Title,
	Trigger,
} from '@radix-ui/react-dialog';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, type Transition } from 'framer-motion';
import { X } from 'lucide-react';
import {
	type ComponentPropsWithoutRef,
	type CSSProperties,
	type ElementRef,
	forwardRef,
	type HTMLAttributes,
} from 'react';

import { cn } from '@/lib/utils';

const Sheet = Root;

const SheetTrigger = Trigger;

const SheetClose = Close;

const SheetPortal = Portal;

const SheetOverlay = forwardRef<
	ElementRef<typeof Overlay>,
	ComponentPropsWithoutRef<typeof Overlay>
>(({ className, ...props }, ref) => (
	<Overlay
		className={cn(
			'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 data-[state=closed]:animate-out data-[state=open]:animate-in',
			className,
		)}
		{...props}
		ref={ref}
	/>
));
SheetOverlay.displayName = Overlay.displayName;

const sheetVariants = cva('fixed z-50 gap-4 bg-background p-6 shadow-lg', {
	variants: {
		side: {
			top: 'inset-x-0 top-0 border-b',
			bottom: 'inset-x-0 bottom-0 border-t',
			left: 'inset-y-0 left-0 h-full w-3/4 border-r sm:max-w-sm',
			right: 'inset-y-0 right-0 h-full w-3/4 border-l sm:max-w-sm',
		},
	},
	defaultVariants: {
		side: 'right',
	},
});

const sheetMotionVariants = {
	top: {
		initial: { y: '-100%' },
		animate: { y: 0 },
		exit: { y: '-100%' },
	},
	bottom: {
		initial: { y: '100%' },
		animate: { y: 0 },
		exit: { y: '100%' },
	},
	left: {
		initial: { x: '-100%' },
		animate: { x: 0 },
		exit: { x: '-100%' },
	},
	right: {
		initial: { x: '100%' },
		animate: { x: 0 },
		exit: { x: '100%' },
	},
};

interface SheetContentProps
	extends Omit<
			ComponentPropsWithoutRef<typeof Content>,
			'onAnimationStart' | 'onDrag' | 'onDragEnd' | 'onDragStart'
		>,
		VariantProps<typeof sheetVariants> {
	showCloseButton?: boolean;
	style?: CSSProperties;
	transition?: Transition;
}

const SheetContent = forwardRef<ElementRef<typeof Content>, SheetContentProps>(
	(
		{ side = 'right', className, children, showCloseButton = true, style, transition, ...props },
		ref,
	) => {
		const motionVariants = sheetMotionVariants[side || 'right'];
		const defaultTransition: Transition = { type: 'spring', stiffness: 150, damping: 22 };

		// Extract motion props to avoid conflicts
		const { onEscapeKeyDown, onPointerDownOutside, onInteractOutside, ...restProps } = props;

		return (
			<SheetPortal>
				<SheetOverlay />
				<Content
					onEscapeKeyDown={onEscapeKeyDown}
					onInteractOutside={onInteractOutside}
					onPointerDownOutside={onPointerDownOutside}
					ref={ref}
					{...restProps}
				>
					<motion.div
						animate={motionVariants.animate}
						className={cn(sheetVariants({ side }), className)}
						exit={motionVariants.exit}
						initial={motionVariants.initial}
						style={style}
						transition={transition || defaultTransition}
					>
						{children}
						{showCloseButton && (
							<Close className="absolute top-4 right-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-secondary">
								<X className="h-4 w-4" />
								<span className="sr-only">Close</span>
							</Close>
						)}
					</motion.div>
				</Content>
			</SheetPortal>
		);
	},
);
SheetContent.displayName = Content.displayName;

const SheetHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
	<div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
);
SheetHeader.displayName = 'SheetHeader';

const SheetFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
		{...props}
	/>
);
SheetFooter.displayName = 'SheetFooter';

const SheetTitle = forwardRef<ElementRef<typeof Title>, ComponentPropsWithoutRef<typeof Title>>(
	({ className, ...props }, ref) => (
		<Title
			className={cn('font-semibold text-foreground text-lg', className)}
			ref={ref}
			{...props}
		/>
	),
);
SheetTitle.displayName = Title.displayName;

const SheetDescription = forwardRef<
	ElementRef<typeof Description>,
	ComponentPropsWithoutRef<typeof Description>
>(({ className, ...props }, ref) => (
	<Description className={cn('text-muted-foreground text-sm', className)} ref={ref} {...props} />
));
SheetDescription.displayName = Description.displayName;

export {
	Sheet,
	SheetPortal,
	SheetOverlay,
	SheetTrigger,
	SheetClose,
	SheetContent,
	SheetHeader,
	SheetFooter,
	SheetTitle,
	SheetDescription,
};
