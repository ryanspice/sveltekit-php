import { buildAlphaReadinessReport } from '#lib/alpha-readiness.ts';
import { buildReleaseManifest } from '#lib/alpha-release-manifest.ts';
import { renderAlphaReleaseNotes } from '#lib/alpha-release-notes.ts';

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
