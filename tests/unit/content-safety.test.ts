import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import SafeHtml from '../../src/lib/components/SafeHtml.svelte';

describe('plain-text content rendering', () => {
	it('escapes markup and event-handler payloads instead of emitting executable elements', () => {
		const payload = `<img src=x onerror="window.__kit3ContentExecuted=true;alert('unsafe')">`;
		const { body } = render(SafeHtml, {
			props: { html: `This is a blog post with slug: ${payload}` }
		});
		expect(body).toContain('This is a blog post with slug: &lt;img');
		expect(body).not.toContain('<img');
		expect(body).not.toContain('<script');
	});
	it('preserves ordinary text and safely escapes text punctuation', () => {
		const { body } = render(SafeHtml, {
			props: { html: 'A normal blog post & plain text <3', class: 'content' }
		});
		expect(body).toContain('class="content"');
		expect(body).toContain('A normal blog post &amp; plain text &lt;3');
	});
});
