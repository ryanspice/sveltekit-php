import { buildAlphaReadinessReport } from '$lib/alpha-readiness';
import { renderAlphaReadinessSvg } from '$lib/alpha-readiness-svg';

export const prerender = true;

export function GET() {
	return new Response(renderAlphaReadinessSvg(buildAlphaReadinessReport()), {
		headers: {
			'content-type': 'image/svg+xml; charset=utf-8',
			'cache-control': 'public, max-age=300'
		}
	});
}
