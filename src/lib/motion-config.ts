/**
 * Framer Motion Configuration
 *
 * Reusable spring configs and animation variants for consistent
 * animations across the CRM kanban and other components.
 */

import type { Transition, Variants } from 'framer-motion';

// ============================================================================
// Spring Configurations
// ============================================================================

/**
 * Smooth spring - Best for general UI transitions
 * Medium stiffness, high damping for no bounce
 */
export const SPRING_SMOOTH: Transition = {
	type: 'spring',
	stiffness: 300,
	damping: 30,
};

/**
 * Bouncy spring - For playful interactions
 * Lower damping allows for slight overshoot
 */
export const SPRING_BOUNCY: Transition = {
	type: 'spring',
	stiffness: 400,
	damping: 25,
};

/**
 * Stiff spring - For snappy, immediate responses
 * High stiffness for quick movement
 */
export const SPRING_STIFF: Transition = {
	type: 'spring',
	stiffness: 600,
	damping: 35,
};

/**
 * Gentle spring - For subtle, slow transitions
 * Lower stiffness for relaxed movement
 */
export const SPRING_GENTLE: Transition = {
	type: 'spring',
	stiffness: 200,
	damping: 25,
};

// ============================================================================
// Layout Transitions
// ============================================================================

/**
 * Layout transition for kanban card reordering
 */
export const layoutTransition: Transition = {
	type: 'spring',
	stiffness: 300,
	damping: 30,
	mass: 0.8,
};

/**
 * Drag transition for smooth drag behavior
 */
export const dragTransition = {
	bounceStiffness: 500,
	bounceDamping: 30,
	power: 0.3,
	timeConstant: 200,
};

// ============================================================================
// Card Variants
// ============================================================================

/**
 * Animation variants for lead cards
 */
export const cardVariants: Variants = {
	initial: {
		opacity: 0,
		y: -20,
		scale: 0.95,
	},
	animate: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: SPRING_SMOOTH,
	},
	exit: {
		opacity: 0,
		scale: 0.8,
		transition: {
			duration: 0.2,
		},
	},
	hover: {
		scale: 1.02,
		boxShadow: '0 20px 40px -12px hsl(var(--primary) / 0.3)',
		transition: SPRING_SMOOTH,
	},
	tap: {
		scale: 0.98,
		transition: SPRING_STIFF,
	},
};

/**
 * Animation variants for dragging state
 */
export const dragVariants: Variants = {
	idle: {
		scale: 1,
		boxShadow: '0 4px 12px -2px rgba(0, 0, 0, 0.1)',
		cursor: 'grab',
	},
	dragging: {
		scale: 1.05,
		boxShadow: '0 25px 50px -12px hsl(var(--primary) / 0.4)',
		cursor: 'grabbing',
		zIndex: 50,
		transition: SPRING_BOUNCY,
	},
};

// ============================================================================
// Icon Animations
// ============================================================================

/**
 * Pulsating animation for hot temperature icon
 */
export const hotIconVariants: Variants = {
	idle: {
		rotate: 0,
		scale: 1,
	},
	hot: {
		rotate: [0, 10, -10, 0],
		scale: [1, 1.1, 1],
		transition: {
			repeat: Number.POSITIVE_INFINITY,
			duration: 1,
			ease: 'easeInOut',
		},
	},
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate spring transition based on distance
 * Longer distances get slightly longer durations
 */
export function getDistanceSpring(distance: number): Transition {
	const baseDamping = 30;
	const baseStiffness = 300;

	// Adjust for distance - larger distances get slightly more relaxed springs
	const distanceFactor = Math.min(distance / 200, 1);
	const adjustedDamping = baseDamping + distanceFactor * 5;

	return {
		type: 'spring',
		stiffness: baseStiffness,
		damping: adjustedDamping,
	};
}
