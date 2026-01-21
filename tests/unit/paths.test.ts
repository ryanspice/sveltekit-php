import { test } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {
	posixify,
	stripLeadingSlash,
	toPhpIdentifier,
	fnPrefixForServerFile,
	phpRelToRootFromNav
} from '../../adapter/src/utils/paths.ts';

test('posixify normalizes separators', () => {
	const input = ['a', 'b', 'c'].join(path.sep);
	assert.equal(posixify(input), 'a/b/c');
});

test('stripLeadingSlash removes only the first slash', () => {
	assert.equal(stripLeadingSlash('/foo/bar'), 'foo/bar');
	assert.equal(stripLeadingSlash('foo/bar'), 'foo/bar');
});

test('toPhpIdentifier normalizes names safely', () => {
	assert.equal(toPhpIdentifier('a-b.c'), 'a_b_c');
	assert.equal(toPhpIdentifier('1abc'), '_1abc');
});

test('fnPrefixForServerFile produces stable prefixes', () => {
	assert.equal(fnPrefixForServerFile('(app)/blog/+page.server.php'), 'sk__app__blog_page_server');
	assert.equal(fnPrefixForServerFile('api/ping/+server.php'), 'sk_api_ping_server');
});

test('phpRelToRootFromNav builds relative paths', () => {
	assert.equal(phpRelToRootFromNav('/'), './');
	assert.equal(phpRelToRootFromNav('/a/'), './../');
	assert.equal(phpRelToRootFromNav('/a/b/'), './../../');
});
