'use client';

import {
	Indicator as RadioGroupIndicatorPrimitive,
	Item as RadioGroupItemPrimitive,
	Root as RadioGroupRoot,
} from '@radix-ui/react-radio-group';
import { Circle } from 'lucide-react';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';
import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

const RadioGroup = forwardRef<
	ElementRef<typeof RadioGroupRoot>,
	ComponentPropsWithoutRef<typeof RadioGroupRoot>
>(({ className, ...props }, ref) => (
	<RadioGroupRoot className={cn('grid gap-2', className)} {...props} ref={ref} />
));
RadioGroup.displayName = RadioGroupRoot.displayName;

const RadioGroupItem = forwardRef<
	ElementRef<typeof RadioGroupItemPrimitive>,
	ComponentPropsWithoutRef<typeof RadioGroupItemPrimitive>
>(({ className, ...props }, ref) => (
	<RadioGroupItemPrimitive
		className={cn(
			'aspect-square h-4 w-4 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
			className,
		)}
		ref={ref}
		{...props}
	>
		<RadioGroupIndicatorPrimitive className="flex items-center justify-center">
			<Circle className="h-2.5 w-2.5 fill-current text-current" />
		</RadioGroupIndicatorPrimitive>
	</RadioGroupItemPrimitive>
));
RadioGroupItem.displayName = RadioGroupItemPrimitive.displayName;

export { RadioGroup, RadioGroupItem };
