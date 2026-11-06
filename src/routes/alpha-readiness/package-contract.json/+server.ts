import { json } from '@sveltejs/kit';
import { buildAlphaPackageContract } from '#lib/alpha-package-contract.ts';
import { buildAlphaReadinessReport } from '#lib/alpha-readiness.ts';

export const prerender = true;

export function GET() {
	return json(buildAlphaPackageContract(buildAlphaReadinessReport()), {
		headers: {
			'cache-control': 'public, max-age=300'
		}
	});
}
