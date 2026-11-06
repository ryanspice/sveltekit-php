import { describe, expect, it } from 'vitest';
import { copyFileSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { runInNewContext } from 'node:vm';
import { stringify, unflatten } from 'devalue';
import { fixture } from '../helpers/runtime-security';
import { getBootstrapPhp, getDataPhp } from '../../adapter/src/runtime/php-templates';

const shared = { flag: true };
const pageData = {
	id: 'test-id',
	repeated: 'test-id',
	sharedA: shared,
	sharedB: shared,
	nested: { enabled: true, nullable: null, emptyObject: {}, emptyList: [] },
	values: [null, false, 0, 'text']
};
const template = JSON.stringify({
	type: 'data',
	nodes: [null, { type: 'data', data: JSON.parse(stringify(pageData)), uses: { params: ['id'] } }]
});

function generate(base: string, deferred = false) {
	const owned = fixture();
	mkdirSync(path.join(owned.root, '_runtime'));
	copyFileSync('adapter/src/runtime/php-compat.php', path.join(owned.root, '_runtime/compat.php'));
	const includes = [
		`function root_load($event) { return ['layout' => 'root', 'enabled' => true, 'nullable' => null]; }`,
		...(deferred
			? [
					`function page_load($event) { return ['ready' => true, 'pending' => sk_defer(fn() => ['resolved' => true])]; }`
				]
			: [])
	];
	const loads = deferred ? "['0' => 'root_load', '1' => 'page_load']" : "['0' => 'root_load']";
	writeFileSync(
		path.join(owned.root, '__data.php'),
		getDataPhp(includes, base)
			.replaceAll('PLACEHOLDER_ROUTE_REGEX', '~^/optional/([^/]+)/?$~')
			.replaceAll('PLACEHOLDER_ROUTE_PARAM_MAP', "['1' => 'id']")
			.replaceAll('PLACEHOLDER_ROUTE_ID', "'/optional/[id]'")
			.replaceAll('PLACEHOLDER_TEMPLATE_B64', Buffer.from(template).toString('base64'))
			.replaceAll('PLACEHOLDER_LOAD_FNS', loads)
			.replaceAll('PLACEHOLDER_APP_ID', 'fixtureApp')
			.replaceAll('PLACEHOLDER_INLINE_MODE', "'nodes'")
	);
	writeFileSync(
		path.join(owned.root, 'index.php'),
		getBootstrapPhp('/optional/[id]', loads, template, 'nodes').replaceAll(
			'PLACEHOLDER_APP_ID',
			'fixtureApp'
		) + '<script>globalThis.payload = <?php echo $dataPayload; ?>;</script>'
	);
	const execute = (file: string) => {
		const target = path.join(owned.root, file).replaceAll('\\', '/');
		const uri = `${base}/optional/test-id${file === '__data.php' ? '/__data.json' : '/'}`;
		const php = `<?php $_SERVER['REQUEST_METHOD']='GET'; $_SERVER['REQUEST_URI']=${JSON.stringify(uri)}; $_SERVER['SCRIPT_FILENAME']=${JSON.stringify(target)}; $_SERVER['QUERY_STRING']=''; require ${JSON.stringify(target)};`;
		const result = spawnSync('php', ['-n'], { cwd: owned.root, input: php, encoding: 'utf8' });
		expect(result.status, result.stderr).toBe(0);
		return result.stdout;
	};
	return { execute, root: owned.root };
}

function decodeWithPhp(data: unknown) {
	const f = generate('');
	const target = path.join(f.root, '__data.php').replaceAll('\\', '/');
	const encoded = Buffer.from(JSON.stringify(data)).toString('base64');
	const php = `<?php $_SERVER['REQUEST_METHOD']='GET'; $_SERVER['REQUEST_URI']='/'; $_SERVER['SCRIPT_FILENAME']='decoder.php'; $_SERVER['QUERY_STRING']=''; require ${JSON.stringify(target)};
try { $decoded = sk_unflatten(json_decode(base64_decode('${encoded}'))); echo sk_json_encode(['value' => $decoded, 'sharedIdentity' => is_object($decoded) && isset($decoded->left, $decoded->right) && $decoded->left === $decoded->right]); }
catch (RuntimeException $error) { echo sk_json_encode(['rejected' => $error->getMessage()]); }`;
	const result = spawnSync('php', ['-n'], {
		cwd: f.root,
		input: php,
		encoding: 'utf8',
		timeout: 5000
	});
	expect(result.status, result.stderr || result.error?.message).toBe(0);
	return JSON.parse(result.stdout);
}

describe('PHP document hydration uses decoded data while navigation uses the devalue wire format', () => {
	it.each(['', '/sites/demo'])(
		'preserves actual emitted root/leaf objects, references and simple values at base %s',
		(base) => {
			const f = generate(base);
			const document = f.execute('index.php');
			const expression = document.match(/globalThis[.]payload = ([\s\S]*?);<\/script>/)?.[1];
			expect(expression).toBeTruthy();
			const inline = JSON.parse(expression!);
			expect(inline[0].data).toEqual({ layout: 'root', enabled: true, nullable: null });
			expect(inline[1].data).toEqual(pageData);
			expect(Array.isArray(inline[1].data)).toBe(false);
			const endpoint = JSON.parse(f.execute('__data.php'));
			expect(Array.isArray(endpoint.nodes[1].data)).toBe(true);
			expect(unflatten(endpoint.nodes[1].data)).toEqual(pageData);
		}
	);
	it('keeps deferred values as application defer calls in documents and flattened values in navigation', () => {
		const f = generate('', true);
		const document = f.execute('index.php');
		const expression = document.match(/globalThis[.]payload = ([\s\S]*?);<\/script>/)?.[1];
		expect(expression).toContain('fixtureApp.defer(1)');
		const inline = runInNewContext(`(${expression})`, {
			fixtureApp: { defer: (id: number) => ({ deferred: id }) }
		});
		expect(inline[1].data).toEqual({ ready: true, pending: { deferred: 1 } });
		const endpoint = JSON.parse(f.execute('__data.php'));
		expect(unflatten(endpoint.nodes[1].data)).toEqual({ ready: true, pending: { resolved: true } });
	});
	it('memoizes ordinary shared object references without losing their decoded values', () => {
		expect(decodeWithPhp([{ left: 1, right: 1 }, { flag: 2 }, true])).toEqual({
			value: { left: { flag: true }, right: { flag: true } },
			sharedIdentity: true
		});
	});
	const deep = Array.from({ length: 258 }, (_, index) =>
		index === 257 ? null : { child: index + 1 }
	);
	const expanding = Array.from({ length: 41 }, (_, index) =>
		index === 40 ? true : { left: index + 1, right: index + 1 }
	);
	const delayedReuse = [
		{ short: 1, long: 202 },
		...Array.from({ length: 200 }, (_, index) => ({ child: index + 2 })),
		true,
		...Array.from({ length: 100 }, (_, index) => ({ child: index === 99 ? 1 : index + 203 }))
	];
	it.each([
		['cycle', [{ self: 0 }], 'Cyclic devalue'],
		['Date tag', [['Date', 1], '2026-10-23T00:00:00.000Z'], 'Unsupported devalue tag'],
		['Map tag', [['Map', 1, 2], 'key', 'value'], 'Unsupported devalue tag'],
		['Set tag', [['Set', 1], 'value'], 'Unsupported devalue tag'],
		['negative sentinel', [{ missing: -1 }], 'non-JSON sentinel'],
		['missing reference', [{ missing: 99 }], 'Unsupported devalue reference'],
		['excess depth', deep, 'maximum depth 256'],
		['cached subtree reused beyond the depth limit', delayedReuse, 'maximum depth 256'],
		['shared subtree expansion', expanding, 'expanded node limit 100000']
	])('rejects %s clearly in the PHP JSON-compatible decoder', (_name, data, reason) => {
		expect(decodeWithPhp(data)).toEqual({ rejected: expect.stringContaining(reason as string) });
	});
});
