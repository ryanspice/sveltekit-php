import { describe, it, expect } from 'vitest';
import path from 'node:path';
import {
	posixify,
	stripLeadingSlash,
	toPhpIdentifier,
	fnPrefixForServerFile,
	phpRelToRootFromNav
} from '../../adapter/src/utils/paths.ts';

describe('paths utils', () => {
	it('posixify normalizes separators', () => {
		const input = ['a', 'b', 'c'].join(path.sep);
		expect(posixify(input)).toBe('a/b/c');
	});

	it('stripLeadingSlash removes only the first slash', () => {
		expect(stripLeadingSlash('/foo/bar')).toBe('foo/bar');
		expect(stripLeadingSlash('foo/bar')).toBe('foo/bar');
	});

	it('toPhpIdentifier normalizes names safely', () => {
		expect(toPhpIdentifier('a-b.c')).toBe('a_b_c');
		expect(toPhpIdentifier('1abc')).toBe('_1abc');
	});

	it('fnPrefixForServerFile produces stable prefixes', () => {
		expect(fnPrefixForServerFile('(app)/blog/+page.server.php')).toBe('sk__app__blog_page_server');
		expect(fnPrefixForServerFile('api/ping/+server.php')).toBe('sk_api_ping_server');
	});

	it('phpRelToRootFromNav builds relative paths', () => {
		expect(phpRelToRootFromNav('/')).toBe('./');
		expect(phpRelToRootFromNav('/a/')).toBe('./../');
		expect(phpRelToRootFromNav('/a/b/')).toBe('./../../');
	});
});
