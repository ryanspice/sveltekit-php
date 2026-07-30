import { buildAlphaHardProofBlockers, type AlphaHardProofBlocker } from './alpha-hard-proof-blockers';
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

export type AlphaLatestPackageSnapshotItem = {
	packageName: string;
	latest: string;
	currentRange: string;
	support: 'green' | 'yellow' | 'red';
	stance: string;
};

export type AlphaOfficialAdapterSnapshotItem = {
	packageName: string;
	latest: string;
	support: 'green' | 'yellow' | 'red';
	parityUse: string;
};

export type AlphaLiveConsumerEvidence = {
	marker: 'live-blog-consumer-evidence';
	reviewed: string;
	url: string;
	status: 'consumer-proof-not-hosted-fixture';
	staticNoHydration: {
		homepageStatus: number;
		robotsStatus: number;
		sitemapStatus: number;
		dataSiteRyan: boolean;
		ryanMetadataPresent: boolean;
		sveltekitStartMarkerPresent: boolean;
		moduleScriptPresent: boolean;
		sveltekitMarkerPresent: boolean;
	};
	seoAudit: {
		tool: 'seo_audit_python';
		reportId: string;
		outputDirectory: string;
		pagesScanned: number;
		score: number;
		grade: string;
		findings: {
			critical: number;
			high: number;
			medium: number;
			low: number;
			info: number;
		};
	};
	planningNotes: string[];
};

export type AlphaReadinessReport = {
	target: string;
	issued: string;
	releasePolicy: AlphaReleasePolicy;
	proofLedger: AlphaProofLedgerItem[];
	hardProofBlockerLedgerMarker: 'hard-proof-blocker-ledger';
	hardProofBlockers: AlphaHardProofBlocker[];
	overallScore: number;
	summary: Record<AlphaReadinessStatus, number>;
	bridgeSource: string;
	bridgePatterns: AlphaBridgePattern[];
	readinessAreas: AlphaReadinessArea[];
	communitySignals: AlphaCommunitySignal[];
	analyticsRows: AlphaAnalyticsRow[];
	latestPackageSnapshotReviewed: string;
	latestPackageSnapshot: AlphaLatestPackageSnapshotItem[];
	officialAdapterSnapshot: AlphaOfficialAdapterSnapshotItem[];
	liveConsumerEvidence: AlphaLiveConsumerEvidence;
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
export const reportIssued = '2026-07-06';
export const bridgeSource = 'B:/Dev/GPTLIGHTINGSTRENGTHTEST/lg-ultragear-bridge';
export const latestPackageSnapshotReviewed = '2026-07-06';

export const latestPackageSnapshot: AlphaLatestPackageSnapshotItem[] = [
	{
		packageName: 'svelte',
		latest: '5.56.4',
		currentRange: '^5.45.6',
		support: 'green',
		stance: 'Same-major alpha gate target; latest Svelte 5 is covered by the packed fixture smoke.'
	},
	{
		packageName: '@sveltejs/kit',
		latest: '2.69.1',
		currentRange: '^2.49.1',
		support: 'green',
		stance: 'Same-major alpha gate target; latest SvelteKit 2 is covered by adapter shape and packed fixture smoke.'
	},
	{
		packageName: '@sveltejs/vite-plugin-svelte',
		latest: '7.1.4',
		currentRange: '^6.2.1',
		support: 'yellow',
		stance: 'Latest major is covered by the isolated Vite 8/plugin 7 fixture smoke; do not raise the repo floor without a separate dependency-floor upgrade.'
	},
	{
		packageName: 'vite',
		latest: '8.1.3',
		currentRange: '^7.2.6',
		support: 'yellow',
		stance: 'Latest major is covered by the isolated Vite 8/plugin 7 fixture smoke; keep the current Vite 7 floor until an intentional floor upgrade is scoped.'
	}
];

export const officialAdapterSnapshot: AlphaOfficialAdapterSnapshotItem[] = [
	{
		packageName: '@sveltejs/adapter-node',
		latest: '5.5.7',
		support: 'yellow',
		parityUse: 'Origin, proxy header, client address, body-size, and lifecycle guards remain the Node-style runtime parity backlog.'
	},
	{
		packageName: '@sveltejs/adapter-static',
		latest: '3.0.10',
		support: 'green',
		parityUse: 'Prerendered static output, strict/fallback posture, trailing slash, and no-hydration fixture expectations shape php-static.'
	},
	{
		packageName: '@sveltejs/adapter-cloudflare',
		latest: '7.2.9',
		support: 'yellow',
		parityUse: 'Platform context and static/header boundary ideas inform event.platform.php and host contract docs.'
	},
	{
		packageName: '@sveltejs/adapter-netlify',
		latest: '6.0.4',
		support: 'yellow',
		parityUse: 'Forms, serverless/edge split, and platform context stay comparison inputs, not PHP runtime claims.'
	},
	{
		packageName: '@sveltejs/adapter-vercel',
		latest: '6.3.4',
		support: 'yellow',
		parityUse: 'Deployment skew, per-route deployment policy, ISR, and image optimization remain deferred or documentation-only.'
	},
	{
		packageName: '@sveltejs/adapter-auto',
		latest: '7.0.1',
		support: 'yellow',
		parityUse: 'Zero-config platform detection is not a PHP shared-hosting goal; package metadata should make the explicit adapter choice easy.'
	}
];

export const liveConsumerEvidence: AlphaLiveConsumerEvidence = {
	marker: 'live-blog-consumer-evidence',
	reviewed: '2026-07-06',
	url: 'https://blog.ryanspice.com/',
	status: 'consumer-proof-not-hosted-fixture',
	staticNoHydration: {
		homepageStatus: 200,
		robotsStatus: 200,
		sitemapStatus: 200,
		dataSiteRyan: true,
		ryanMetadataPresent: true,
		sveltekitStartMarkerPresent: false,
		moduleScriptPresent: false,
		sveltekitMarkerPresent: false
	},
	seoAudit: {
		tool: 'seo_audit_python',
		reportId: 'blog.ryanspice.com-root-20260706T204200Z-v0_4_9',
		outputDirectory:
			'B:/Temp/@Browser/seo-audit-blog-20260706/blog.ryanspice.com-root-20260706T204200Z-v0_4_9',
		pagesScanned: 32,
		score: 91,
		grade: 'A-',
		findings: {
			critical: 0,
			high: 2,
			medium: 5,
			low: 13,
			info: 1
		}
	},
	planningNotes: [
		'Homepage static HTML currently has no observed SvelteKit hydration markers and preserves Ryan metadata.',
		'Robots and sitemap returned 200 and should remain part of consumer proof for php-static public sites.',
		'Login route noindex/nofollow/thin-content/invalid-JSON-LD findings are private-route audit noise if login remains intentionally non-indexed; keep it excluded/annotated in audits or fix the JSON-LD if it becomes public.',
		'Content-template quick wins remain duplicate PixelBoats titles, weak descriptions, repeated "open copy link share" phrase noise, SVG image dimensions, and unnecessary d3 references.',
		'The blog proof is real consumer evidence for static/no-hydration behavior, but it does not replace a dedicated hosted PHP adapter fixture.'
	]
};

export const alphaReleasePolicy: AlphaReleasePolicy = {
	marker: 'alpha-over-rc-release-policy',
	channel: 'alpha',
	track: '1.0.2-alpha',
	rank: 'above-rc',
	requiredTargetPattern: '^1\\.0\\.2-alpha\\.\\d+$',
	requiredEvidence: requiredAlphaEvidence,
	disallowedChannels: ['rc', 'stable', 'latest'],
	releaseRule:
		'1.0.2-alpha is the explicit release track for this corrective pass and must not be downgraded into an RC-shaped handoff.',
	stablePromotionRule:
		'Stable 1.0.2 remains blocked until the full alpha gate, hosted PHP smoke, artifact sync, packed consumer smoke, and clean deployment evidence pass.'
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
		proves: 'Windows Mica, macOS traffic-light rhythm, macOS host-material policy boundaries, caption controls, and browser fallback styling are traceable to the UltraGear bridge source seams without claiming unverified macOS vibrancy.',
		evidence: [
			'src/app.ts applyWindowChrome / Effect.Mica / syncWindowProgress',
			'src-tauri/src/lib.rs MacosLauncher::LaunchAgent',
			'src-tauri/src/lib.rs mica_supported: cfg!(target_os = "windows")',
			'src/lib/bridge-ui/shell/BridgeShell.svelte',
			'src/lib/bridge-ui/shell/BridgeTopbar.svelte',
			'/alpha-readiness/native-host-contract.json nativeVisualMatrix',
			'/alpha-readiness/bridge-reuse.json ultraGearParityContract'
		],
		stableBlocker:
			'Stable OS-native proof still requires a real host wrapper smoke path; PHP/browser evidence stays a browser-safe contract.'
	},
	{
		id: 'native-host-compatibility-matrix',
		marker: 'native-host-compatibility-matrix',
		status: 'alpha-ready',
		proves:
			'Windows Mica effects, macOS desktop-host scaffolding, taskbar progress reporting, drag, and maximize behavior are mapped from observed UltraGear widget and Tauri shell feature-probe cues into browser-safe adapter host contracts.',
		evidence: [
			'packages/ultragear-widget-ui/src/app.ts features.micaSupported',
			'src-tauri/Cargo.toml cfg(any(target_os = "macos", windows, target_os = "linux"))',
			'src-tauri/src/lib.rs MacosLauncher::LaunchAgent',
			'src-tauri/src/lib.rs ShellFeatureProbe.mica_supported',
			'src-tauri/src/lib.rs current_shell_features()',
			'src-tauri/src/lib.rs cfg!(target_os = "windows")',
			'/alpha-readiness/native-host-contract.json nativeHostCompatibilityMatrix',
			'/alpha-readiness/bridge-reuse.json nativeHostCompatibilityMatrix',
			'/alpha-readiness/hosted-smoke-checklist.json native-host-compatibility-matrix'
		],
		stableBlocker:
			'Stable OS-native claims still require a real Windows/macOS host smoke; this matrix only proves source-observed compatibility and browser-safe handoff coverage.'
	},
	{
		id: 'no-hydration-prerender-proof',
		marker: 'csr-disabled-prerender-contract',
		status: 'alpha-ready',
		proves:
			'A prerendered csr=false fixture serves stable SSR HTML without client hydration scripts so blog-style themes do not get repainted after load.',
		evidence: [
			'src/routes/alpha-readiness/no-hydration/+page.ts exports prerender=true and csr=false',
			'src/routes/alpha-readiness/no-hydration/+page.svelte data-contract=csr-disabled-prerender-contract',
			'/alpha-readiness/no-hydration theme-stable-ssr-html',
			'alpha remote smoke forbids <script, sveltekit:start, and data-sveltekit-hydrate on the fixture'
		],
		stableBlocker:
			'Stable still requires hosted PHP smoke against the deployed output to prove the fixture and real blog-style pages keep the no-hydration contract after adapter conversion.'
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
		id: 'adapter-platform-emulation',
		marker: 'adapter-platform-emulation',
		status: 'alpha-ready',
		proves: 'The adapter exposes a non-secret event.platform.php contract through SvelteKit emulate().platform for dev, build, and preview.',
		evidence: [
			'adapter/src/index.ts emulate().platform',
			'adapter/index.js generated bundle',
			'/alpha-readiness/package-contract.json adapterPlatformEmulationProof',
			'bun run verify:release-prep adapter-platform-emulation'
		],
		stableBlocker:
			'Stable still requires strict artifact sync, packed consumer proof, and hosted PHP smoke; platform emulation only proves the adapter capability surface.'
	},
	{
		id: 'latest-sveltekit-compatibility',
		marker: 'latest-sveltekit-compatibility-audit',
		status: 'needs-local-gate-proof',
		proves:
			'The alpha goal has been audited against current official SvelteKit adapter, build, page-option, project-type, Svelte 5 migration, browser-support, and npm latest package guidance.',
		evidence: [
			'docs/ALPHA-LATEST-SVELTEKIT-AUDIT.md',
			'package.json devDependencies',
			'adapter/src/index.ts supports/emulate/adapt',
			'Official SvelteKit writing-adapters, building-your-app, page-options, and project-types docs',
			'Official Svelte 5 migration and browser-support docs',
			'npm latest snapshot: svelte 5.56.4, @sveltejs/kit 2.69.1, @sveltejs/vite-plugin-svelte 7.1.4, vite 8.1.3',
			'official adapter snapshot: adapter-node 5.5.7, adapter-static 3.0.10, adapter-cloudflare 7.2.9, adapter-netlify 6.0.4, adapter-vercel 6.3.4, adapter-auto 7.0.1',
			'bun run verify:latest-sveltekit-audit checks npm view latest snapshot freshness',
			'bun run alpha:latest-same-major:smoke validates npm-latest Svelte 5 and SvelteKit 2 against a packed PHP/static fixture',
			'bun run alpha:latest-vite-major:smoke validates npm-latest Vite 8 and @sveltejs/vite-plugin-svelte 7 in an isolated packed PHP/static fixture without changing dependency floors'
		],
		stableBlocker:
			'Stable 1.0.2 remains blocked until npm publish/install proof exists, hosted PHP smoke passes for the release target, real native-host proof exists for OS-native claims, and newer Kit feature surfaces such as remote functions have explicit proof or an unsupported-feature policy.'
	},
	{
		id: 'remote-functions-alpha-policy',
		marker: 'remote-functions-alpha-policy',
		status: 'needs-local-gate-proof',
		proves:
			'SvelteKit remote functions are explicitly blocked for PHP runtime alpha output until generated HTTP endpoint routing has PHP fixture and hosted smoke proof.',
		evidence: [
			'docs/REMOTE-FUNCTIONS-ALPHA-POLICY.md',
			'adapter/src/index.ts assertRemoteFunctionsUnsupported',
			'scripts/verify-remote-functions-policy.mjs',
			'event.platform.php.remoteFunctions.supported === false',
			'Official SvelteKit remote-functions docs: generated server HTTP endpoints from .remote.* files'
		],
		stableBlocker:
			'Stable 1.0.2 cannot claim remote-functions support until query, form, command, and prerender behavior are covered by PHP routing fixtures or a documented supported subset.'
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
	},
	{
		id: 'live-blog-consumer-evidence',
		marker: 'live-blog-consumer-evidence',
		status: 'needs-hosted-proof',
		proves:
			'blog.ryanspice.com is a live consumer proof surface for static php-static behavior, robots/sitemap health, and currently observed no-hydration homepage HTML.',
		evidence: [
			'https://blog.ryanspice.com/ returned 200 with data-site="ryan" and Ryan metadata',
			'robots.txt and sitemap.xml returned 200',
			'homepage HTML had no sveltekit:start marker, no module script marker, and no __sveltekit marker during the audit',
			'seo_audit_python report blog.ryanspice.com-root-20260706T204200Z-v0_4_9 scored 91 A- across 32 pages; high findings are confined to the intentionally private /login route',
			'Live blog consumer proof does not replace the dedicated hosted PHP adapter fixture required by hosted-php-smoke-proof'
		],
		stableBlocker:
			'Stable remains blocked until a dedicated hosted PHP adapter fixture and npm alpha publish proof are current; blog evidence is consumer corroboration only.'
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
		label: 'macOS host material policy boundary',
		source:
			'lg-ultragear-bridge/src-tauri/Cargo.toml desktop plugin lane and src-tauri/src/lib.rs MacosLauncher::LaunchAgent with Windows-only mica_supported probe',
		adopted:
			'Alpha reports expose source-observed macOS host scaffolding and explicitly mark real macOS vibrancy as unverified until a macOS wrapper smoke run exists',
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
			'router-parity unit coverage protects the root-router delegate and generated router safety helpers',
			'/alpha-readiness/no-hydration proves a prerendered csr=false fixture keeps theme-stable SSR HTML without hydration scripts',
			'blog.ryanspice.com live homepage currently corroborates static/no-hydration consumer behavior with no observed SvelteKit hydration markers',
			'emulate().platform exposes non-secret event.platform.php mode, output, base-path, and runtime capability flags',
			'Latest Svelte/SvelteKit audit tracks official adapter API, page options, Svelte 5 migration posture, browser support, and current npm latest package boundaries',
			'Remote-functions alpha policy blocks unsupported generated HTTP endpoints until the PHP runtime has fixture proof'
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
		description: 'Windows 11 Mica, macOS-style chrome rhythm, and source-observed host-material policy for reports and operator surfaces.',
		score: 64,
		status: 'watch',
		evidence: [
			'UltraGear bridge shell tokens are mapped into this browser-safe report surface',
			'No Tauri runtime dependency is introduced into the PHP adapter demo',
			'Report cards use desktop-window containment, inactive Mica fallback washes, and native caption affordances',
			'The native host contract exposes theme, frame, titlebar, platform, drag, and window-control DOM markers',
			'The native-host compatibility matrix maps UltraGear features.micaSupported, ShellFeatureProbe.mica_supported, current_shell_features(), taskbar progress, drag, and maximize cues to browser-safe host actions',
			'The macOS material lane is marked source-observed host scaffolding and macos-native-vibrancy-unverified until a real macOS wrapper smoke run proves native material application',
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
		score: 76,
		status: 'watch',
		evidence: [
			'alpha:remote:smoke records hosted checks into report/alpha-remote-smoke.json',
			'alpha:gate:hosted composes the full local alpha gate with the hosted smoke',
			'Remote probes cover the alpha page, report JSON, report SVG, form route GET plus POST action, content types, traversal leak markers, live evidence gates, and evidence-index inventory',
			'Remote probes cover the alpha no-hydration fixture and forbid client script/hydration markers on csr=false prerendered output',
			'When report/alpha-remote-smoke.json has status=passed, report/alpha-readiness.full.json and the release manifest carry alpha hosted proof for the checked PHP target',
			'Live blog SEO evidence records blog.ryanspice.com root, robots.txt, sitemap.xml, and seo_audit_python A- crawl output as consumer proof, not hosted fixture replacement'
		],
		gap: 'The canonical runtime report is deployment-agnostic; stable still needs a fresh hosted gate for the release deployment target plus local gate, artifact sync, consumer, and native-host proof.'
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
	'Hosted deployment evidence is target-specific: report/alpha-readiness.full.json and the release manifest can embed a passed report/alpha-remote-smoke.json, while the canonical runtime report stays deployment-agnostic.',
	'Latest npm package versions are audit targets, not implicit dependency upgrades; npm-latest Svelte 5 and SvelteKit 2 are covered by alpha:latest-same-major:smoke, while Vite 8 and @sveltejs/vite-plugin-svelte 7 are covered by alpha:latest-vite-major:smoke as isolated validation, not a dependency-floor upgrade.',
	'Live blog evidence is consumer proof for static/no-hydration behavior and SEO health, not a substitute for the dedicated hosted PHP adapter fixture or npm alpha publish proof.',
	'SvelteKit remote functions are intentionally unsupported in the PHP runtime alpha until generated HTTP endpoint routing has fixture and hosted proof.',
	'WordPress plugin mode, PHP-FPM package mode, ISR, built-in image optimization, and adapter-owned auth/roles are not part of the 1.0.2 alpha support lane.',
	'Native shell styling is a browser-safe emulation and host contract layer, not real Windows Mica or macOS vibrancy.',
	'No publish, tag, or stable-version promotion should be applied until the current alpha gate, hosted gate for the release target, artifact sync, packed consumer smoke, and native-host proof expectations are current.'
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
		hardProofBlockerLedgerMarker: 'hard-proof-blocker-ledger',
		hardProofBlockers: buildAlphaHardProofBlockers(),
		overallScore: calculateAlphaScore(),
		summary: summarizeReadiness(),
		bridgeSource,
		bridgePatterns,
		readinessAreas,
		communitySignals,
		analyticsRows,
		latestPackageSnapshotReviewed,
		latestPackageSnapshot,
		officialAdapterSnapshot,
		liveConsumerEvidence,
		limitations: alphaLimitations
	};
}


