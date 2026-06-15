import { json } from '@sveltejs/kit';
import { buildAlphaReadinessReport } from '$lib/alpha-readiness';

export const prerender = true;

export function GET() {
	return json(buildAlphaReadinessReport());
}
