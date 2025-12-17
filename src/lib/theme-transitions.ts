// Helper to check for View Transition API support
export const supportsViewTransition = () =>
	typeof document !== 'undefined' && 'startViewTransition' in document;

export function useThemeTransition() {
	const isReducedMotion =
		typeof window !== 'undefined'
			? window.matchMedia('(prefers-reduced-motion: reduce)').matches
			: false;

	const animateThemeChange = (
		_newTheme: string,
		updateThemeCallback: () => void,
		position?: { x: number; y: number },
	) => {
		if (!supportsViewTransition() || isReducedMotion) {
			updateThemeCallback();
			return;
		}

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

			const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`];

			document.documentElement.animate(
				{
					clipPath: clipPath,
				},
				{
					duration: 400,
					easing: 'ease-in-out',
					pseudoElement: '::view-transition-new(root)',
				},
			);
		});
	};

	return { animateThemeChange };
}
