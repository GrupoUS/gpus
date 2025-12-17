import { Moon, Sun } from 'lucide-react';
import { flushSync } from 'react-dom';

import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';

/**
 * Animated theme toggler with View Transition API
 *
 * Creates a circular animation emanating from the button click position
 * when switching between light and dark themes.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/View_Transitions_API
 */
export function AnimatedThemeToggler() {
	const { theme, setTheme } = useTheme();

	const toggleTheme = (event: React.MouseEvent<HTMLButtonElement>) => {
		const isDark =
			theme === 'dark' ||
			(theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
		const newTheme = isDark ? 'light' : 'dark';

		// Fallback for browsers without View Transition API
		if (!document.startViewTransition) {
			setTheme(newTheme);
			return;
		}

		// Get click coordinates for the animation origin
		const x = event.clientX;
		const y = event.clientY;

		// Calculate the maximum radius needed to cover the entire viewport
		const endRadius = Math.hypot(
			Math.max(x, window.innerWidth - x),
			Math.max(y, window.innerHeight - y),
		);

		// Start the view transition
		const transition = document.startViewTransition(() => {
			flushSync(() => {
				setTheme(newTheme);
			});
		});

		// Animate with clip-path circle expanding from click position
		transition.ready.then(() => {
			const clipPath = [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`];

			document.documentElement.animate(
				{
					clipPath: isDark ? [...clipPath].reverse() : clipPath,
				},
				{
					duration: 400,
					easing: 'ease-in-out',
					pseudoElement: isDark ? '::view-transition-old(root)' : '::view-transition-new(root)',
				},
			);
		});
	};

	// Determine if currently in dark mode (considering system preference)
	const isDark =
		theme === 'dark' ||
		(theme === 'system' &&
			typeof window !== 'undefined' &&
			window.matchMedia('(prefers-color-scheme: dark)').matches);

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={toggleTheme}
			aria-label="Alternar tema"
			className="relative"
		>
			<Sun
				className={`h-5 w-5 transition-all duration-300 ${
					isDark ? 'rotate-90 scale-0' : 'rotate-0 scale-100'
				}`}
			/>
			<Moon
				className={`absolute h-5 w-5 transition-all duration-300 ${
					isDark ? 'rotate-0 scale-100' : '-rotate-90 scale-0'
				}`}
			/>
			<span className="sr-only">Alternar tema</span>
		</Button>
	);
}
