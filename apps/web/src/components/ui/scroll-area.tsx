import { Corner, Root, Scrollbar, Thumb, Viewport } from '@radix-ui/react-scroll-area';
import { type ComponentPropsWithoutRef, type ElementRef, forwardRef } from 'react';

import { cn } from '@/lib/utils';

const ScrollArea = forwardRef<ElementRef<typeof Root>, ComponentPropsWithoutRef<typeof Root>>(
	({ className, children, ...props }, ref) => (
		<Root className={cn('relative overflow-hidden', className)} ref={ref} {...props}>
			<Viewport className="h-full w-full rounded-[inherit]">{children}</Viewport>
			<ScrollBar />
			<Corner />
		</Root>
	),
);
ScrollArea.displayName = Root.displayName;

const ScrollBar = forwardRef<
	ElementRef<typeof Scrollbar>,
	ComponentPropsWithoutRef<typeof Scrollbar>
>(({ className, orientation = 'vertical', ...props }, ref) => (
	<Scrollbar
		className={cn(
			'flex touch-none select-none transition-colors',
			orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent p-[1px]',
			orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent p-[1px]',
			className,
		)}
		orientation={orientation}
		ref={ref}
		{...props}
	>
		<Thumb className="relative flex-1 rounded-full bg-border" />
	</Scrollbar>
));
ScrollBar.displayName = Scrollbar.displayName;

export { ScrollArea, ScrollBar };
