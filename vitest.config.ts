import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(viteConfig, defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/*.{test,spec}.{ts,tsx,js,jsx}'],
    exclude: ['node_modules', '**/node_modules/**', 'dist', '.output', '**/tests/e2e/**', '.opencode/**'],
  },
}))
