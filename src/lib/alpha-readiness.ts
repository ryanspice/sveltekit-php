import { requiredAlphaEvidence } from './alpha-required-evidence';

export type AlphaReadinessStatus = 'ready' | 'watch' | 'blocked';

export type AlphaBridgePattern = {
	label: string;
	source: string;
	adopted: string;
	status: 'adopted' | 'planned';
};

export type AlphaReadinessArea = {
	id: string;
	title: string;
	description: string;
	score: number;
	status: AlphaReadinessStatus;
	evidence: string[];
	gap: string;
};

export type AlphaCommunitySignal = {
	id: string;
	keyword: string;
	intent: string;
	metric: number;
	communities: { label: string; href: string }[];
};

export type AlphaAnalyticsRow = {
	label: string;
	value: number;
};

export type AlphaReadinessReport = {
	target: string;
	issued: string;
	releasePolicy: AlphaReleasePolicy;
	proofLedger: AlphaProofLedgerItem[];
	overallScore: number;
	summary: Record<AlphaReadinessStatus, number>;
	bridgeSource: string;
	bridgePatterns: AlphaBridgePattern[];
	readinessAreas: AlphaReadinessArea[];
	communitySignals: AlphaCommunitySignal[];
	analyticsRows: AlphaAnalyticsRow[];
	limitations: string[];
};

export type AlphaReleasePolicy = {
	marker: 'alpha-over-rc-release-policy';
	channel: 'alpha';
	track: '1.0.2-alpha';
	rank: 'above-rc';
	requiredTargetPattern: string;
	requiredEvidence: string[];
	disallowedChannels: string[];
	releaseRule: string;
	stablePromotionRule: string;
};

export type AlphaProofLedgerItem = {
	id: string;
	marker: string;
	status: 'alpha-ready' | 'needs-local-gate-proof' | 'needs-hosted-proof' | 'stable-blocker';
	proves: string;
	evidence: string[];
	stableBlocker: string;
};

export const alphaTarget = '1.0.2-alpha.0';
export const reportIssued = '2026-06-01';
export const bridgeSource = 'B:/Dev/GPTLIGHTINGSTRENGTHTEST/lg-ultragear-bridge';

export const alphaReleasePolicy: AlphaReleasePolicy = {
	marker: 'alpha-over-rc-release-policy',
	channel: 'alpha',
	track: '1.0.2-alpha',
	rank: 'above-rc',
	requiredTargetPattern: '^1\\.0\\.0-alpha\\.\\d+$',
	requiredEvidence: requiredAlphaEvidence,
	disallowedChannels: ['rc', 'stable', 'latest'],
	releaseRule:
		'1.0.2-alpha is the explicit release track for this corrective pass and must not be downgraded into an RC-shaped handoff.',
	stablePromotionRule:
		'Stable 1.0.0 remains blocked until the full alpha gate, hosted PHP smoke, artifact sync, packed consumer smoke, and clean deployment evidence pass.'
};

export const alphaProofLedger: AlphaProofLedgerItem[] = [
	{
		id: 'alpha-channel-policy',
		marker: 'alpha-over-rc-release-policy',
		status: 'alpha-ready',
		proves: 'The requested release track is 1.0.2-alpha and is explicitly separated from RC, stable, and latest channels.',
		evidence: [
			'package.json version',
			'/alpha-readiness/report.json releasePolicy',
			'/alpha-readiness/report.json requiredEvidence',
			'/alpha-readiness/release-manifest.json releasePolicy',
			'/alpha-readiness/release-notes.md'
		],
		stableBlocker:
			'Stable remains blocked until hosted PHP smoke, packed consumer install, strict artifact sync, and full gate evidence pass.'
	},
	{
		id: 'ultragear-native-visual-provenance',
		marker: 'native-visual-matrix',
		status: 'alpha-ready',
		proves: 'Windows Mica, macOS traffic-light rhythm, caption controls, and browser fallback styling are traceable to the UltraGear bridge source seams.',
		evidence: [
			'src/app.ts applyWindowChrome / Effect.Mica / syncWindowProgress',
			'src/lib/bridge-ui/shell/BridgeShell.svelte',
			'src/lib/bridge-ui/shell/BridgeTopbar.svelte',
			'/alpha-readiness/native-host-contract.json nativeVisualMatrix',
			'/alpha-readiness/bridge-reuse.json ultraGearParityContract'
		],
		stableBlocker:
			'Stable OS-native proof still requires a real host wrapper smoke path; PHP/browser evidence stays a browser-safe contract.'
	},
	{
		id: 'community-keyword-analytics-linkage',
		marker: 'analytics-linked-keyword-graph',
		status: 'alpha-ready',
		proves: 'Keyword searches, public source descriptors, curated signal scores, collected demand-score fields, CSVs, Markdown, and graphics are linked for reviewer audit.',
		evidence: [
			'/alpha-readiness/community-research-pack.json keywordSearchGraph',
			'/alpha-readiness/community-source-map.svg source-to-keyword-edge',
			'/alpha-readiness/community-analytics.md',
			'/alpha-readiness/community-signals.csv',
			'/alpha-readiness/community-sources.csv'
		],
		stableBlocker:
			'Community analytics remain directional public-source evidence and are not product telemetry or complete market proof.'
	},
	{
		id: 'php-runtime-release-gates',
		marker: 'alpha-runtime-gate-ledger',
		status: 'needs-local-gate-proof',
		proves: 'Runtime route correctness, handler compatibility, path safety, deploy prechecks, artifact sync, unit checks, and consumer smoke have explicit gates.',
		evidence: [
			'bun run verify:alpha',
			'bun run verify:release-prep',
			'bun run verify:artifacts -- --strict',
			'bun run alpha:gate',
			'bun run alpha:consumer:smoke'
		],
		stableBlocker:
			'This thread has not run the full local alpha gate in the current working tree.'
	},
	{
		id: 'hosted-php-smoke-proof',
		marker: 'hosted-php-smoke-proof-required',
		status: 'needs-hosted-proof',
		proves: 'A deployed PHP host can serve runtime evidence endpoints, form actions, content types, and traversal probes.',
		evidence: [
			'ALPHA_SMOKE_BASE_URL',
			'bun run alpha:remote:smoke',
			'bun run alpha:gate:hosted',
			'report/alpha-remote-smoke.json'
		],
		stableBlocker:
			'Hosted pass evidence is missing until ALPHA_SMOKE_BASE_URL targets a real deployed PHP host and the hosted gate passes.'
	}
];

export const statusLabel: Record<AlphaReadinessStatus, string> = {
	ready: 'ready',
	watch: 'watch',
	blocked: 'blocked'
};

export const bridgePatterns: AlphaBridgePattern[] = [
	{
		label: 'Host-owned Mica and taskbar progress',
		source:
			'lg-ultragear-bridge/src/app.ts applyWindowChrome, Effect.Mica, syncWindowProgress, and ProgressBarStatus',
		adopted:
			'Alpha reports expose Mica/progress evidence as host-owned semantics while the PHP adapter remains browser-safe and deployable',
		status: 'adopted'
	},
	{
		label: 'Mica material shell',
		source:
			'lg-ultragear-bridge/src/lib/bridge-ui/tokens/theme.css and src/lib/bridge-ui/shell/BridgeShell.svelte',
		adopted:
			'Browser-safe Mica/acrylic fallback tokens, inactive-window washes, and UltraGear-derived theme slots for the adapter report surface',
		status: 'adopted'
	},
	{
		label: 'Window chrome rhythm',
		source:
			'lg-ultragear-bridge/src/lib/bridge-ui/shell/BridgeShell.svelte and src/lib/bridge-ui/shell/BridgeTopbar.svelte',
		adopted:
			'Caption-bar layout, data-marked host seams, pointer-threshold drag affordances, Windows controls, and macOS traffic-light balance',
		status: 'adopted'
	},
	{
		label: 'Structured validation export',
		source: 'lg-ultragear-bridge/src/lib/bridge-ui/pages/ValidationView.svelte report JSON download pattern',
		adopted: 'Deterministic alpha readiness JSON report with gaps, signals, and next gates',
		status: 'adopted'
	}
];

export const readinessAreas: AlphaReadinessArea[] = [
	{
		id: 'runtime-correctness',
		title: 'Runtime correctness',
		description: 'PHP handler discovery, route conversion, base-path behavior, and endpoint dispatch.',
		score: 86,
		status: 'ready',
		evidence: [
			'Legacy PHP handler normalization is in the adapter conversion path',
			'php-handlers unit coverage audits every checked-in PHP route handler for callable exports',
			'form-basic GET and POST behavior has targeted coverage',
			'Router parity checks now cover malicious path cases',
			'php-static and js-ssr generated routers share safe-path and file-serving helpers',
			'router-parity unit coverage protects the root-router delegate and generated router safety helpers'
		],
		gap: 'Needs a clean external consumer fixture before this can justify a stable 1.0.0.'
	},
	{
		id: 'deployment-safety',
		title: 'Deployment safety',
		description: 'Secret handling, environment prechecks, artifact drift prevention, and CI gates.',
		score: 78,
		status: 'watch',
		evidence: [
			'.env is placeholder-only and .env.example documents public shape',
			'Deploy precheck fails on missing, placeholder, malformed, or unsafe operational variables',
			'deploy-precheck unit coverage protects placeholder, undefined, port, path, and smoke-URL rejection',
			'Strict generated artifact sync and release-prep safety checks are wired into the alpha gate',
			'Artifact sync now compares adapter/src/index.ts against a temporary adapter/index.js build',
			'Dev-only adapters reject production and CI usage unless SK_PHP_ALLOW_DEV_ADAPTER is explicit'
		],
		gap: 'If any removed values were real credentials, rotate them before public alpha distribution.'
	},
	{
		id: 'native-shell-ux',
		title: 'Native shell UX',
		description: 'Windows 11 Mica and macOS-native visual language for reports and operator surfaces.',
		score: 64,
		status: 'watch',
		evidence: [
			'UltraGear bridge shell tokens are mapped into this browser-safe report surface',
			'No Tauri runtime dependency is introduced into the PHP adapter demo',
			'Report cards use desktop-window containment, inactive Mica fallback washes, and native caption affordances',
			'The native host contract exposes theme, frame, titlebar, platform, drag, and window-control DOM markers',
			'NativeTitlebar dispatches browser-safe native-window-action events for pointer-threshold drag and double-click maximize host binding',
			'Progress/report handoff maps UltraGear syncWindowProgress and ValidationView report export cues to deterministic alpha report artifacts'
		],
		gap: 'A real packaged desktop shell remains a separate host concern; this route is the visual/reporting contract.'
	},
	{
		id: 'community-analytics',
		title: 'Community analytics',
		description: 'Searchable external signals for demand, support burden, and competing adapter patterns.',
		score: 68,
		status: 'watch',
		evidence: [
			'Keyword map links GitHub, npm, Packagist, Svelte, PHP, and community support surfaces',
			'alpha:analytics collects supported public JSON sources into report artifacts',
			'The report keeps unsupported sources explicit instead of pretending complete telemetry exists',
			'Community source descriptors now expose evidence kind, collection risk, collection priority, proof use, and reviewer action'
		],
		gap: 'Reddit can block unauthenticated requests, and Apache/Nginx remain manual research entrypoints.'
	},
	{
		id: 'hosted-deployment',
		title: 'Hosted deployment evidence',
		description: 'Real PHP-host smoke evidence for the alpha candidate after deployment.',
		score: 68,
		status: 'watch',
		evidence: [
			'alpha:remote:smoke records hosted checks into report/alpha-remote-smoke.json',
			'alpha:gate:hosted composes the full local alpha gate with the hosted smoke',
			'Remote probes cover the alpha page, report JSON, report SVG, form route GET plus POST action, content types, traversal leak markers, live evidence gates, and evidence-index inventory'
		],
		gap: 'Needs ALPHA_SMOKE_BASE_URL pointing at a real deployed PHP host to convert this from skipped/watch to passed evidence.'
	}
];

export const communitySignals: AlphaCommunitySignal[] = [
	{
		id: 'shared-hosting',
		keyword: 'SvelteKit PHP adapter shared hosting',
		intent: 'Find comparable adapters, deployment failures, and shared-hosting demand.',
		metric: 72,
		communities: [
			{
				label: 'GitHub repos',
				href: 'https://github.com/search?q=SvelteKit+PHP+adapter+shared+hosting&type=repositories'
			},
			{
				label: 'GitHub issues',
				href: 'https://github.com/search?q=SvelteKit+PHP+adapter+shared+hosting&type=issues'
			},
			{
				label: 'Svelte discussions',
				href: 'https://github.com/sveltejs/kit/discussions?discussions_q=PHP+adapter+hosting'
			},
			{
				label: 'Apache shared-host routing research',
				href: 'https://www.google.com/search?q=Apache+PHP+shared+hosting+SvelteKit+adapter+fallback'
			}
		]
	},
	{
		id: 'php-ssr',
		keyword: 'PHP SSR JavaScript sidecar SvelteKit',
		intent: 'Track SSR sidecar tradeoffs across PHP hosts and Node-backed deployments.',
		metric: 58,
		communities: [
			{
				label: 'GitHub code',
				href: 'https://github.com/search?q=PHP+SSR+JavaScript+sidecar+SvelteKit&type=code'
			},
			{ label: 'npm packages', href: 'https://www.npmjs.com/search?q=sveltekit%20php%20adapter' },
			{ label: 'Packagist', href: 'https://packagist.org/search/?q=sveltekit' }
		]
	},
	{
		id: 'form-actions',
		keyword: 'SvelteKit form actions PHP backend',
		intent: 'Validate whether PHP-backed form actions are a real adoption path or only a demo novelty.',
		metric: 64,
		communities: [
			{
				label: 'GitHub issues',
				href: 'https://github.com/search?q=SvelteKit+form+actions+PHP+backend&type=issues'
			},
			{ label: 'Stack Overflow', href: 'https://stackoverflow.com/search?q=sveltekit+form+actions+php' },
			{ label: 'Reddit', href: 'https://www.reddit.com/search/?q=SvelteKit%20PHP%20form%20actions' }
		]
	},
	{
		id: 'php-hosting-runtime',
		keyword: 'static Svelte app PHP hosting routing fallback',
		intent: 'Compare router fallback expectations across Apache, Nginx, and constrained hosts.',
		metric: 81,
		communities: [
			{
				label: 'GitHub code',
				href: 'https://github.com/search?q=static+Svelte+PHP+hosting+router+fallback&type=code'
			},
			{
				label: 'Apache docs search',
				href: 'https://www.google.com/search?q=Apache+PHP+router+fallback+single+page+app'
			},
			{
				label: 'Nginx docs search',
				href: 'https://www.google.com/search?q=Nginx+PHP+try_files+SvelteKit+fallback'
			}
		]
	}
];

export const analyticsRows: AlphaAnalyticsRow[] = [
	{ label: 'Runtime', value: 86 },
	{ label: 'Security', value: 78 },
	{ label: 'Native UX', value: 64 },
	{ label: 'Community', value: 68 },
	{ label: 'Hosted', value: 68 }
];

export const alphaLimitations = [
	'The alpha report scores are curated release-readiness indicators, not computed telemetry.',
	'Community analytics are partial public-source evidence; Reddit can block unauthenticated requests, and Apache/Nginx remain manual research entrypoints.',
	'Hosted deployment evidence remains skipped until ALPHA_SMOKE_BASE_URL points at a real PHP-host deployment.',
	'Native shell styling is a browser-safe emulation and host contract layer, not real Windows Mica or macOS vibrancy.',
	'No publish, tag, or stable-version promotion should be applied until the alpha and hosted gates pass.'
];

export function summarizeReadiness(
	areas: AlphaReadinessArea[] = readinessAreas
): Record<AlphaReadinessStatus, number> {
	return areas.reduce<Record<AlphaReadinessStatus, number>>(
		(summary, area) => {
			summary[area.status] += 1;
			return summary;
		},
		{ ready: 0, watch: 0, blocked: 0 }
	);
}

export function calculateAlphaScore(areas: AlphaReadinessArea[] = readinessAreas): number {
	if (areas.length === 0) {
		return 0;
	}

	return Math.round(areas.reduce((total, area) => total + area.score, 0) / areas.length);
}

export function buildAlphaReadinessReport(): AlphaReadinessReport {
	return {
		target: alphaTarget,
		issued: reportIssued,
		releasePolicy: alphaReleasePolicy,
		proofLedger: alphaProofLedger,
		overallScore: calculateAlphaScore(),
		summary: summarizeReadiness(),
		bridgeSource,
		bridgePatterns,
		readinessAreas,
		communitySignals,
		analyticsRows,
		limitations: alphaLimitations
	};
}

