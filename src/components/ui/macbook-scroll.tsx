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
			ref={containerRef}
			className={cn(
				'relative w-full py-16 md:py-24 flex flex-col items-center justify-center',
				className,
			)}
			style={{ perspective: '1200px' }}
		>
			{/* Optional gradient background */}
			{showGradient && (
				<div className="absolute inset-0 -z-10 bg-linear-to-b from-primary/5 via-transparent to-transparent opacity-50 blur-3xl pointer-events-none" />
			)}

			{/* Optional title */}
			{title && (
				<motion.div style={{ opacity, y: translateY }} className="text-center mb-12 relative z-20">
					{typeof title === 'string' ? (
						<h3 className="text-3xl font-bold font-display tracking-tight text-foreground">
							{title}
						</h3>
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
					transformStyle: 'preserve-3d',
				}}
				className="relative flex flex-col items-center"
			>
				{/*
                   MacBook Lid (Screen)
                   bg-zinc-900 (dark) / bg-zinc-200 (light)
                   Dimensions relative to an aspect ratio
                */}
				<div className="relative h-80 w-lg md:h-120 md:w-3xl bg-zinc-900 dark:bg-zinc-950 rounded-2xl p-2 shadow-2xl border-4 border-zinc-800 dark:border-zinc-800 z-10 transition-colors duration-300">
					{/* Notch */}
					<div className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-32 bg-zinc-900 rounded-b-xl z-20 border-b border-x border-zinc-800/50 flex justify-center items-center">
						{/* Camera dot */}
						<div className="w-1.5 h-1.5 rounded-full bg-zinc-800" />
					</div>

					{/* Screen Area */}
					<div className="relative h-full w-full bg-zinc-950 rounded-xl overflow-hidden border border-white/5">
						{/* Reflection overlay */}
						<div className="absolute inset-0 bg-linear-to-tr from-white/5 to-transparent z-10 pointer-events-none opacity-20" />

						{/* Content Container */}
						<motion.div
							style={{ opacity: lidScreenOpactity }}
							className="h-full w-full overflow-hidden"
						>
							{children}
						</motion.div>
					</div>
				</div>

				{/* MacBook Base (Keyboard area implied) */}
				<div className="relative -mt-2 h-4 w-xl md:w-216 bg-zinc-300 dark:bg-zinc-800 rounded-b-2xl rounded-t-sm shadow-[0_20px_50px_-12px_rgba(0,0,0,0.5)] flex justify-center items-start border-t border-zinc-400/20">
					{/* Trackpad notch/groove */}
					<div className="mt-1 h-3 w-32 md:w-48 bg-zinc-400/20 rounded-full blur-[1px]" />
				</div>
			</motion.div>

			{/* Optional badge */}
			{badge && (
				<motion.div style={{ opacity }} className="mt-12">
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
				'h-full w-full bg-background/5 p-4 md:p-6 lg:p-8 overflow-y-auto no-scrollbar',
				className,
			)}
		>
			{children}
		</div>
	);
}
