import type { KnipConfig } from 'knip';

const config: KnipConfig = {
	entry: ['src/main.tsx', 'src/routeTree.gen.ts', 'convex/**/*.ts'],
	project: ['src/**/*.{ts,tsx}', 'convex/**/*.ts'],
	vite: {
		config: 'vite.config.ts',
	},
	ignore: [
		'src/components/ui/**',
		'convex/_generated/**',
		'src/routeTree.gen.ts',
	],
	ignoreDependencies: ['@tanstack/router-devtools', 'tailwindcss-animate'],
	rules: {
		files: 'warn',
		dependencies: 'warn',
		devDependencies: 'warn',
		unlisted: 'off',
		binaries: 'off',
		unresolved: 'off',
		exports: 'warn',
		types: 'warn',
		enumMembers: 'warn',
		duplicates: 'warn',
	},
};

export default config;
