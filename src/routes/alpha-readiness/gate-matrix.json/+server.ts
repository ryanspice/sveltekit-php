import { json } from '@sveltejs/kit';
import { buildAlphaGateMatrix } from '$lib/alpha-gate-matrix';
import { buildAlphaReadinessReport } from '$lib/alpha-readiness';

export const prerender = true;

export function GET() {
	return json(buildAlphaGateMatrix(buildAlphaReadinessReport()), {
		headers: {
			'cache-control': 'public, max-age=300'
		}
	});
}
