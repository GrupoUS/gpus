'use client';

import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';

interface ScrollFloatTextProps {
	heading?: string;
	subheading?: string;
	containerClassName?: string;
	textClassName?: string;
	subNoteClassName?: string;
	floatDistance?: number;
	duration?: number;
}

export function ScrollFloatText({
	heading = 'Veja seu negócio em tempo real',
	subheading = 'Dashboard completo com métricas atualizadas e insights acionáveis para tomar decisões melhores.',
	containerClassName = '',
	textClassName = '',
	subNoteClassName = '',
	floatDistance = 80,
	duration = 0.8,
}: ScrollFloatTextProps) {
	const containerRef = useRef<HTMLDivElement>(null);

	// Track scroll progress of this element
	const { scrollYProgress } = useScroll({
		target: containerRef,
		offset: ['start end', 'center center'],
	});

	// Transform scroll progress to Y position (float effect)
	const yRaw = useTransform(scrollYProgress, [0, 1], [floatDistance, 0]);

	// Add spring physics for smooth, natural float
	const y = useSpring(yRaw, {
		stiffness: 100,
		damping: 30,
		restDelta: 0.001,
	});

	// Fade in as element floats up
	const opacity = useTransform(scrollYProgress, [0, 0.5, 1], [0, 0.8, 1]);

	return (
		<div className={`relative overflow-hidden ${containerClassName}`} ref={containerRef}>
			<motion.div
				className="space-y-4 text-center"
				style={{ y, opacity }}
				transition={{ duration }}
			>
				<motion.h2
					className={
						textClassName ||
						'bg-linear-to-r from-foreground to-foreground/50 bg-clip-text font-bold text-4xl text-transparent md:text-5xl lg:text-6xl'
					}
				>
					{heading}
				</motion.h2>

				<motion.p
					className={
						subNoteClassName || 'mx-auto max-w-3xl text-lg text-muted-foreground md:text-xl'
					}
				>
					{subheading}
				</motion.p>
			</motion.div>
		</div>
	);
}
