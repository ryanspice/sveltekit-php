import { test, expect } from '@playwright/test';

test.describe('SSR Data Hydration', () => {
	test('should hydrate and show server data', async ({ page }) => {
		await page.goto('/ssr-data');

		const msg = page.locator('strong').filter({ hasText: 'hello-from-server' });
		await expect(msg).toBeVisible({ timeout: 10000 });

		await expect(page.locator('text=Waiting for PHP...')).not.toBeVisible();

		// Debug sanity: message value should be present
		await expect(page.locator('text=Message Value: "hello-from-server"')).toBeVisible();

		// Debug should *not* be the numeric-key table on refresh
		await expect(page.locator('text=Keys: ["0"')).toHaveCount(0);
	});
});
