// Helper to check for View Transition API support
export const supportsViewTransition = () =>
	typeof document !== 'undefined' && 'startViewTransition' in document;

interface UseThemeTransitionProps {
	theme: string;
	setTheme: (theme: string) => void;
}

export function useThemeTransition() {
	const isReducedMotion =
		typeof window !== 'undefined'
			? window.matchMedia('(prefers-reduced-motion: reduce)').matches
			: false;

	const animateThemeChange = (_newTheme: string, updateThemeCallback: () => void) => {
		if (!supportsViewTransition() || isReducedMotion) {
			updateThemeCallback();
			return;
		}

		const transition = document.startViewTransition(() => {
			updateThemeCallback();
		});

		transition.ready.then(() => {
			// Logic for circular reveal if needed, or rely on CSS animations
			// For circular reveal effectively, we need the click coordinates.
			// But standard View Transition with CSS is already powerful.

			// If we simply rely on CSS in index.css:
			// ::view-transition-old(root) { ... }
			// ::view-transition-new(root) { ... }

			// To add the circular clip-path effect, we can animate document.documentElement
			const x = window.innerWidth;
			const y = 0; // Top right usually
			const endRadius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

			document.documentElement.animate(
				{
					clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`],
				},
				{
					duration: 500,
					easing: 'ease-in-out',
					pseudoElement: '::view-transition-new(root)',
				},
			);
		});
	};

	return { animateThemeChange };
}
