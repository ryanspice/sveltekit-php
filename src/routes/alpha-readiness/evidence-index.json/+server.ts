import { json } from '@sveltejs/kit';
import { buildAlphaEvidenceIndex } from '#lib/alpha-evidence-index.ts';
import { buildAlphaReadinessReport } from '#lib/alpha-readiness.ts';

export const prerender = true;

export function GET() {
	return json(buildAlphaEvidenceIndex(buildAlphaReadinessReport()), {
		headers: {
			'cache-control': 'public, max-age=300'
		}
	});
}
