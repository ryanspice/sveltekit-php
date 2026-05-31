import { test, expect } from '@playwright/test';

// Get base path from project metadata (see playwright.config.ts)
// Note: test.info().project.metadata doesn't always populate process.env in a straightforward way,
// but we can access it via test.info().project.metadata.basePath if we are inside a test.
// However, 'test.describe' is synchronous.
// Let's rely on standard Playwright 'baseURL' which handles the server part.
// For the path part, we need to know the base path.
// We can assume if baseURL is on 8087 it's root, 8088 it's subdir.
// OR we can pass SK_BASE_PATH env var via the project config?
// No, Playwright doesn't easily set per-project env vars that are visible here at top level.
// But we can check `test.info().project.metadata.basePath` inside the test.

test.describe('js-ssr E2E', () => {

    test('Home page should render HTML', async ({ page, baseURL }, testInfo) => {
        const basePath = testInfo.project.metadata.basePath || '';
        // If basePath is present, ensure URL has it.
        // If baseURL includes basePath? No, our config sets baseURL to http://...:port
        
        await page.goto(`${basePath}/`);
        const title = await page.title();
        expect(title).not.toBe('404 Not Found');
        await expect(page.locator('body')).toContainText('SvelteKit PHP Adapter');
    });

    test('Deep link SSR page should render correct HTML', async ({ page }, testInfo) => {
        const basePath = testInfo.project.metadata.basePath || '';
        await page.goto(`${basePath}/ssr/basic`);
        await expect(page.locator('h1')).toContainText('Server-Side Rendering Basic Demo');
        const content = await page.content();
        expect(content).toContain('Server-Side Rendering Basic Demo');
    });

    test('SSR Data Hydration', async ({ page }, testInfo) => {
        const basePath = testInfo.project.metadata.basePath || '';
        await page.goto(`${basePath}/ssr-data/`);
        const msg = page.locator('strong').filter({ hasText: 'hello-from-server' });
        await expect(msg).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=Waiting for PHP...')).not.toBeVisible();
    });

    test('Streaming route should stream', async ({ page }, testInfo) => {
        const basePath = testInfo.project.metadata.basePath || '';
        await page.goto(`${basePath}/ssr/stream`);
        
        // Wait for initial content to be present
        await expect(page.locator('body')).toContainText('Stream Messages');

        // Check that we receive the streamed chunks
        await expect(page.locator('ul li')).toHaveCount(4, { timeout: 15000 });
    });

    test('__data.json works for a nested route', async ({ request }, testInfo) => {
        const basePath = testInfo.project.metadata.basePath || '';
        const response = await request.get(`${basePath}/ssr/basic/__data.json`);
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('application/json');
        const data = await response.json();
        expect(data).toHaveProperty('type', 'data');
        expect(data).toHaveProperty('nodes');
    });

    test('Form action POST works', async ({ page }, testInfo) => {
        const basePath = testInfo.project.metadata.basePath || '';
        await page.goto(`${basePath}/form-basic`);
        await page.fill('input[name="val"]', 'Playwright');
        await page.click('button');
        
        // Should redirect or show success
        // Based on existing test it likely redirects or updates page
        // Wait for result
        // Assuming the previous test logic was correct:
        // await expect(page.locator('body')).toContainText('Success'); 
        // We'll trust the original logic if it had expectations.
        // Original:
        // await expect(page.locator('pre')).toContainText('Playwright');
        await expect(page.locator('pre')).toContainText('Playwright');
    });
});
