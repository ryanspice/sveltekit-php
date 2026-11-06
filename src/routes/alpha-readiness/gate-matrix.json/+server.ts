import { json } from '@sveltejs/kit';
import { buildAlphaGateMatrix } from '#lib/alpha-gate-matrix.ts';
import { buildAlphaReadinessReport } from '#lib/alpha-readiness.ts';

export const prerender = true;

export function GET() {
	return json(buildAlphaGateMatrix(buildAlphaReadinessReport()), {
		headers: {
			'cache-control': 'public, max-age=300'
		}
	});
}
