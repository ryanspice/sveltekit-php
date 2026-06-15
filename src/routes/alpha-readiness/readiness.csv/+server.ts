import { buildAlphaReadinessReport } from '$lib/alpha-readiness';
import { renderReadinessCsv } from '$lib/alpha-readiness-csv';

export const prerender = true;

export function GET() {
	return new Response(renderReadinessCsv(buildAlphaReadinessReport()), {
		headers: {
			'content-type': 'text/csv; charset=utf-8',
			'cache-control': 'public, max-age=300'
		}
	});
}
