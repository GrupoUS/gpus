import { test, expect } from '@playwright/test';

test('has title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  // Using a generic expectation as we don't know the exact title yet, 
  // but this verifies the page loads and has *some* title.
  await expect(page).toHaveTitle(/./);
});

test('sanity check - page loads', async ({ page }) => {
  await page.goto('/');
  // Basic check to see if the root element or similar exists
  // Adjust selector based on actual app content if known, 
  // but for a generic sanity check, checking body is okay-ish for "no crash".
  await expect(page.locator('body')).toBeVisible();
});
