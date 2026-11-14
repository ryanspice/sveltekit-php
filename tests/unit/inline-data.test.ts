import { describe, expect, it } from 'vitest';
import {
	detectInlineDataModeFromHtml,
	replaceInlineConstData
} from '../../adapter/src/utils/html.ts';

const boot = (data = '[null, {type:"data", data:{message:"KIT"}}]') =>
	`<script nonce="test">__sveltekit_test = {}; kit.start(app, element, {node_ids:[0, 2], data:${data}, form:null, error:null});</script>`;

describe('inline Kit hydration data', () => {
	it('replaces only bootstrap data after visible code samples', () => {
		const sample = '<pre>const data = ["EXAMPLE"]; data: {example:true}</pre>';
		const output = replaceInlineConstData(sample + boot());
		expect(output).toContain(sample);
		expect(output).not.toContain('message:"KIT"');
		expect(output?.match(/echo \$dataPayload/g)).toHaveLength(1);
		expect(detectInlineDataModeFromHtml(sample + boot())).toBe('nodes');
	});
	it.each([
		'<pre>const data = [1, 2];</pre>',
		'<script>const data = [1, 2];</script>',
		'<script type="application/json">{"data":[],"node_ids":[0,2]}</script>',
		`<!-- ${boot()} -->`,
		`<textarea>${boot()}</textarea>`,
		`<template>${boot()}</template>`,
		`<noscript>${boot()}</noscript>`,
		'<script>const sample = "kit.start(app, element, {node_ids:[0,2], data:[]})";</script>',
		'<script>/* kit.start(app, element, {node_ids:[0,2], data:[]}) */</script>',
		'<script src="app.js">kit.start(app, element, {node_ids:[0,2], data:[]})</script>'
	])('leaves non-bootstrap or inert content unchanged: %s', (html) => {
		expect(replaceInlineConstData(html)).toBeNull();
		expect(detectInlineDataModeFromHtml(html)).toBe('unknown');
	});
	it.each([
		'kit.start(app, element, ',
		'app.start(element, ',
		'__sveltekit_test.app.start(element, '
	])('handles the Kit split/single/inline start form %s', (start) => {
		const html = `<script>${start}{node_ids:[0,2], data:[null,{data:{nested:["\\" ]", {value:1}]}}], form:null});</script>`;
		const output = replaceInlineConstData(html);
		expect(output).toContain('echo $dataPayload');
		expect(output).toContain('form:null');
		expect(output).not.toContain('nested:');
	});
	it.each(['const', 'let', 'var'])('supports a referenced %s data literal', (kind) => {
		const html = `<script>${kind} data = [null, null]; kit.start(app, element, {node_ids:[0,2], data:data});</script>`;
		expect(replaceInlineConstData(html)).toContain(`${kind} data = (function()`);
		expect(detectInlineDataModeFromHtml(html)).toBe('nodes');
	});
	it('detects object payload mode from the selected bootstrap, not an earlier sample', () => {
		const html = '<pre>const data = [];</pre>' + boot('{nodes:[null,null]}');
		expect(detectInlineDataModeFromHtml(html)).toBe('payload');
		expect(replaceInlineConstData(html)).toContain('<pre>const data = [];</pre>');
	});
	it('does not change a nested data property or a sibling form/error value', () => {
		const html = boot('[null,{data:{example:"data: []", nested:{data:[1]}}}]');
		expect(replaceInlineConstData(html)).toContain('form:null, error:null');
	});
	it('ignores regular expressions and template strings containing bootstrap signatures', () => {
		const fake = 'kit.start(app, element, {node_ids:[0,2], data:[]})';
		expect(
			replaceInlineConstData(
				`<script>const sample = /${fake}/; const other = \`${fake}\`;</script>`
			)
		).toBeNull();
	});
	it('skips nested template interpolations in an inline client bundle before the real bootstrap', () => {
		const bundle =
			'<script>const sample = `outer ${(() => { return `inner ${"kit.start(app, element, {node_ids:[0,2], data:[]})"}`; })()}`;';
		const html = bundle + boot().slice('<script nonce="test">'.length);
		expect(replaceInlineConstData(html)).toContain(bundle);
		expect(replaceInlineConstData(html)).not.toContain('message:"KIT"');
	});
	it('fails closed on malformed and ambiguous bootstraps', () => {
		for (const html of [boot('[null'), boot() + boot(), boot().replace('data:', 'metadata:')]) {
			expect(replaceInlineConstData(html)).toBeNull();
			expect(detectInlineDataModeFromHtml(html)).toBe('unknown');
		}
	});
});
