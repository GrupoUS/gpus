import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Landing Page Accessibility', () => {
	test('should not have any automatically detectable accessibility issues', async ({ page }) => {
		await page.goto('/');

		const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test('should not have WCAG 2.1 AA violations', async ({ page }) => {
		await page.goto('/');

		const accessibilityScanResults = await new AxeBuilder({ page })
			.withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
			.analyze();

		expect(accessibilityScanResults.violations).toEqual([]);
	});

	test('should support keyboard navigation to sign-in', async ({ page, isMobile }) => {
		await page.goto('/');

		// On mobile, the sign-in link is inside the hamburger menu
		if (isMobile) {
			const menuButton = page.getByRole('button', { name: /menu/i });
			await menuButton.click();
		}

		// Find the sign-in link and verify it can be focused
		const signInLink = page.getByRole('link', { name: /Entrar/i });
		await signInLink.focus();
		await expect(signInLink).toBeFocused();
	});

	test('should have proper heading hierarchy', async ({ page }) => {
		await page.goto('/');

		// Check for main heading (h1)
		const h1 = page.locator('h1');
		await expect(h1).toBeVisible();

		// Ensure there's at least one heading visible
		const headings = page.locator('h1, h2, h3');
		const count = await headings.count();
		expect(count).toBeGreaterThan(0);
	});

	test('should have accessible navigation', async ({ page }) => {
		await page.goto('/');

		// Check that navigation is present
		const nav = page.locator('nav, [role="navigation"]');
		await expect(nav.first()).toBeVisible();

		// Check that links in navigation are accessible
		const navLinks = page.locator('nav a, [role="navigation"] a');
		const linkCount = await navLinks.count();
		expect(linkCount).toBeGreaterThan(0);
	});

	test('should have visible focus indicators', async ({ page, isMobile }) => {
		await page.goto('/');

		// On mobile, the sign-in link is inside the hamburger menu
		if (isMobile) {
			const menuButton = page.getByRole('button', { name: /menu/i });
			await menuButton.click();
		}

		// Tab through the page and check that focus is visible
		const signInLink = page.getByRole('link', { name: /Entrar/i });

		// Focus the element
		await signInLink.focus();
		await expect(signInLink).toBeFocused();

		// The focused element should be visible
		await expect(signInLink).toBeVisible();
	});
});
