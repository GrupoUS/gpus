'use client';

import { Root as SeparatorRoot } from '@radix-ui/react-separator';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';
import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

const Separator = forwardRef<
	ElementRef<typeof SeparatorRoot>,
	ComponentPropsWithoutRef<typeof SeparatorRoot>
>(({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
	<SeparatorRoot
		className={cn(
			'shrink-0 bg-border',
			orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
			className,
		)}
		decorative={decorative}
		orientation={orientation}
		ref={ref}
		{...props}
	/>
));
Separator.displayName = SeparatorRoot.displayName;

export { Separator };
