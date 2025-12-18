'use client';

import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import type React from 'react';
import { useRef } from 'react';

import { cn } from '@/lib/utils';

interface MacbookScrollProps {
	children: React.ReactNode;
	showGradient?: boolean;
	title?: string | React.ReactNode;
	badge?: React.ReactNode;
	className?: string;
}

/**
 * MacbookScroll - Aceternity-inspired component that displays content
 * inside a MacBook frame with scroll-based 3D animations.
 *
 * Features:
 * - 3D perspective animations on scroll (scale, rotateX, opacity)
 * - Responsive design (mobile/tablet/desktop)
 * - Respects prefers-reduced-motion
 * - Optional gradient background
 */
export function MacbookScroll({
	children,
	showGradient = true,
	title,
	badge,
	className,
}: MacbookScrollProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const prefersReducedMotion = useReducedMotion();

	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ['start end', 'end start'],
	});

	// Transform values for 3D animation
	// When reduced motion is preferred, use static values
	const scale = useTransform(
		scrollYProgress,
		[0, 0.3, 0.7, 1],
		prefersReducedMotion ? [1, 1, 1, 1] : [0.85, 1, 1, 0.95],
	);

	const rotateX = useTransform(
		scrollYProgress,
		[0, 0.3, 0.7, 1],
		prefersReducedMotion ? [0, 0, 0, 0] : [15, 0, 0, 10],
	);

	const opacity = useTransform(
		scrollYProgress,
		[0, 0.2, 0.8, 1],
		prefersReducedMotion ? [1, 1, 1, 1] : [0.6, 1, 1, 0.8],
	);

	const translateY = useTransform(
		scrollYProgress,
		[0, 0.3],
		prefersReducedMotion ? [0, 0] : [40, 0],
	);

	return (
		<div
			ref={containerRef}
			className={cn('relative w-full py-8 md:py-16', className)}
			style={{ perspective: '1200px' }}
		>
			{/* Optional gradient background */}
			{showGradient && (
				<div className="absolute inset-0 -z-10">
					<div className="absolute inset-0 bg-gradient-to-b from-primary/10 via-transparent to-primary/5 rounded-3xl blur-3xl" />
				</div>
			)}

			{/* Optional title */}
			{title && (
				<motion.div style={{ opacity, y: translateY }} className="text-center mb-8 md:mb-12">
					{typeof title === 'string' ? (
						<h3 className="font-display text-2xl md:text-3xl font-bold">{title}</h3>
					) : (
						title
					)}
				</motion.div>
			)}

			{/* MacBook container with 3D transforms */}
			<motion.div
				style={{
					scale,
					rotateX,
					opacity,
					transformStyle: 'preserve-3d',
				}}
				className="relative mx-auto w-full max-w-5xl"
			>
				{/* MacBook Frame */}
				<div className="relative">
					{/* Screen bezel (outer frame) */}
					<div className="relative bg-zinc-900 dark:bg-zinc-800 rounded-t-2xl pt-4 px-4 pb-0 shadow-2xl">
						{/* Camera notch */}
						<div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-20 md:w-28 h-4 md:h-5 bg-zinc-800 dark:bg-zinc-700 rounded-b-xl flex items-center justify-center">
							<div className="w-2 h-2 md:w-2.5 md:h-2.5 rounded-full bg-zinc-700 dark:bg-zinc-600" />
						</div>

						{/* Screen area */}
						<div className="relative bg-zinc-950 rounded-lg overflow-hidden aspect-[16/10] border border-zinc-800">
							{/* Screen content */}
							<div className="absolute inset-0 overflow-auto">{children}</div>

							{/* Screen reflection overlay */}
							<div className="absolute inset-0 bg-gradient-to-br from-white/5 via-transparent to-transparent pointer-events-none" />
						</div>
					</div>

					{/* MacBook base/bottom */}
					<div className="relative">
						{/* Hinge */}
						<div className="h-2 md:h-3 bg-gradient-to-b from-zinc-800 to-zinc-900 dark:from-zinc-700 dark:to-zinc-800" />

						{/* Bottom case with trackpad area hint */}
						<div className="h-3 md:h-4 bg-zinc-900 dark:bg-zinc-800 rounded-b-xl flex items-center justify-center">
							<div className="w-16 md:w-24 h-0.5 bg-zinc-700 dark:bg-zinc-600 rounded-full" />
						</div>
					</div>

					{/* Shadow under MacBook */}
					<div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[90%] h-8 bg-black/20 dark:bg-black/40 blur-xl rounded-full" />
				</div>
			</motion.div>

			{/* Optional badge */}
			{badge && (
				<motion.div style={{ opacity }} className="mt-8 flex justify-center">
					{badge}
				</motion.div>
			)}
		</div>
	);
}

/**
 * MacbookScreenContent - Helper component to properly style content
 * that goes inside the MacBook screen.
 */
export function MacbookScreenContent({
	children,
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<div className={cn('h-full w-full bg-background p-4 md:p-6 lg:p-8', className)}>{children}</div>
	);
}
