import { test, expect } from '@playwright/test';

test.describe('Theme System Cross-Browser', () => {
  test('should toggle theme and persist preference across reloads', async ({ page }) => {
    await page.goto('/');

    // Ensure we start in a known state (force light mode via local storage if needed, or just detect)
    // Here we assume default might be system or dark depending on OS/config.
    // Let's explicitly set to Light first.

    // Open dropdown
    const toggleBtn = page.getByRole('button', { name: /toggle theme/i });
    await toggleBtn.click();
    await page.getByRole('menuitem', { name: /light/i }).click();

    // Verify Light Mode
    await expect(page.locator('html')).toHaveClass(/light/);
    await expect(page.locator('html')).not.toHaveClass(/dark/);

    // Switch to Dark Mode
    await toggleBtn.click();
    await page.getByRole('menuitem', { name: /dark/i }).click();

    // Verify Dark Mode
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Reload page to test persistence
    await page.reload();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('should support system theme preference', async ({ page }) => {
     // Emulate dark mode system preference
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');

    const toggleBtn = page.getByRole('button', { name: /toggle theme/i });
    await toggleBtn.click();
    await page.getByRole('menuitem', { name: /system/i }).click();

    // Should match system (dark)
    await expect(page.locator('html')).toHaveClass(/dark/);

    // Emulate light mode system preference
    await page.emulateMedia({ colorScheme: 'light' });

    // Should update automatically (this tests the listener in ThemeProvider)
    await expect(page.locator('html')).toHaveClass(/light/);
  });

  test('should fallback gracefully on mobile viewports', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const toggleBtn = page.getByRole('button', { name: /toggle theme/i });
    await expect(toggleBtn).toBeVisible();
    await toggleBtn.tap(); // Use tap for mobile

    const darkOption = page.getByRole('menuitem', { name: /dark/i });
    await expect(darkOption).toBeVisible();
    await darkOption.tap();

    await expect(page.locator('html')).toHaveClass(/dark/);
  });
});
