import { json } from '@sveltejs/kit';
import { buildAlphaReadinessReport } from '$lib/alpha-readiness';

export const prerender = true;

export function GET() {
	const report = buildAlphaReadinessReport();

	return json(
		{
			target: report.target,
			issued: report.issued,
			bridgeSource: report.bridgeSource,
			communitySignals: report.communitySignals,
			analyticsRows: report.analyticsRows,
			limitations: report.limitations.filter((limitation) => limitation.includes('Community analytics'))
		},
		{
			headers: {
				'cache-control': 'public, max-age=300'
			}
		}
	);
}
