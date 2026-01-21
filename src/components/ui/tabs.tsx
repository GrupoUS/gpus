import {
	Content as TabsContentPrimitive,
	List as TabsListPrimitive,
	Root as TabsRoot,
	Trigger as TabsTriggerPrimitive,
} from '@radix-ui/react-tabs';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';
import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

const Tabs = TabsRoot;

const TabsList = forwardRef<
	ElementRef<typeof TabsListPrimitive>,
	ComponentPropsWithoutRef<typeof TabsListPrimitive>
>(({ className, ...props }, ref) => (
	<TabsListPrimitive
		className={cn(
			'inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground',
			className,
		)}
		ref={ref}
		{...props}
	/>
));
TabsList.displayName = TabsListPrimitive.displayName;

const TabsTrigger = forwardRef<
	ElementRef<typeof TabsTriggerPrimitive>,
	ComponentPropsWithoutRef<typeof TabsTriggerPrimitive>
>(({ className, ...props }, ref) => (
	<TabsTriggerPrimitive
		className={cn(
			'inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 font-medium text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow',
			className,
		)}
		ref={ref}
		{...props}
	/>
));
TabsTrigger.displayName = TabsTriggerPrimitive.displayName;

const TabsContent = forwardRef<
	ElementRef<typeof TabsContentPrimitive>,
	ComponentPropsWithoutRef<typeof TabsContentPrimitive>
>(({ className, ...props }, ref) => (
	<TabsContentPrimitive
		className={cn(
			'mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
			className,
		)}
		ref={ref}
		{...props}
	/>
));
TabsContent.displayName = TabsContentPrimitive.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
