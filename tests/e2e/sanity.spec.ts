import { expect, test } from '@playwright/test';

const ANY_TITLE_REGEX = /./;
const BRAND_LINK_REGEX = /Grupo US/i;
const MENU_BUTTON_REGEX = /menu/i;
const SIGN_IN_REGEX = /Entrar/i;
const HERO_HEADING_REGEX = /Potencialize sua Gestão/i;
const FEATURES_HEADING_REGEX = /Tudo que você precisa para crescer/i;
const CONTACT_EMAIL_REGEX = /contato@grupous.com.br/i;

test.describe('Landing Page', () => {
	test('has title', async ({ page }) => {
		await page.goto('/');

		// Check that the page has a title
		await expect(page).toHaveTitle(ANY_TITLE_REGEX);
	});

	test('page loads without errors', async ({ page }) => {
		await page.goto('/');

		// Check the body is visible (basic crash check)
		await expect(page.locator('body')).toBeVisible();
	});

	test('displays navigation with brand', async ({ page }) => {
		await page.goto('/');

		// Check for the Grupo US brand in navigation (scoped to nav to avoid footer match)
		await expect(page.locator('nav').getByRole('link', { name: BRAND_LINK_REGEX })).toBeVisible();
	});

	test('has sign-in link', async ({ page, isMobile }) => {
		await page.goto('/');

		// On mobile, the sign-in link is inside the hamburger menu
		if (isMobile) {
			const menuButton = page.getByRole('button', { name: MENU_BUTTON_REGEX });
			await menuButton.click();
		}

		// Check for the "Entrar" (sign-in) link
		const signInLink = page.getByRole('link', { name: SIGN_IN_REGEX });
		await expect(signInLink).toBeVisible();
		await expect(signInLink).toHaveAttribute('href', '/sign-in');
	});

	test('displays hero section content', async ({ page }) => {
		await page.goto('/');

		// Check for main heading
		await expect(page.getByRole('heading', { name: HERO_HEADING_REGEX })).toBeVisible();
	});

	test('displays features section', async ({ page }) => {
		await page.goto('/');

		// Check for features section heading
		await expect(page.getByRole('heading', { name: FEATURES_HEADING_REGEX })).toBeVisible();
	});

	test('displays footer with contact info', async ({ page }) => {
		await page.goto('/');

		// Check footer has email link
		await expect(page.getByRole('link', { name: CONTACT_EMAIL_REGEX })).toBeVisible();
	});
});
