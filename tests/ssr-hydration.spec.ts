import { test, expect } from '@playwright/test';

test.describe('SSR Data Hydration', () => {
  test('should hydrate and show server data', async ({ page }) => {
    page.on('console', (msg) => console.log(`BROWSER: ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', (e) => console.log(`BROWSER EXCEPTION: ${e}`));

    await page.goto('/ssr-data');

    // Debug: print what we found
    const container = page.locator('.container');
    console.log('Container Text:', await container.textContent());

    // Dump HTML to see what was injected
    const content = await page.content();
    console.log('Page Content:', content);

    // Check window.sk_hydration_data
    const windowData = await page.evaluate(() => (window as any).sk_hydration_data);
    console.log('Window Data:', JSON.stringify(windowData, null, 2));

    const pageText = await page.evaluate(() => document.body.innerText);
    console.log('Full Page Text:', pageText);

    const msg = page.locator('strong').filter({ hasText: 'hello-from-server' });
    await expect(msg).toBeVisible({ timeout: 10000 });

    await expect(page.locator('text=Waiting for PHP...')).not.toBeVisible();

    // Debug sanity: message value should be present
    await expect(page.locator('text=Message Value: "hello-from-server"')).toBeVisible();

    // Debug should *not* be the numeric-key table on refresh
    await expect(page.locator('text=Keys: ["0"')).toHaveCount(0);
  });
});
