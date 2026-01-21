import { test, expect } from '@playwright/test';

test.describe('SvelteKit PHP Adapter Integration', () => {
	test('Root Page: Rendering and Data Injection', async ({ page }) => {
		const response = await page.goto('/');
		expect(response?.status()).toBe(200);

		// Check Title
		await expect(page).toHaveTitle(/SvelteKit PHP Demo/);

		// Check Server Data Injection
		const hero = page.locator('.hero');
		await expect(hero).toContainText('SvelteKit PHP Adapter');
		const content = await page.content();
		expect(content).toContain('Running SvelteKit on PHP runtime with full SSR support.');
		expect(content).toContain('Hello from PHP!');

		// Check Debug Console (verifies is_dev=true injection)
		// The button class is .toggle-btn-minimized.debug-console
		expect(content).toContain('"is_dev":true');
	});

	test('Global Layout: Data Merging', async ({ request }) => {
		// Simulate client-side navigation data fetch
		// Requesting __data.json which is rewritten to __data.php
		const response = await request.get('/__data.json');
		expect(response.status()).toBe(200);

		const data = await response.json();
		const str = JSON.stringify(data);

		expect(str).toContain('SvelteKit PHP Demo');
		expect(str).toContain('global_layout_loaded');
	});

	test('Redirects: Server-Side', async ({ page }) => {
		// Playwright handles redirects automatically, but we can intercept or check the final URL.
		await page.goto('/redirect-me/');

		// Should be redirected to /ssr-data
		expect(page.url()).toContain('/ssr-data');
		expect(page.url()).toContain('redirected_from=/redirect-me');
		expect(page.url()).toContain('message=Redirect+Success');

		expect(page.url()).toContain('message=Redirect+Success');
	});

	test('Nested Layouts: Data Merging', async ({ request }) => {
		const response = await request.get('/parent-child/nested/__data.json');
		expect(response.status()).toBe(200);
		const data = await response.json();

		// Verify nodes structure (SvelteKit specific)
		expect(data).toHaveProperty('nodes');
		expect(Array.isArray(data.nodes)).toBeTruthy();

		const str = JSON.stringify(data);
		expect(str).toContain('SvelteKit PHP Demo'); // Root
		expect(str).toContain('layout-data-1'); // Parent
		expect(str).toContain('nested-data-level-2'); // Page
	});

	test('JS-Only Route (Prerendered)', async ({ page }) => {
		const response = await page.goto('/test-js/');
		expect(response?.status()).toBe(200);
		await expect(page.locator('h1')).toContainText('JS Route (Synchronized!)');
		await expect(page.locator('p').first()).toContainText('Hello from JS Load');
	});

	test('SSR Data: Initial HTML Injection', async ({ page }) => {
		// We want to check the initial HTML response before hydration if possible.
		// page.content() gives the current DOM.
		// request.get() gives the raw response.

		const response = await page.request.get('/ssr-data');
		const text = await response.text();

		// Check that the data is embedded in the script tag
		expect(text).toContain('hello-from-server');

		// In php-static mode, the fallback text IS expected in the HTML body
		expect(text).toContain('Waiting for PHP...');

		// But when we visit with the browser, it should hydrate.
		await page.goto('/ssr-data');
		// After hydration, the text should update?
		// The component logic:
		// if serverData?.message -> show message
		// else -> show Waiting for PHP...
		// The data IS injected, so hydration should pick it up and show "hello-from-server" or similar if the component renders it.
		// +page.svelte: <p>Message from server: <strong>{serverData.message}</strong></p>

		// Wait for hydration to potentially update the DOM
		await expect(page.locator('strong').first()).toContainText('hello-from-server');
	});

	test('Preload Data Endpoint', async ({ request }) => {
		const response = await request.get('/preload/__data.json');
		expect(response.status()).toBe(200);
		const data = await response.json();
		const str = JSON.stringify(data);
		expect(str).toContain('heavy_data');
	});

	test('Content Negotiation: Accept header routing', async ({ request }) => {
		const htmlResponse = await request.get('/negotiate', {
			headers: {
				Accept: 'text/html'
			}
		});
		expect(htmlResponse.status()).toBe(200);
		expect(htmlResponse.headers()['content-type']).toContain('text/html');
		expect(htmlResponse.headers()['vary']).toContain('Accept');

		const jsonResponse = await request.get('/negotiate', {
			headers: {
				Accept: 'application/json'
			}
		});
		expect(jsonResponse.status()).toBe(200);
		expect(jsonResponse.headers()['content-type']).toContain('application/json');
	});

	test('Form Action: POST', async ({ request }) => {
		const response = await request.post('/form-basic', {
			headers: {
				'x-sveltekit-action': 'true',
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			form: {
				val: 'hello-playwright'
			}
		});

		expect(response.status()).toBe(200);
		const raw = await response.text();
		expect(raw).toContain('success');
		expect(raw).toContain('hello-playwright');
	});

	test('Form Action: POST (non-enhanced)', async ({ request }) => {
		const response = await request.post('/form-basic', {
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded'
			},
			form: {
				val: 'hello-playwright'
			}
		});

		expect(response.status()).toBe(200);
		expect(response.headers()['content-type']).toContain('text/html');
		const raw = await response.text();
		expect(raw).toContain('Form Actions');
	});

	test('API Route: Ping', async ({ request }) => {
		const response = await request.get('/api/ping');
		expect(response.status()).toBe(200);
		expect(response.headers()['content-type']).toContain('application/json');
		const data = await response.json();
		expect(data.ok).toBe(true);
	});

	test('Cookies: Set and Read', async ({ request }) => {
		// 1. Set Cookie
		const setRes = await request.get('/api/cookie?set=1');
		expect(setRes.status()).toBe(200);

		const setCookieHeader = setRes
			.headersArray()
			.find((header) => header.name.toLowerCase() === 'set-cookie')?.value;
		expect(setCookieHeader).toBeDefined();
		expect(setCookieHeader).toContain('adapter_cookie=1');

		// 2. Read Cookie
		const readRes = await request.get('/api/cookie', {
			headers: {
				Cookie: 'adapter_cookie=1'
			}
		});
		const data = await readRes.json();
		expect(data.cookie_value).toBe('1');
	});

	test('Multipart Upload', async ({ request }) => {
		const buffer = Buffer.from('playwright test file');

		const response = await request.post('/form-multipart', {
			headers: {
				'x-sveltekit-action': 'true'
			},
			multipart: {
				note: 'playwright-upload',
				file: {
					name: 'test.txt',
					mimeType: 'text/plain',
					buffer: buffer
				}
			}
		});

		expect(response.status()).toBe(200);
		const raw = await response.text();
		expect(raw).toContain('success');
		expect(raw).toContain('test.txt');
		expect(raw).toContain('playwright-upload');
	});

	test('_protected is not web-accessible', async ({ request }) => {
		const response = await request.get('/_protected/_page.php');
		const status = response.status();
		expect([403, 404]).toContain(status);
	});

	test('404 Handling', async ({ page }) => {
		const response = await page.goto('/this-route-does-not-exist');
		expect(response?.status()).toBe(404);
	});

	test('500 Handling', async ({ page }) => {
		const response = await page.goto('/error-throw');
		expect(response?.status()).toBe(500);
	});
});
