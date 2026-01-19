'use client';

import { motion, useInView } from 'framer-motion';
import * as React from 'react';

import { fadeInUp, staggerContainer } from '@/lib/animations';
import { cn } from '@/lib/utils';

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
			animate={isInView ? 'visible' : 'hidden'}
			className={cn(className)}
			initial="hidden"
			ref={ref}
			style={{
				transitionDelay: `${delay}ms`,
			}}
			variants={staggerContainer}
			{...props}
		>
			{React.Children.map(children, (child, index) => {
				if (React.isValidElement(child)) {
					return (
						<motion.div
							transition={{
								delay: delay + index * (stagger / 1000),
							}}
							variants={fadeInUp}
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
