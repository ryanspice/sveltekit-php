import { expect, test } from '@playwright/test';
import { verifyBuildStamp } from '../../../scripts/utils/stamp.mjs';
import { startPhpAndSidecar, type ServerInstance } from '../../test-utils';

let server: ServerInstance;
let origin: string;
let basePath: string;

// Static client fallback and SSR can canonicalize the final slash differently.
// Both must retain the exact origin, deployment base and route without a query/hash.
function atRoute(path: string) {
	return (url: URL) =>
		url.origin === origin &&
		url.pathname.replace(/\/+$/, '') === `${basePath}${path}` &&
		url.search === '' &&
		url.hash === '';
}

test.beforeAll(async () => {
	const deployment = test.info().project.metadata as {
		mode: 'php-static' | 'js-ssr';
		basePath: string;
		outDir: string;
	};
	basePath = deployment.basePath;
	const stamp = await verifyBuildStamp(deployment.outDir, deployment.mode, basePath);
	expect(stamp.ok, stamp.error).toBe(true);
	server = await startPhpAndSidecar(deployment);
	origin = `http://127.0.0.1:${server.port}`;
});

test.afterAll(async () => {
	if (server) await server.cleanup();
});

test('hydrates, navigates, submits actions, and uploads under its base path', async ({ page }) => {
	const errors: string[] = [];
	const failedAssets: string[] = [];
	page.on('pageerror', (error) => errors.push(error.message));
	const isClientAsset = (type: string, url: string) =>
		['script', 'stylesheet', 'image', 'font'].includes(type) && new URL(url).origin === origin;
	page.on('requestfailed', (request) => {
		if (isClientAsset(request.resourceType(), request.url())) {
			failedAssets.push(`${request.failure()?.errorText}: ${request.url()}`);
		}
	});
	page.on('response', (response) => {
		if (
			response.status() >= 400 &&
			isClientAsset(response.request().resourceType(), response.url())
		) {
			failedAssets.push(`HTTP ${response.status()}: ${response.url()}`);
		}
	});
	const home = await page.goto(`${origin}${basePath}/`);
	expect(home?.status()).toBe(200);
	await expect(
		page.getByRole('heading', { name: 'SvelteKit PHP Adapter', exact: true })
	).toBeVisible();

	await page.getByRole('link', { name: 'Client-Side Rendering (Hydration)' }).click();
	await expect(page).toHaveURL(atRoute('/client-side'));
	await expect(page.getByRole('heading', { name: '✔ Hydrated' })).toBeVisible();
	await page.evaluate(() => Object.assign(window, { kit3NavigationProof: true }));
	await page.getByRole('link', { name: 'Back to Home' }).click();
	await page.getByRole('link', { name: 'Form Actions (POST)' }).click();
	await expect(page).toHaveURL(atRoute('/form-basic'));
	expect(await page.evaluate(() => Reflect.get(window, 'kit3NavigationProof'))).toBe(true);
	await page.getByRole('textbox').fill('kit3-browser');
	const successResponse = page.waitForResponse(
		(response) => response.request().method() === 'POST' && response.url().includes('/form-basic')
	);
	await page.getByRole('button', { name: 'Submit' }).click();
	expect((await successResponse).status()).toBe(200);
	await expect(page.locator('pre')).toContainText('kit3-browser');

	await page.getByRole('textbox').fill('fail');
	const failureResponse = page.waitForResponse(
		(response) => response.request().method() === 'POST' && response.url().includes('/form-basic')
	);
	await page.getByRole('button', { name: 'Submit' }).click();
	expect((await failureResponse).status()).toBe(400);
	await expect(page.locator('pre')).toContainText('invalid');

	// Non-prerendered PHP-static pages use the documented client fallback.
	await page.getByRole('link', { name: 'Back to Home' }).click();
	await page.getByRole('link', { name: 'Multipart Form Actions', exact: true }).click();
	await expect(page).toHaveURL(atRoute('/actions/multipart'));
	expect(await page.evaluate(() => Reflect.get(window, 'kit3NavigationProof'))).toBe(true);
	await page.getByLabel('Title', { exact: true }).fill('Kit 3 browser proof');
	await page.getByLabel('Description').fill('Synthetic multipart verification');
	await page.locator('input[type="file"]').setInputFiles({
		name: 'kit3-proof.txt',
		mimeType: 'text/plain',
		buffer: Buffer.from('kit3-upload')
	});
	await expect(page.locator('.file-info')).toContainText('kit3-proof.txt');
	await page.getByRole('checkbox').check();
	const uploadResponse = page.waitForResponse(
		(response) =>
			response.request().method() === 'POST' && response.url().includes('/actions/multipart')
	);
	await page.getByRole('button', { name: 'Upload File' }).click();
	const uploaded = await uploadResponse;
	expect(uploaded.status()).toBe(200);
	expect(await uploaded.text()).toContain('kit3-proof.txt');
	await expect(page.locator('.success')).toContainText('kit3-proof.txt');
	expect(errors).toEqual([]);
	expect(failedAssets).toEqual([]);
});

test('preserves parameterized links, breadcrumbs, and readiness downloads', async ({ page }) => {
	await page.goto(`${origin}${basePath}/optional/test-id`);
	await expect(page.getByRole('heading', { name: 'Route with ID: test-id' })).toBeVisible();
	await expect(page.getByRole('link', { name: '/optional/123', exact: true })).toHaveAttribute(
		'href',
		`${basePath}/optional/123`
	);
	await page.goto(`${origin}${basePath}/path-viewer/docs/readme.md`);
	await expect(page.getByRole('heading', { name: 'Path: docs/readme.md' })).toBeVisible();
	const breadcrumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
	await expect(breadcrumbs.getByRole('link', { name: 'Root', exact: true })).toHaveAttribute(
		'href',
		`${basePath}/path-viewer`
	);
	await expect(breadcrumbs.getByRole('link', { name: 'docs', exact: true })).toHaveAttribute(
		'href',
		`${basePath}/path-viewer/docs`
	);
	await page.goto(`${origin}${basePath}/alpha-readiness`);
	const report = page.getByRole('link', { name: 'Download report JSON', exact: true });
	await expect(report).toHaveAttribute('href', `${basePath}/alpha-readiness/report.json`);
	const [download] = await Promise.all([page.waitForEvent('download'), report.click()]);
	expect(download.suggestedFilename()).toBe('sveltekit-php-alpha-readiness-report.json');
	const stream = await download.createReadStream();
	const chunks: Buffer[] = [];
	for await (const chunk of stream) chunks.push(Buffer.from(chunk));
	const payload = JSON.parse(Buffer.concat(chunks).toString('utf8'));
	expect(payload).toHaveProperty('target');
	expect(payload.readinessAreas).toEqual(expect.any(Array));
});

test('keeps csr=false documents and private output boundaries', async ({ page, request }) => {
	const response = await page.goto(`${origin}${basePath}/alpha-readiness/no-hydration`);
	expect(response?.status()).toBe(200);
	await expect(page.getByRole('heading', { name: 'No hydration prerender fixture' })).toBeVisible();
	const html = await response!.text();
	expect(html).toContain('csr-disabled-prerender-contract');
	expect(html).not.toMatch(/<script\b|sveltekit:start|data-sveltekit-hydrate/i);
	for (const privatePath of ['/.server/server/index.js', '/_protected/runtime.php']) {
		const denied = await request.get(`${origin}${basePath}${privatePath}`);
		expect(denied.status()).toBe(403);
		expect(await denied.text()).not.toContain('<?php');
	}
	const missing = await request.get(`${origin}${basePath}/_app/immutable/kit3-missing.js`, {
		maxRedirects: 0
	});
	expect(missing.status()).toBe(404);
	// PHP's default Content-Type can be text/html even for a plain error body.
	// Verify this is a real miss rather than a successful SPA document fallback.
	expect(await missing.text()).not.toMatch(/<!doctype|<html\b|sveltekit:start|<script\b/i);
});

test('preserves native form rendering without JavaScript in js-ssr', async ({
	browser
}, testInfo) => {
	test.skip(testInfo.project.metadata.mode !== 'js-ssr', 'PHP-static actions use client fallback');
	const device = testInfo.project.use;
	const context = await browser.newContext({
		javaScriptEnabled: false,
		viewport: device.viewport,
		isMobile: device.isMobile,
		hasTouch: device.hasTouch,
		deviceScaleFactor: device.deviceScaleFactor,
		userAgent: device.userAgent
	});
	try {
		const page = await context.newPage();
		await page.goto(`${origin}${basePath}/form-basic`);
		await page.getByRole('textbox').fill('native-kit3');
		await Promise.all([
			page.waitForNavigation(),
			page.getByRole('button', { name: 'Submit' }).click()
		]);
		await expect(page.locator('pre')).toContainText('native-kit3');
		await page.getByRole('textbox').fill('fail');
		const [failure] = await Promise.all([
			page.waitForNavigation(),
			page.getByRole('button', { name: 'Submit' }).click()
		]);
		expect(failure?.status()).toBe(400);
		await expect(page.locator('pre')).toContainText('invalid');
	} finally {
		await context.close();
	}
});
