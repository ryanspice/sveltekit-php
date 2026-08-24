import { describe, expect, it } from 'vitest';
import {
	normalizeAdapterOptions,
	normalizeBasePathOption,
	normalizeFallbackOption,
	resolveContainedOutputPath
} from '../../adapter/src/utils/options.ts';

describe('adapter option validation', () => {
	it('normalizes safe defaults and root base paths', () => {
		expect(normalizeAdapterOptions()).toMatchObject({
			mode: 'php-static',
			baseMode: 'fixed',
			fallback: false
		});
		expect(normalizeBasePathOption('/')).toBe('');
		expect(normalizeFallbackOption('errors/200.html')).toBe('errors/200.html');
	});

	it.each(['../escape.html', '%2e%2e/escape.html', '%2525252e%2525252e/escape.html', '%2e%2e%5cescape.html', 'a%3fb.html', '/absolute.html', 'C:\\escape.html']) (
		'rejects unsafe fallback path %s',
		(value) => expect(() => normalizeFallbackOption(value)).toThrow(/fallback/)
	);

	it.each(['/nested/', 'nested', '/a//b', '/a/../b', '/a/%2e%2e/b', '/a%5c..%5cb', '/a%3fb']) (
		'rejects malformed base path %s',
		(value) => expect(() => normalizeBasePathOption(value)).toThrow(/basePath/)
	);

	it('rejects invalid modes and option types before adaptation', () => {
		expect(() => normalizeAdapterOptions({ mode: 'php_static' as never })).toThrow(/mode/);
		expect(() => normalizeAdapterOptions({ strict: 'yes' as never })).toThrow(/strict/);
	});

	it('keeps resolved fallback output inside its root', () => {
		expect(resolveContainedOutputPath('build', 'errors/200.html', 'fallback')).toMatch(
			/[\\/]build[\\/]errors[\\/]200\.html$/
		);
		expect(() => resolveContainedOutputPath('build', '../escape.html', 'fallback')).toThrow(
			/escaped/
		);
	});
});
