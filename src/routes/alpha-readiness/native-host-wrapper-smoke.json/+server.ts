import { json } from '@sveltejs/kit';
import { buildAlphaNativeHostWrapperSmoke } from '#lib/alpha-native-host-wrapper-smoke.ts';
import { buildAlphaReadinessReport } from '#lib/alpha-readiness.ts';

export const prerender = true;

export function GET() {
	return json(buildAlphaNativeHostWrapperSmoke(buildAlphaReadinessReport()));
}
