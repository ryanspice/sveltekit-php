import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fnPrefixForServerFile, posixify } from '../../adapter/src/utils/paths.ts';
import { normalizePhpHandlerSource } from '../../adapter/src/utils/php-handlers.ts';

function findPhpRouteHandlers(dir: string): string[] {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	const files: string[] = [];

	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			files.push(...findPhpRouteHandlers(fullPath));
			continue;
		}

		if (/^\+(page\.server|layout\.server|server)\.php$/.test(entry.name)) {
			files.push(fullPath);
		}
	}

	return files;
}

describe('PHP handler normalization', () => {
	it('normalizes canonical page handlers to generated names', () => {
		const src = `<?php
function load($event) { return []; }
function action_default($event) { return ['type' => 'success']; }
`;

		const normalized = normalizePhpHandlerSource(
			src,
			'/form-basic/+page.server.php',
			'sk_form_basic_page_server'
		);

		expect(normalized).toContain('function sk_form_basic_page_server_load(');
		expect(normalized).toContain('function sk_form_basic_page_server_action_default(');
	});

	it('supports legacy prefixed page handlers and rewrites same-file references', () => {
		const src = `<?php
function sk_old_form_page_server_load($event) { return []; }
function sk_old_form_page_server_action_default($event) { return ['type' => 'success']; }
function sk_old_form_page_server_action_echo($event) {
	return sk_old_form_page_server_action_default($event);
}
`;

		const normalized = normalizePhpHandlerSource(
			src,
			'/form-basic/+page.server.php',
			'sk_form_basic_page_server'
		);

		expect(normalized).toContain('function sk_form_basic_page_server_load(');
		expect(normalized).toContain('function sk_form_basic_page_server_action_default(');
		expect(normalized).toContain('return sk_form_basic_page_server_action_default($event);');
	});

	it('rewrites same-file references between canonical action handlers', () => {
		const src = `<?php
function action_default($event) {
	return action_process($event);
}
function action_process($event) {
	return ['type' => 'success'];
}
`;

		const normalized = normalizePhpHandlerSource(
			src,
			'/actions/basic/+page.server.php',
			'sk_actions_basic_page_server'
		);

		expect(normalized).toContain('function sk_actions_basic_page_server_action_default(');
		expect(normalized).toContain('function sk_actions_basic_page_server_action_process(');
		expect(normalized).toContain('return sk_actions_basic_page_server_action_process($event);');
	});

	it('supports legacy prefixed layout handlers', () => {
		const src = `<?php
function sk_old_layout_layout_server_load($event) { return ['section' => 'old']; }
`;

		const normalized = normalizePhpHandlerSource(
			src,
			'/layout/+layout.server.php',
			'sk_layout_layout_server'
		);

		expect(normalized).toContain('function sk_layout_layout_server_load(');
	});

	it('normalizes endpoint methods', () => {
		const src = `<?php
function GET($event) { return ['body' => 'ok']; }
`;

		const normalized = normalizePhpHandlerSource(src, '/api/ping/+server.php', 'sk_api_ping_server');

		expect(normalized).toContain('function sk_api_ping_server_GET(');
	});

	it('supports legacy prefixed endpoint methods', () => {
		const src = `<?php
function sk_old_api_server_GET($event) { return ['body' => 'ok']; }
`;

		const normalized = normalizePhpHandlerSource(src, '/api/ping/+server.php', 'sk_api_ping_server');

		expect(normalized).toContain('function sk_api_ping_server_GET(');
	});

	it('fails fast for non-standard handler-shaped exports', () => {
		const src = `<?php
function actionDefault($event) { return []; }
`;

		expect(() =>
			normalizePhpHandlerSource(src, '/bad/+page.server.php', 'sk_bad_page_server')
		).toThrow(/Unsupported PHP handler export/);
	});

	it('normalizes every checked-in PHP route handler', () => {
		const routesRoot = path.resolve('src/routes');
		const handlers = findPhpRouteHandlers(routesRoot);

		expect(handlers.length).toBeGreaterThan(0);

		for (const file of handlers) {
			const rel = posixify(path.relative(routesRoot, file));
			const prefix = fnPrefixForServerFile(rel);
			const normalized = normalizePhpHandlerSource(fs.readFileSync(file, 'utf8'), `/${rel}`, prefix);

			expect(normalized, rel).toMatch(new RegExp(`function\\s+${prefix}_`));
		}
	});
});
