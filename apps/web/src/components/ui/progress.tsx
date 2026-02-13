import {
	Indicator as ProgressIndicatorPrimitive,
	Root as ProgressRoot,
} from '@radix-ui/react-progress';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';
import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

const Progress = forwardRef<
	ElementRef<typeof ProgressRoot>,
	ComponentPropsWithoutRef<typeof ProgressRoot>
>(({ className, value, ...props }, ref) => (
	<ProgressRoot
		className={cn('relative h-2 w-full overflow-hidden rounded-full bg-primary/20', className)}
		ref={ref}
		{...props}
	>
		<ProgressIndicatorPrimitive
			className="h-full w-full flex-1 bg-primary transition-all"
			style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
		/>
	</ProgressRoot>
));
Progress.displayName = ProgressRoot.displayName;

export { Progress };
