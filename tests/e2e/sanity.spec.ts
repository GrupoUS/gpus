import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('has title', async ({ page }) => {
    await page.goto('/');

    // Check that the page has a title
    await expect(page).toHaveTitle(/./);
  });

  test('page loads without errors', async ({ page }) => {
    await page.goto('/');

    // Check the body is visible (basic crash check)
    await expect(page.locator('body')).toBeVisible();
  });

  test('displays navigation with brand', async ({ page }) => {
    await page.goto('/');

    // Check for the Grupo US brand in navigation (scoped to nav to avoid footer match)
    await expect(
      page.locator('nav').getByRole('link', { name: /Grupo US/i })
    ).toBeVisible();
  });

  test('has sign-in link', async ({ page, isMobile }) => {
    await page.goto('/');

    // On mobile, the sign-in link is inside the hamburger menu
    if (isMobile) {
      const menuButton = page.getByRole('button', { name: /menu/i });
      await menuButton.click();
    }

    // Check for the "Entrar" (sign-in) link
    const signInLink = page.getByRole('link', { name: /Entrar/i });
    await expect(signInLink).toBeVisible();
    await expect(signInLink).toHaveAttribute('href', '/sign-in');
  });

  test('displays hero section content', async ({ page }) => {
    await page.goto('/');

    // Check for main heading
    await expect(
      page.getByRole('heading', { name: /Potencialize sua Gestão/i })
    ).toBeVisible();
  });

  test('displays features section', async ({ page }) => {
    await page.goto('/');

    // Check for features section heading
    await expect(
      page.getByRole('heading', { name: /Tudo que você precisa para crescer/i })
    ).toBeVisible();
  });

  test('displays footer with contact info', async ({ page }) => {
    await page.goto('/');

    // Check footer has email link
    await expect(
      page.getByRole('link', { name: /contato@grupous.com.br/i })
    ).toBeVisible();
  });
});
