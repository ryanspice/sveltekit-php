import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import {
	parseParityArgs,
	compareResponses,
	normalizeBodyForComparison
} from '../../scripts/utils/root-router-parity.mjs';

function response(body: string, overrides = {}) {
	const normalizedBody = normalizeBodyForComparison(Buffer.from(body), 8091, '127.0.0.1');
	return {
		statusCode: 200,
		contentType: 'text/html',
		location: '',
		normalizedBody,
		normalizedBodyHash: createHash('sha256').update(normalizedBody).digest('hex'),
		...overrides
	};
}

describe('root router parity CLI', () => {
	it('selects the same build and options with spaced and equals arguments', () => {
		const expected = {
			build: 'build-e2e-php-static',
			host: '127.0.0.1',
			generatedPort: '8091',
			rootPort: '8092',
			basePath: '/base'
		};
		expect(
			parseParityArgs(Object.entries(expected).flatMap(([key, value]) => [`--${key}`, value]))
		).toEqual(expected);
		expect(
			parseParityArgs(Object.entries(expected).map(([key, value]) => `--${key}=${value}`))
		).toEqual(expected);
	});
	it.each([
		['--buid=build-e2e-php-static'],
		['--unknown', 'value'],
		['build-e2e-php-static'],
		['--build'],
		['--build', '--host=127.0.0.1'],
		['--build='],
		['--build', '   ']
	])('rejects invalid arguments %j instead of choosing another build', (...args) => {
		expect(() => parseParityArgs(args)).toThrow();
	});
	it('allows an explicit empty base path', () => {
		expect(parseParityArgs(['--basePath=']).basePath).toBe('');
	});
});

describe('root router parity response comparison', () => {
	const original =
		'{"php_engine":"PHP 8.5.12","memory_usage":765096,"count":2,"message":"route A"}';
	it('normalizes only the known layout memory value in named JSON serialization', () => {
		const changedMemory = original.replace('765096', '746224');
		expect(compareResponses(response(original), response(changedMemory)).ok).toBe(true);
	});
	it('preserves the previous positional PHP memory normalizer', () => {
		expect(
			compareResponses(response('["PHP 8.5.12",765096,2]'), response('["PHP 8.5.12",746224,2]')).ok
		).toBe(true);
	});
	it.each([
		original.replace('"count":2', '"count":3'),
		original.replace('route A', 'route B'),
		original.replace('8.5.12', '8.5.13'),
		original.replace('765096', '"765096"'),
		original.replace('765096', '-1'),
		original.replace('765096', '765096.5'),
		original.replace('765096', '765096e1'),
		original.replace('765096', '0765096'),
		original.replace('memory_usage', 'memory_usage_other')
	])('keeps actual payload differences significant: %s', (different) => {
		expect(compareResponses(response(original), response(different))).toMatchObject({
			ok: false,
			reason: expect.stringContaining('body mismatch')
		});
	});
	it('does not normalize an unrelated memory_usage field', () => {
		expect(
			compareResponses(response('{"memory_usage":1}'), response('{"memory_usage":2}')).ok
		).toBe(false);
	});
	it.each([
		[{ statusCode: 404 }, 'status mismatch'],
		[{ contentType: 'application/json' }, 'content-type mismatch'],
		[{ location: '/another-route' }, 'location mismatch']
	])('preserves response metadata differences %j', (overrides, reason) => {
		expect(compareResponses(response(original), response(original, overrides))).toMatchObject({
			ok: false,
			reason: expect.stringContaining(reason)
		});
	});
});
