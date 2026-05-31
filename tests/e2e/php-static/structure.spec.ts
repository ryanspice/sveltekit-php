import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { readFile } from 'node:fs/promises';

const outDir = process.env.ADAPTER_OUT ?? 'build-e2e-php-static';
const routerPath = path.resolve(outDir, 'router.php');
let basePath = '';

test.beforeAll(async () => {
	try {
		const router = await readFile(routerPath, 'utf8');
		const match = router.match(
			/\$base\s*=\s*\$base_env\s*!==\s*false\s*\?\s*\$base_env\s*:\s*'([^']*)'/
		);
		basePath = normalizeBasePath(match?.[1] ?? '');
	} catch {
		basePath = process.env.DEPLOY_BASE || '';
	}
});

test.describe('PHP Static Output Structure', () => {
	test('Normalizes name.html to name/index.php', async () => {
		const baseFs = basePath.startsWith('/') ? basePath.slice(1) : basePath;
		const pageDir = path.join(outDir, baseFs, 'client-side');
		const indexPhp = path.join(pageDir, 'index.php');
		const legacyHtml = path.join(outDir, baseFs, 'client-side.html');

		expect(fs.existsSync(indexPhp), `Expected ${indexPhp} to exist`).toBeTruthy();
		expect(fs.existsSync(legacyHtml), `Expected ${legacyHtml} NOT to exist`).toBeFalsy();

		const content = fs.readFileSync(indexPhp, 'utf8');
		expect(content).toContain('<?php');
		// Check if __data.php is alongside
		expect(fs.existsSync(path.join(pageDir, '__data.php'))).toBeTruthy();
	});

	test('API path prefix special-casing removed', async ({ page }) => {
		// /api/demo should work as a page
		const response = await page.goto(joinBasePath(basePath, '/api/demo'));
		expect(response?.status()).toBe(200);
		await expect(page.locator('h1')).toHaveText('API Demo Page');
	});

	test('Canonicalization: status route trailingSlash behavior (never)', async ({ request }) => {
		const targetPath = joinBasePath(basePath, '/status');
		const slashPath = targetPath + '/';

		// 1. Verify correct path (no slash) works
		const resOk = await request.get(targetPath, { maxRedirects: 0 });
		expect(resOk.status()).toBe(200);

		const resRedirect = await request.get(slashPath, { maxRedirects: 0 });

		expect(resRedirect.status()).toBe(308);
		const location = resRedirect.headers()['location'];
		expect(location?.endsWith('/status')).toBeTruthy();
		expect(location?.endsWith('/status/')).toBeFalsy();
	});
});

function normalizeBasePath(value: string) {
	if (!value) return '';
	const trimmed = value.trim();
	if (trimmed === '/') return '';
	return trimmed.startsWith('/') ? trimmed.replace(/\/$/, '') : `/${trimmed.replace(/\/$/, '')}`;
}

function joinBasePath(base: string, routePath: string) {
	const route = routePath.startsWith('/') ? routePath : `/${routePath}`;
	if (!base) return route;
	return `${base}${route === '/' ? '' : route}`;
}
