import { json } from '@sveltejs/kit';
import { buildAlphaReadinessReport } from '$lib/alpha-readiness';
import { buildReleaseManifest } from '$lib/alpha-release-manifest';

export const prerender = true;

export function GET() {
	return json(buildReleaseManifest(buildAlphaReadinessReport()), {
		headers: {
			'cache-control': 'public, max-age=300'
		}
	});
}
