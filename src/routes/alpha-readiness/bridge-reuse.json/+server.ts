import { json } from '@sveltejs/kit';
import { buildBridgeReuseInventory } from '$lib/alpha-bridge-reuse';
import { buildAlphaReadinessReport } from '$lib/alpha-readiness';

export const prerender = true;

export function GET() {
	return json(buildBridgeReuseInventory(buildAlphaReadinessReport()), {
		headers: {
			'cache-control': 'public, max-age=300'
		}
	});
}
