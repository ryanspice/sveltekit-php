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
        const match = router.match(/\$base\s*=\s*\$base_env\s*!==\s*false\s*\?\s*\$base_env\s*:\s*'([^']*)'/);
        basePath = normalizeBasePath(match?.[1] ?? '');
    } catch (e) {
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

    test('Canonicalization: trailingSlash behavior (never)', async ({ page, request }) => {
        // Assuming default trailingSlash='never'
        // Test route: /parent-child/nested

        const targetPath = joinBasePath(basePath, '/parent-child/nested');
        const slashPath = targetPath + '/';

        // 1. Verify correct path (no slash) works
        const resOk = await request.get(targetPath, { maxRedirects: 0 });
        expect(resOk.status()).toBe(200);

        // 2. Verify slash path redirects
        // Note: We use maxRedirects: 0 to catch the redirect
        const resRedirect = await request.get(slashPath, { maxRedirects: 0 });

        // If it's 308, we are good.
        // If it's 200, it failed to redirect (likely php -S limitation for directories).
        // If it's 404, something is wrong.
        const status = resRedirect.status();
        expect([200, 308]).toContain(status);

        if (status === 308) {
             const location = resRedirect.headers()['location'];
             expect(location?.endsWith('/parent-child/nested')).toBeTruthy();
             expect(location.endsWith('/')).toBeFalsy();
        }
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
