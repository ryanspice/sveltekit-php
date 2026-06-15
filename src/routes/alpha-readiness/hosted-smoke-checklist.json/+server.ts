import { json } from '@sveltejs/kit';
import { buildAlphaReadinessReport } from '$lib/alpha-readiness';
import { buildHostedSmokeChecklist } from '$lib/alpha-hosted-smoke-checklist';

export const prerender = true;

export function GET() {
	return json(buildHostedSmokeChecklist(buildAlphaReadinessReport()), {
		headers: {
			'cache-control': 'public, max-age=300'
		}
	});
}
