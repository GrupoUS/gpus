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
 * - Pure CSS implementation (no external images)
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
	const scale = useTransform(
		scrollYProgress,
		[0, 0.3, 0.7, 1],
		prefersReducedMotion ? [1, 1, 1, 1] : [0.8, 1, 1, 1],
	);

	const rotateX = useTransform(
		scrollYProgress,
		[0, 0.3, 0.7, 1],
		prefersReducedMotion ? [0, 0, 0, 0] : [20, 0, 0, 0],
	);

	const opacity = useTransform(
		scrollYProgress,
		[0, 0.2, 0.8, 1],
		prefersReducedMotion ? [1, 1, 1, 1] : [0, 1, 1, 1],
	);

	const translateY = useTransform(
		scrollYProgress,
		[0, 0.3],
		prefersReducedMotion ? [0, 0] : [-40, 0],
	);

	const lidScreenOpactity = useTransform(
		scrollYProgress,
		[0, 0.2],
		prefersReducedMotion ? [1, 1] : [0, 1],
	);

	return (
		<div
			className={cn(
				'relative flex w-full flex-col items-center justify-center py-16 md:py-24',
				className,
			)}
			ref={containerRef}
			style={{ perspective: '1200px' }}
		>
			{/* Optional gradient background */}
			{showGradient && (
				<div className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-primary/5 via-transparent to-transparent opacity-50 blur-3xl" />
			)}

			{/* Optional title */}
			{title && (
				<motion.div className="relative z-20 mb-12 text-center" style={{ opacity, y: translateY }}>
					{typeof title === 'string' ? (
						<h3 className="font-bold font-display text-3xl text-foreground tracking-tight">
							{title}
						</h3>
					) : (
						title
					)}
				</motion.div>
			)}

			{/* MacBook container with 3D transforms */}
			<motion.div
				className="relative flex flex-col items-center"
				style={{
					scale,
					rotateX,
					transformStyle: 'preserve-3d',
				}}
			>
				{/*
                   MacBook Lid (Screen)
                   bg-zinc-900 (dark) / bg-zinc-200 (light)
                   Dimensions relative to an aspect ratio
                */}
				<div className="relative z-10 h-80 w-lg rounded-2xl border-4 border-zinc-800 bg-zinc-900 p-2 shadow-2xl transition-colors duration-300 md:h-120 md:w-3xl dark:border-zinc-800 dark:bg-zinc-950">
					{/* Notch */}
					<div className="absolute top-0 left-1/2 z-20 flex h-6 w-32 -translate-x-1/2 items-center justify-center rounded-b-xl border-zinc-800/50 border-x border-b bg-zinc-900">
						{/* Camera dot */}
						<div className="h-1.5 w-1.5 rounded-full bg-zinc-800" />
					</div>

					{/* Screen Area */}
					<div className="relative h-full w-full overflow-hidden rounded-xl border border-white/5 bg-zinc-950">
						{/* Reflection overlay */}
						<div className="pointer-events-none absolute inset-0 z-10 bg-linear-to-tr from-white/5 to-transparent opacity-20" />

						{/* Content Container */}
						<motion.div
							className="h-full w-full overflow-hidden"
							style={{ opacity: lidScreenOpactity }}
						>
							{children}
						</motion.div>
					</div>
				</div>

				{/* MacBook Base (Keyboard area implied) */}
				<div className="relative -mt-2 flex h-4 w-xl items-start justify-center rounded-t-sm rounded-b-2xl border-zinc-400/20 border-t bg-zinc-300 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] md:w-216 dark:bg-zinc-800">
					{/* Trackpad notch/groove */}
					<div className="mt-1 h-3 w-32 rounded-full bg-zinc-400/20 blur-[1px] md:w-48" />
				</div>
			</motion.div>

			{/* Optional badge */}
			{badge && (
				<motion.div className="mt-12" style={{ opacity }}>
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
		<div
			className={cn(
				'no-scrollbar h-full w-full overflow-y-auto bg-background/5 p-4 md:p-6 lg:p-8',
				className,
			)}
		>
			{children}
		</div>
	);
}
