'use client';

import {
	Fallback as AvatarFallbackPrimitive,
	Image as AvatarImagePrimitive,
	Root as AvatarRoot,
} from '@radix-ui/react-avatar';
import type { ComponentPropsWithoutRef, ElementRef } from 'react';
import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

const Avatar = forwardRef<
	ElementRef<typeof AvatarRoot>,
	ComponentPropsWithoutRef<typeof AvatarRoot>
>(({ className, ...props }, ref) => (
	<AvatarRoot
		className={cn('relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full', className)}
		ref={ref}
		{...props}
	/>
));
Avatar.displayName = AvatarRoot.displayName;

const AvatarImage = forwardRef<
	ElementRef<typeof AvatarImagePrimitive>,
	ComponentPropsWithoutRef<typeof AvatarImagePrimitive>
>(({ className, ...props }, ref) => (
	<AvatarImagePrimitive
		className={cn('aspect-square h-full w-full', className)}
		ref={ref}
		{...props}
	/>
));
AvatarImage.displayName = AvatarImagePrimitive.displayName;

const AvatarFallback = forwardRef<
	ElementRef<typeof AvatarFallbackPrimitive>,
	ComponentPropsWithoutRef<typeof AvatarFallbackPrimitive>
>(({ className, ...props }, ref) => (
	<AvatarFallbackPrimitive
		className={cn(
			'flex h-full w-full items-center justify-center rounded-full bg-muted',
			className,
		)}
		ref={ref}
		{...props}
	/>
));
AvatarFallback.displayName = AvatarFallbackPrimitive.displayName;

export { Avatar, AvatarImage, AvatarFallback };
