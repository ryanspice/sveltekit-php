import { renderAlphaCommunityAnalyticsMarkdown } from '#lib/alpha-community-analytics-markdown.ts';
import { buildAlphaReadinessReport } from '#lib/alpha-readiness.ts';

export const prerender = true;

export function GET() {
	return new Response(renderAlphaCommunityAnalyticsMarkdown(buildAlphaReadinessReport()), {
		headers: {
			'content-type': 'text/markdown; charset=utf-8',
			'cache-control': 'public, max-age=300'
		}
	});
}
