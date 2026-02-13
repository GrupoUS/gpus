import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig({
	server: {
		port: 3000,
		proxy: {
			'/api': {
				target: 'http://localhost:3001',
				changeOrigin: true,
			},
		},
	},
	plugins: [
		tailwindcss(),
		tsConfigPaths({
			projects: ['./tsconfig.json'],
		}),
		TanStackRouterVite(),
		viteReact(),
	],
	build: {
		rollupOptions: {
			output: {
				manualChunks: {
					// Separate vendor chunks
					vendor: ['react', 'react-dom', '@tanstack/react-router', '@tanstack/react-query'],
					// UI components chunk
					ui: [
						'@radix-ui/react-avatar',
						'@radix-ui/react-checkbox',
						'@radix-ui/react-dialog',
						'@radix-ui/react-dropdown-menu',
						'@radix-ui/react-label',
						'@radix-ui/react-navigation-menu',
						'@radix-ui/react-popover',
						'@radix-ui/react-progress',
						'@radix-ui/react-radio-group',
						'@radix-ui/react-scroll-area',
						'@radix-ui/react-select',
						'@radix-ui/react-separator',
						'@radix-ui/react-slot',
						'@radix-ui/react-tabs',
						'@radix-ui/react-tooltip',
						'lucide-react',
						'sonner',
						'date-fns',
						'clsx',
						'tailwind-merge',
					],
					// Forms chunk
					forms: ['react-hook-form', '@hookform/resolvers/zod', 'zod'],
					// Charts chunk (recharts is large)
					charts: ['recharts'],
					// Authentication chunk
					auth: ['@clerk/clerk-react'],
					// Animation chunk
					animation: ['framer-motion'],
				},
			},
		},
		// Increase chunk size warning limit (1MB is acceptable for initial load with lazy routes)
		chunkSizeWarningLimit: 1100,
	},
});
