import {
	Content as AccordionContentPrimitive,
	Header as AccordionHeaderPrimitive,
	Item as AccordionItemPrimitive,
	Root as AccordionRoot,
	Trigger as AccordionTriggerPrimitive,
} from '@radix-ui/react-accordion';
import { ChevronDown } from 'lucide-react';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';
import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

const Accordion = AccordionRoot;

const AccordionItem = forwardRef<
	ElementRef<typeof AccordionItemPrimitive>,
	ComponentPropsWithoutRef<typeof AccordionItemPrimitive>
>(({ className, ...props }, ref) => (
	<AccordionItemPrimitive className={cn('border-b', className)} ref={ref} {...props} />
));
AccordionItem.displayName = 'AccordionItem';

const AccordionTrigger = forwardRef<
	ElementRef<typeof AccordionTriggerPrimitive>,
	ComponentPropsWithoutRef<typeof AccordionTriggerPrimitive>
>(({ className, children, ...props }, ref) => (
	<AccordionHeaderPrimitive className="flex">
		<AccordionTriggerPrimitive
			className={cn(
				'flex flex-1 items-center justify-between py-4 text-left font-medium text-sm transition-all hover:underline [&[data-state=open]>svg]:rotate-180',
				className,
			)}
			ref={ref}
			{...props}
		>
			{children}
			<ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200" />
		</AccordionTriggerPrimitive>
	</AccordionHeaderPrimitive>
));
AccordionTrigger.displayName = AccordionTriggerPrimitive.displayName;

const AccordionContent = forwardRef<
	ElementRef<typeof AccordionContentPrimitive>,
	ComponentPropsWithoutRef<typeof AccordionContentPrimitive>
>(({ className, children, ...props }, ref) => (
	<AccordionContentPrimitive
		className="overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down"
		ref={ref}
		{...props}
	>
		<div className={cn('pt-0 pb-4', className)}>{children}</div>
	</AccordionContentPrimitive>
));
AccordionContent.displayName = AccordionContentPrimitive.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
