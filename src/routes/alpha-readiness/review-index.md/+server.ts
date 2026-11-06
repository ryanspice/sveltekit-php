import { buildAlphaReadinessReport } from '#lib/alpha-readiness.ts';
import { renderAlphaReviewIndexMarkdown } from '#lib/alpha-review-index.ts';

export const prerender = true;

export function GET() {
	return new Response(renderAlphaReviewIndexMarkdown(buildAlphaReadinessReport()), {
		headers: {
			'content-type': 'text/markdown; charset=utf-8',
			'cache-control': 'public, max-age=300'
		}
	});
}
