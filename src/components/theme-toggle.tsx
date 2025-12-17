import { Laptop, Moon, Sun } from 'lucide-react';

import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useThemeTransition } from '@/lib/theme-transitions';

export function ThemeToggle() {
	const { setTheme, theme } = useTheme();
	const { animateThemeChange } = useThemeTransition();

	const handleThemeChange = (newTheme: 'light' | 'dark' | 'system', e: React.MouseEvent) => {
		// Only pass coordinates if it's a click event
		const position = e ? { x: e.clientX, y: e.clientY } : undefined;

		animateThemeChange(newTheme, () => setTheme(newTheme), position);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon" className="relative" aria-label="Toggle theme">
					<Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
					<Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
					<span className="sr-only">Toggle theme</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuItem
					onClick={(e) => handleThemeChange('light', e)}
					className={theme === 'light' ? 'bg-accent' : ''}
				>
					<Sun className="mr-2 h-4 w-4" />
					Light
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={(e) => handleThemeChange('dark', e)}
					className={theme === 'dark' ? 'bg-accent' : ''}
				>
					<Moon className="mr-2 h-4 w-4" />
					Dark
				</DropdownMenuItem>
				<DropdownMenuItem
					onClick={(e) => handleThemeChange('system', e)}
					className={theme === 'system' ? 'bg-accent' : ''}
				>
					<Laptop className="mr-2 h-4 w-4" />
					System
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
