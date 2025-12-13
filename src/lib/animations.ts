import type { Variants } from 'framer-motion';

/**
 * Animation variants for framer-motion
 * All animations respect prefers-reduced-motion
 */

const prefersReducedMotion =
	typeof window !== 'undefined'
		? window.matchMedia('(prefers-reduced-motion: reduce)').matches
		: false;

const baseTransition = {
	duration: prefersReducedMotion ? 0.01 : 0.6,
	ease: [0.16, 1, 0.3, 1] as [number, number, number, number],
};

/**
 * Fade in from bottom animation
 */
export const fadeInUp: Variants = {
	hidden: {
		opacity: 0,
		y: 20,
	},
	visible: {
		opacity: 1,
		y: 0,
		transition: baseTransition,
	},
};

/**
 * Scale in animation
 */
export const scaleIn: Variants = {
	hidden: {
		opacity: 0,
		scale: 0.95,
	},
	visible: {
		opacity: 1,
		scale: 1,
		transition: baseTransition,
	},
};

/**
 * Fade in animation
 */
export const fadeIn: Variants = {
	hidden: {
		opacity: 0,
	},
	visible: {
		opacity: 1,
		transition: baseTransition,
	},
};

/**
 * Stagger children animation
 */
export const staggerContainer: Variants = {
	hidden: {
		opacity: 0,
	},
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: prefersReducedMotion ? 0 : 0.1,
			delayChildren: prefersReducedMotion ? 0 : 0.1,
		},
	},
};

/**
 * Slide in from left
 */
export const slideInLeft: Variants = {
	hidden: {
		opacity: 0,
		x: -20,
	},
	visible: {
		opacity: 1,
		x: 0,
		transition: baseTransition,
	},
};

/**
 * Slide in from right
 */
export const slideInRight: Variants = {
	hidden: {
		opacity: 0,
		x: 20,
	},
	visible: {
		opacity: 1,
		x: 0,
		transition: baseTransition,
	},
};

/**
 * Float animation (for cards)
 */
export const float: Variants = {
	hidden: {
		y: 0,
	},
	visible: {
		y: [-4, 4, -4],
		transition: {
			duration: prefersReducedMotion ? 0.01 : 3,
			repeat: Number.POSITIVE_INFINITY,
			ease: 'easeInOut',
		},
	},
};
