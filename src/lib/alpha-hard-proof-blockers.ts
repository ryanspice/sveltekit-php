export type AlphaHardProofBlocker = {
	id: string;
	marker: string;
	status:
		| 'needs-current-run-proof'
		| 'needs-hosted-proof'
		| 'needs-real-host-proof'
		| 'needs-freshness-review';
	scope: 'local' | 'hosted' | 'native-host' | 'community';
	requiredCommand: string;
	requiredArtifacts: string[];
	requiredEnvironment?: string[];
	trustLevel: string;
	blocks: string;
	reviewerAction: string;
};

export const alphaHardProofBlockers: AlphaHardProofBlocker[] = [
	{
		id: 'full-local-alpha-gate',
		marker: 'alpha-runtime-gate-ledger',
		status: 'needs-current-run-proof',
		scope: 'local',
		requiredCommand: 'bun run alpha:gate',
		requiredArtifacts: [
			'report/alpha-readiness.full.json',
			'report/alpha-release-manifest.json',
			'report/alpha-gate-matrix.json'
		],
		trustLevel: 'deterministic-local-gate-required',
		blocks: 'stable-1.0.0',
		reviewerAction:
			'Run the full local alpha gate in the current working tree before treating runtime correctness, artifact sync, and consumer smoke evidence as current.'
	},
	{
		id: 'hosted-php-smoke-proof',
		marker: 'hosted-php-smoke-proof-required',
		status: 'needs-hosted-proof',
		scope: 'hosted',
		requiredCommand: 'bun run alpha:gate:hosted',
		requiredEnvironment: ['ALPHA_SMOKE_BASE_URL'],
		requiredArtifacts: ['report/alpha-remote-smoke.json', 'report/alpha-readiness.full.json'],
		trustLevel: 'requires-alpha-smoke-base-url-for-pass-evidence',
		blocks: 'stable-1.0.0',
		reviewerAction:
			'Run hosted smoke against a real deployed PHP host without URL credentials and confirm report/alpha-remote-smoke.json has status=passed before claiming hosted PHP behavior is proven for that target.'
	},
	{
		id: 'packed-consumer-install-import-proof',
		marker: 'packed-consumer-install-import-proof',
		status: 'needs-current-run-proof',
		scope: 'local',
		requiredCommand: 'bun run alpha:consumer:smoke',
		requiredArtifacts: ['npm pack --json output', 'temporary external consumer import log'],
		trustLevel: 'packed-artifact-install-import',
		blocks: 'stable-1.0.0',
		reviewerAction:
			'Install the packed tarball into a temporary external consumer and import sveltekit-php/adapter before promoting the package.'
	},
	{
		id: 'strict-artifact-sync-proof',
		marker: 'source-to-generated-bundle-check',
		status: 'needs-current-run-proof',
		scope: 'local',
		requiredCommand: 'bun run verify:artifacts -- --strict',
		requiredArtifacts: ['adapter/src/index.ts', 'adapter/index.js'],
		trustLevel: 'source-to-generated-bundle-check',
		blocks: 'stable-1.0.0',
		reviewerAction:
			'Regenerate adapter/index.js from adapter/src/index.ts and prove checked-in generated output is not stale.'
	},
	{
		id: 'real-native-wrapper-proof',
		marker: 'real-native-host-wrapper-smoke-required',
		status: 'needs-real-host-proof',
		scope: 'native-host',
		requiredCommand: 'bun run alpha:native:smoke plus an external Windows/macOS wrapper run',
		requiredArtifacts: [
			'report/alpha-native-host-wrapper-smoke.json',
			'external native wrapper smoke transcript'
		],
		trustLevel: 'real-os-native-host-proof-required',
		blocks: 'stable-native-claim',
		reviewerAction:
			'Keep browser/PHP evidence as deterministic handoff only until an actual Windows or macOS host handles every native-window-action without fallback.'
	},
	{
		id: 'community-analytics-freshness-proof',
		marker: 'community-analytics-freshness-contract',
		status: 'needs-freshness-review',
		scope: 'community',
		requiredCommand: 'bun run alpha:report:full',
		requiredArtifacts: [
			'report/alpha-community-analytics.json',
			'report/alpha-community-analytics.md',
			'report/alpha-community-sources.csv'
		],
		trustLevel: 'directional-community-signal',
		blocks: 'fresh-community-claim',
		reviewerAction:
			'Refresh public-source analytics within the freshness window or keep community evidence framed as directional and stale-safe.'
	}
];

export function buildAlphaHardProofBlockers(): AlphaHardProofBlocker[] {
	return alphaHardProofBlockers.map((blocker) => ({
		...blocker,
		requiredArtifacts: [...blocker.requiredArtifacts],
		requiredEnvironment: blocker.requiredEnvironment ? [...blocker.requiredEnvironment] : undefined
	}));
}
