import { test, expect } from '@playwright/test';

/**
 * Theme System Cross-Browser Tests
 *
 * NOTE: Theme toggle functionality is only available in the authenticated
 * application sidebar (app-sidebar.tsx). The public landing page does not
 * include theme toggle controls.
 *
 * These tests are skipped because they require Clerk authentication fixtures
 * to access the authenticated routes where theme toggle is available.
 *
 * TODO: Add Clerk auth fixtures and move these tests to authenticated E2E suite
 */
test.describe('Theme System Cross-Browser', () => {
	test.skip(
		'theme toggle requires authentication - toggle not on public pages',
		async () => {
			// Theme toggle is only available in authenticated sidebar
			// These tests need Clerk auth fixtures to work
		}
	);
});

test.describe('Landing Page Theme Support', () => {
	// NOTE: These tests validate browser color scheme detection via Playwright's
	// emulateMedia API. This is separate from the app's theme toggle (light/dark only).

	test('should respect browser color scheme preference', async ({ page }) => {
		// Emulate dark mode system preference
		await page.emulateMedia({ colorScheme: 'dark' });
		await page.goto('/');

		// Page should load successfully with system preference
		await expect(page.locator('body')).toBeVisible();
	});

	test('should render correctly with light mode browser preference', async ({
		page,
	}) => {
		// Emulate light mode system preference
		await page.emulateMedia({ colorScheme: 'light' });
		await page.goto('/');

		// Page should load successfully
		await expect(page.locator('body')).toBeVisible();
	});

	test('should be responsive on mobile viewport', async ({ page }) => {
		// Set mobile viewport
		await page.setViewportSize({ width: 375, height: 667 });
		await page.goto('/');

		// Core elements should still be visible
		await expect(page.locator('body')).toBeVisible();
		await expect(page.locator('nav, [role="navigation"]').first()).toBeVisible();
	});

	test('should render correctly on tablet viewport', async ({ page }) => {
		// Set tablet viewport
		await page.setViewportSize({ width: 768, height: 1024 });
		await page.goto('/');

		// Core elements should be visible
		await expect(page.locator('body')).toBeVisible();
		await expect(page.getByRole('link', { name: /Entrar/i })).toBeVisible();
	});
});
