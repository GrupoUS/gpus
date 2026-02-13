import {
	Action as AlertDialogActionPrimitive,
	Cancel as AlertDialogCancelPrimitive,
	Content as AlertDialogContentPrimitive,
	Description as AlertDialogDescriptionPrimitive,
	Overlay as AlertDialogOverlayPrimitive,
	Portal as AlertDialogPortalPrimitive,
	Root as AlertDialogRoot,
	Title as AlertDialogTitlePrimitive,
	Trigger as AlertDialogTriggerPrimitive,
} from '@radix-ui/react-alert-dialog';
import type { ComponentPropsWithoutRef, ElementRef, HTMLAttributes } from 'react';
import { forwardRef } from 'react';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const AlertDialog = AlertDialogRoot;

const AlertDialogTrigger = AlertDialogTriggerPrimitive;

const AlertDialogPortal = AlertDialogPortalPrimitive;

const AlertDialogOverlay = forwardRef<
	ElementRef<typeof AlertDialogOverlayPrimitive>,
	ComponentPropsWithoutRef<typeof AlertDialogOverlayPrimitive>
>(({ className, ...props }, ref) => (
	<AlertDialogOverlayPrimitive
		className={cn(
			'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80 data-[state=closed]:animate-out data-[state=open]:animate-in',
			className,
		)}
		{...props}
		ref={ref}
	/>
));
AlertDialogOverlay.displayName = AlertDialogOverlayPrimitive.displayName;

const AlertDialogContent = forwardRef<
	ElementRef<typeof AlertDialogContentPrimitive>,
	ComponentPropsWithoutRef<typeof AlertDialogContentPrimitive>
>(({ className, ...props }, ref) => (
	<AlertDialogPortal>
		<AlertDialogOverlay />
		<AlertDialogContentPrimitive
			className={cn(
				'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] fixed top-[50%] left-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=closed]:animate-out data-[state=open]:animate-in sm:rounded-lg',
				className,
			)}
			ref={ref}
			{...props}
		/>
	</AlertDialogPortal>
));
AlertDialogContent.displayName = AlertDialogContentPrimitive.displayName;

const AlertDialogHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
	<div className={cn('flex flex-col space-y-2 text-center sm:text-left', className)} {...props} />
);
AlertDialogHeader.displayName = 'AlertDialogHeader';

const AlertDialogFooter = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => (
	<div
		className={cn('flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2', className)}
		{...props}
	/>
);
AlertDialogFooter.displayName = 'AlertDialogFooter';

const AlertDialogTitle = forwardRef<
	ElementRef<typeof AlertDialogTitlePrimitive>,
	ComponentPropsWithoutRef<typeof AlertDialogTitlePrimitive>
>(({ className, ...props }, ref) => (
	<AlertDialogTitlePrimitive
		className={cn('font-semibold text-lg', className)}
		ref={ref}
		{...props}
	/>
));
AlertDialogTitle.displayName = AlertDialogTitlePrimitive.displayName;

const AlertDialogDescription = forwardRef<
	ElementRef<typeof AlertDialogDescriptionPrimitive>,
	ComponentPropsWithoutRef<typeof AlertDialogDescriptionPrimitive>
>(({ className, ...props }, ref) => (
	<AlertDialogDescriptionPrimitive
		className={cn('text-muted-foreground text-sm', className)}
		ref={ref}
		{...props}
	/>
));
AlertDialogDescription.displayName = AlertDialogDescriptionPrimitive.displayName;

const AlertDialogAction = forwardRef<
	ElementRef<typeof AlertDialogActionPrimitive>,
	ComponentPropsWithoutRef<typeof AlertDialogActionPrimitive>
>(({ className, ...props }, ref) => (
	<AlertDialogActionPrimitive className={cn(buttonVariants(), className)} ref={ref} {...props} />
));
AlertDialogAction.displayName = AlertDialogActionPrimitive.displayName;

const AlertDialogCancel = forwardRef<
	ElementRef<typeof AlertDialogCancelPrimitive>,
	ComponentPropsWithoutRef<typeof AlertDialogCancelPrimitive>
>(({ className, ...props }, ref) => (
	<AlertDialogCancelPrimitive
		className={cn(buttonVariants({ variant: 'outline' }), 'mt-2 sm:mt-0', className)}
		ref={ref}
		{...props}
	/>
));
AlertDialogCancel.displayName = AlertDialogCancelPrimitive.displayName;

export {
	AlertDialog,
	AlertDialogPortal,
	AlertDialogOverlay,
	AlertDialogTrigger,
	AlertDialogContent,
	AlertDialogHeader,
	AlertDialogFooter,
	AlertDialogTitle,
	AlertDialogDescription,
	AlertDialogAction,
	AlertDialogCancel,
};
