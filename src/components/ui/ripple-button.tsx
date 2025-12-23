'use client';

import React, { type MouseEvent } from 'react';

import { cn } from '@/lib/utils';

interface RippleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
	rippleColor?: string;
	duration?: number;
}

export const RippleButton = React.forwardRef<HTMLButtonElement, RippleButtonProps>(
	(
		{
			className,
			children,
			rippleColor = 'rgba(255, 255, 255, 0.5)',
			duration = 600,
			onClick,
			...props
		},
		ref,
	) => {
		const [ripples, setRipples] = React.useState<
			{ x: number; y: number; size: number; key: number }[]
		>([]);

		const createRipple = (event: MouseEvent<HTMLButtonElement>) => {
			const button = event.currentTarget;
			const rect = button.getBoundingClientRect();
			const size = Math.max(rect.width, rect.height);
			const x = event.clientX - rect.left - size / 2;
			const y = event.clientY - rect.top - size / 2;

			const newRipple = { x, y, size, key: Date.now() };
			setRipples((prev) => [...prev, newRipple]);
		};

		React.useEffect(() => {
			if (ripples.length > 0) {
				const lastRipple = ripples[ripples.length - 1];
				const timeout = setTimeout(() => {
					setRipples((prev) => prev.filter((ripple) => ripple.key !== lastRipple.key));
				}, duration);

				return () => clearTimeout(timeout);
			}
		}, [ripples, duration]);

		return (
			<button
				ref={ref}
				className={cn('relative overflow-hidden cursor-pointer', className)}
				onClick={(e) => {
					createRipple(e);
					onClick?.(e);
				}}
				{...props}
			>
				<span className="relative z-10">{children}</span>
				{ripples.map((ripple) => (
					<span
						key={ripple.key}
						className="absolute rounded-full pointer-events-none animate-ripple"
						style={{
							top: ripple.y,
							left: ripple.x,
							width: ripple.size,
							height: ripple.size,
							backgroundColor: rippleColor,
							transform: 'scale(0)',
							animationDuration: `${duration}ms`,
						}}
					/>
				))}
			</button>
		);
	},
);

RippleButton.displayName = 'RippleButton';
