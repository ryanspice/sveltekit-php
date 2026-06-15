import { buildAlphaReadinessReport } from '$lib/alpha-readiness';
import { renderAlphaReadinessHtml } from '$lib/alpha-readiness-html';

export const prerender = true;

export function GET() {
	return new Response(renderAlphaReadinessHtml(buildAlphaReadinessReport()), {
		headers: {
			'content-type': 'text/html; charset=utf-8',
			'cache-control': 'public, max-age=300'
		}
	});
}
