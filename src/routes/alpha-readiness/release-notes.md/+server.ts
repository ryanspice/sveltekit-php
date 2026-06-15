import { buildAlphaReadinessReport } from '$lib/alpha-readiness';
import { buildReleaseManifest } from '$lib/alpha-release-manifest';
import { renderAlphaReleaseNotes } from '$lib/alpha-release-notes';

export const prerender = true;

export function GET() {
	const report = buildAlphaReadinessReport();

	return new Response(renderAlphaReleaseNotes(report, buildReleaseManifest(report)), {
		headers: {
			'content-type': 'text/markdown; charset=utf-8',
			'cache-control': 'public, max-age=300'
		}
	});
}
