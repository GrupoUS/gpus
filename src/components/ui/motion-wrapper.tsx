'use client';

import { motion, useInView } from 'framer-motion';
import * as React from 'react';

import { cn } from '@/lib/utils';
import { fadeInUp, staggerContainer } from '@/lib/animations';

interface MotionWrapperProps {
	children: React.ReactNode;
	className?: string;
	stagger?: number;
	delay?: number;
}

export function MotionWrapper({
	children,
	className,
	stagger = 0,
	delay = 0,
	...props
}: MotionWrapperProps) {
	const ref = React.useRef<HTMLDivElement>(null);
	const isInView = useInView(ref, { once: true, margin: '-50px' });

	return (
		<motion.div
			ref={ref}
			initial="hidden"
			animate={isInView ? 'visible' : 'hidden'}
			variants={staggerContainer}
			className={cn(className)}
			style={{
				transitionDelay: `${delay}ms`,
			}}
			{...props}
		>
			{React.Children.map(children, (child, index) => {
				if (React.isValidElement(child)) {
					return (
						<motion.div
							variants={fadeInUp}
							transition={{
								delay: delay + index * (stagger / 1000),
							}}
						>
							{child}
						</motion.div>
					);
				}
				return child;
			})}
		</motion.div>
	);
}
