import { renderAlphaCommunityAnalyticsMarkdown } from '$lib/alpha-community-analytics-markdown';
import { buildAlphaReadinessReport } from '$lib/alpha-readiness';

export const prerender = true;

export function GET() {
	return new Response(renderAlphaCommunityAnalyticsMarkdown(buildAlphaReadinessReport()), {
		headers: {
			'content-type': 'text/markdown; charset=utf-8',
			'cache-control': 'public, max-age=300'
		}
	});
}
