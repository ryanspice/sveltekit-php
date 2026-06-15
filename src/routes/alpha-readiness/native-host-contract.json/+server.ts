import { buildAlphaNativeHostContract } from '$lib/alpha-native-host-contract';
import { buildAlphaReadinessReport } from '$lib/alpha-readiness';

export const prerender = true;

export function GET() {
	return new Response(JSON.stringify(buildAlphaNativeHostContract(buildAlphaReadinessReport()), null, 2), {
		headers: {
			'content-type': 'application/json; charset=utf-8',
			'cache-control': 'public, max-age=300'
		}
	});
}
