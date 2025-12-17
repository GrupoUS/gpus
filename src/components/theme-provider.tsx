import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'dark' | 'light';

type ThemeProviderProps = {
	children: React.ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
};

type ThemeProviderState = {
	theme: Theme;
	setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
	theme: 'dark',
	setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
	children,
	defaultTheme = 'dark',
	storageKey = 'gpus-ui-theme',
	...props
}: ThemeProviderProps) {
	const [theme, setThemeState] = useState<Theme>(() => {
		const stored = localStorage.getItem(storageKey);
		// Migrate 'system' to 'dark' for users with old preference
		if (stored === 'system') {
			localStorage.setItem(storageKey, 'dark');
			return 'dark';
		}
		return (stored as Theme) || defaultTheme;
	});

	useEffect(() => {
		const root = window.document.documentElement;
		root.classList.remove('light', 'dark');
		root.classList.add(theme);
	}, [theme]);

	const setTheme = useCallback(
		(newTheme: Theme) => {
			localStorage.setItem(storageKey, newTheme);
			setThemeState(newTheme);
		},
		[storageKey],
	);

	const value = useMemo(
		() => ({
			theme,
			setTheme,
		}),
		[theme, setTheme],
	);

	return (
		<ThemeProviderContext.Provider {...props} value={value}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export const useTheme = () => {
	const context = useContext(ThemeProviderContext);

	if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');

	return context;
};
