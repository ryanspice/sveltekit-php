import { renderAlphaReleaseChecklistMarkdown } from '#lib/alpha-release-checklist.ts';

export const prerender = true;

export function GET() {
	return new Response(renderAlphaReleaseChecklistMarkdown(), {
		headers: {
			'content-type': 'text/markdown; charset=utf-8',
			'cache-control': 'no-store'
		}
	});
}
