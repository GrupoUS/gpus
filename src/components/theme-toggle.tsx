import { Moon, Sun } from 'lucide-react';

import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import { useThemeTransition } from '@/lib/theme-transitions';

export function ThemeToggle() {
	const { setTheme, theme } = useTheme();
	const { animateThemeChange } = useThemeTransition();

	const toggleTheme = (e: React.MouseEvent) => {
		const newTheme = theme === 'dark' ? 'light' : 'dark';
		const position = { x: e.clientX, y: e.clientY };
		animateThemeChange(newTheme, () => setTheme(newTheme), position);
	};

	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={toggleTheme}
			className="relative"
			aria-label={`Alternar para tema ${theme === 'dark' ? 'claro' : 'escuro'}`}
		>
			<Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
			<Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
		</Button>
	);
}
