import { buildAlphaReadinessReport } from '#lib/alpha-readiness.ts';
import { renderAlphaReadinessMarkdown } from '#lib/alpha-readiness-markdown.ts';

export const prerender = true;

export function GET() {
	return new Response(renderAlphaReadinessMarkdown(buildAlphaReadinessReport()), {
		headers: {
			'content-type': 'text/markdown; charset=utf-8',
			'cache-control': 'public, max-age=300'
		}
	});
}
