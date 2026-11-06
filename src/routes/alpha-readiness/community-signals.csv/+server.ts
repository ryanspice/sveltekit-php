import { buildAlphaReadinessReport } from '#lib/alpha-readiness.ts';
import { renderCommunitySignalsCsv } from '#lib/alpha-readiness-csv.ts';

export const prerender = true;

export function GET() {
	return new Response(renderCommunitySignalsCsv(buildAlphaReadinessReport()), {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'cache-control': 'public, max-age=300'
		}
	});
}
