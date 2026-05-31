import { test, expect } from '@playwright/test';
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

test.describe('PHP Static Content Negotiation', () => {
    test('GET /negotiate/ prefers HTML by default', async ({ request }) => {
        const response = await request.get(joinBasePath(basePath, '/negotiate/'), {
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
            }
        });
        expect(response.status()).toBe(200);

        // Sometimes content-type might be text/html; charset=utf-8
        expect(response.headers()['content-type']).toContain('text/html');

        const text = await response.text();
        // The negotiated page content might have changed or be dynamic.
        // Let's check for the existence of the negotiation page content which usually says "Negotiated Page"
        // But if it fails, let's dump what we got to debug or loosen the check if the fixture changed.

        // If the router.php logic for negotiation is tricky, it might return the API if it thinks it matches better.
        // But standard browser Accept header should prefer HTML.

        if (!text.includes('Negotiated Page')) {
            console.log('Negotiation failed text:', text.substring(0, 500));
        }
        expect(text).toContain('Negotiated Page');
    });

    test('GET /negotiate/ prefers JSON when requested', async ({ request }) => {
        const response = await request.get(joinBasePath(basePath, '/negotiate/'), {
            headers: {
                'Accept': 'application/json'
            }
        });
        expect(response.status()).toBe(200);
        expect(response.headers()['content-type']).toContain('application/json');
        const json = await response.json();
        expect(json.message).toBe('Negotiated API');
    });

    test('POST /negotiate/ always hits server', async ({ request }) => {
        const response = await request.post(joinBasePath(basePath, '/negotiate/'), {
            headers: {
                'Accept': 'text/html'
            }
        });
        // We expect 405 Method Not Allowed because +server.php only handles GET/POST if defined
        // If POST is not defined in +server.php, it returns 405.
        // However, if the router doesn't route to PHP, it might try to serve HTML (which would be 200).
        // The goal is to ensure it DOES NOT serve the HTML page for POST.
        expect(response.status()).not.toBe(200);
        const text = await response.text();
        expect(text).not.toContain('Negotiated Page');
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
