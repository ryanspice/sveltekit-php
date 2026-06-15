import { buildAlphaReadinessReport } from '$lib/alpha-readiness';
import { renderAlphaCommunitySourceMapSvg } from '$lib/alpha-community-source-map-svg';

export const prerender = true;

export function GET() {
	return new Response(renderAlphaCommunitySourceMapSvg(buildAlphaReadinessReport()), {
		headers: {
			'content-type': 'image/svg+xml; charset=utf-8',
			'cache-control': 'public, max-age=300'
		}
	});
}
