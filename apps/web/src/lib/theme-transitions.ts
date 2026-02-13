// Helper to check for View Transition API support
export const supportsViewTransition = () =>
	typeof document !== 'undefined' && 'startViewTransition' in document;

export function useThemeTransition() {
	const isReducedMotion =
		typeof window !== 'undefined'
			? window.matchMedia('(prefers-reduced-motion: reduce)').matches
			: false;

	const animateThemeChange = (
		newTheme: string,
		updateThemeCallback: () => void,
		position?: { x: number; y: number },
	) => {
		if (!supportsViewTransition() || isReducedMotion) {
			updateThemeCallback();
			return;
		}

		// Determine if we're going to dark mode or light mode
		const isDarkMode = newTheme === 'dark';

		const transition = document.startViewTransition(() => {
			updateThemeCallback();
		});

		transition.ready.then(() => {
			// If no position is provided, standard view transition occurs
			if (!position) return;

			const { x, y } = position;
			const endRadius = Math.hypot(
				Math.max(x, window.innerWidth - x),
				Math.max(y, window.innerHeight - y),
			);

			// Animation configuration
			const duration = 400;
			const easing = 'ease-in-out';

			if (isDarkMode) {
				// Light → Dark: Animate the NEW view (dark) expanding from click point
				// The dark circle expands to cover the light background
				document.documentElement.animate(
					{
						clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
					},
					{
						duration,
						easing,
						pseudoElement: '::view-transition-new(root)',
					},
				);
			} else {
				// Dark → Light: Animate the OLD view (dark) shrinking to click point
				// The dark circle contracts to reveal the light background
				document.documentElement.animate(
					{
						clipPath: [`circle(${endRadius}px at ${x}px ${y}px)`, `circle(0px at ${x}px ${y}px)`],
					},
					{
						duration,
						easing,
						pseudoElement: '::view-transition-old(root)',
					},
				);
			}
		});
	};

	return { animateThemeChange };
}
