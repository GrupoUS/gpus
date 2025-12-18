import { Moon, Sun } from 'lucide-react';

import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { useThemeTransition } from '@/lib/theme-transitions';

export function ThemeToggle() {
	const { setTheme, theme } = useTheme();
	const { animateThemeChange } = useThemeTransition();

	const isDark = theme === 'dark';

	const toggleTheme = (e: React.MouseEvent) => {
		const newTheme = isDark ? 'light' : 'dark';
		const position = { x: e.clientX, y: e.clientY };
		animateThemeChange(newTheme, () => setTheme(newTheme), position);
	};

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={toggleTheme}
			className="relative"
			aria-label={`Alternar para tema ${isDark ? 'claro' : 'escuro'}`}
		>
			<Sun
				className={`h-[1.2rem] w-[1.2rem] transition-all duration-300 ${
					isDark ? '-rotate-90 scale-0' : 'rotate-0 scale-100'
				}`}
			/>
			<Moon
				className={`absolute h-[1.2rem] w-[1.2rem] transition-all duration-300 ${
					isDark ? 'rotate-0 scale-100' : 'rotate-90 scale-0'
				}`}
			/>
		</Button>
	);
}
