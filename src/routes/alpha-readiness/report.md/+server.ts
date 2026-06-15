import { buildAlphaReadinessReport } from '$lib/alpha-readiness';
import { renderAlphaReadinessMarkdown } from '$lib/alpha-readiness-markdown';

export const prerender = true;

export function GET() {
	return new Response(renderAlphaReadinessMarkdown(buildAlphaReadinessReport()), {
		headers: {
			'content-type': 'text/markdown; charset=utf-8',
			'cache-control': 'public, max-age=300'
		}
	});
}
