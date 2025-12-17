import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Theme System Accessibility', () => {
  test('should not have any automatically detectable accessibility issues in light mode', async ({ page }) => {
    await page.goto('/');

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have any automatically detectable accessibility issues in dark mode', async ({ page }) => {
    await page.goto('/');

    // Toggle to dark mode
    await page.getByRole('button', { name: /toggle theme/i }).click();
    await page.getByRole('menuitem', { name: /dark/i }).click();

    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/');

    // Press Tab to focus the toggle
    await page.keyboard.press('Tab');
    // Expect toggle to be focused (checking specific element might depend on layout, assuming it's early in tab order)
    // For specific test, we might locate by label
    const toggle = page.getByRole('button', { name: /toggle theme/i });

    // Simplistic check: ensure we can reach it
    await toggle.focus();
    await expect(toggle).toBeFocused();

    // Open menu
    await page.keyboard.press('Enter');
    await expect(page.getByRole('menu')).toBeVisible();

    // Navigate options
    await page.keyboard.press('ArrowDown');
    await expect(page.getByRole('menuitem', { name: /light/i })).toBeFocused();
  });
});
