'use client';

import { motion, useScroll, useSpring, useTransform } from 'framer-motion';
import { useRef } from 'react';

interface ScrollFloatTextProps {
	heading?: string;
	subheading?: string;
	className?: string;
	floatDistance?: number;
	duration?: number;
}

export function ScrollFloatText({
	heading = 'Veja seu negócio em tempo real',
	subheading = 'Dashboard completo com métricas atualizadas e insights acionáveis para tomar decisões melhores.',
	className = '',
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
		<div ref={containerRef} className={`relative overflow-hidden ${className}`}>
			<motion.div style={{ y, opacity }} transition={{ duration }} className="space-y-4">
				<motion.h2 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-clip-text text-transparent bg-linear-to-r from-foreground to-foreground/50">
					{heading}
				</motion.h2>

				<motion.p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
					{subheading}
				</motion.p>
			</motion.div>
		</div>
	);
}
