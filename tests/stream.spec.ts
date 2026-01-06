import { test, expect } from '@playwright/test';

test.describe('Streaming Response', () => {
	test('hydrates initial data and resolves deferred chunk', async ({ page }) => {
		await page.goto('/stream');

		await expect(page.getByText('Step 1:')).toBeVisible();
		await expect(page.locator('strong').filter({ hasText: 'init' })).toBeVisible({ timeout: 15000 });

		await expect(page.locator('strong').filter({ hasText: 'delayed' })).toBeVisible({ timeout: 15000 });
	});
});

