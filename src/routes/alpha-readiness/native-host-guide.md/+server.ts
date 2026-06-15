import { renderAlphaNativeHostGuideMarkdown } from '$lib/alpha-native-host-guide';
import { buildAlphaReadinessReport } from '$lib/alpha-readiness';

export const prerender = true;

export function GET() {
	return new Response(renderAlphaNativeHostGuideMarkdown(buildAlphaReadinessReport()), {
		headers: {
			'content-type': 'text/markdown; charset=utf-8',
			'cache-control': 'public, max-age=300'
		}
	});
}
