import { json } from '@sveltejs/kit';
import { buildAlphaReadinessReport } from '$lib/alpha-readiness';
import { buildCommunityResearchPack } from '$lib/alpha-community-research-pack';

export const prerender = true;

export function GET() {
	return json(buildCommunityResearchPack(buildAlphaReadinessReport()), {
		headers: {
			'cache-control': 'public, max-age=300'
		}
	});
}
