<script lang="ts">
	import { base } from '$app/paths';
	import { buildBridgeReuseInventory } from '$lib/alpha-bridge-reuse';
	import { buildCommunityResearchPack } from '$lib/alpha-community-research-pack';
	import {
		buildAlphaReadinessReport,
		statusLabel,
		type AlphaReadinessStatus
	} from '$lib/alpha-readiness';
	import { buildAlphaNativeHostContract } from '$lib/alpha-native-host-contract';
	import { requiredAlphaEvidence } from '$lib/alpha-required-evidence';
	import NativeTitlebar from '$lib/components/native-shell/NativeTitlebar.svelte';
	import NativeHostBridgeStatus from '$lib/components/native-shell/NativeHostBridgeStatus.svelte';
	import NativeWindowShell from '$lib/components/native-shell/NativeWindowShell.svelte';

	const report = buildAlphaReadinessReport();
	const nativeHostContract = buildAlphaNativeHostContract(report);
	const liveRequiredEvidenceSourceMarkers = [
		'alpha-over-rc-release-policy',
		'native-host-binding-guide',
		'desktop-shell-ui-command-mapping',
		'windows-11-mica-browser-safe-shell',
		'macos-style-native-titlebar-rhythm',
		'alpha-readiness-report-graphics',
		'community-keyword-search-graph',
		'community-analytics-freshness-contract',
		'community-analytics-csv-linkage',
		'router-path-safety-artifact-sync',
		'deploy-env-preflight-safety',
		'hosted-php-smoke-proof'
	] satisfies ReadonlyArray<(typeof requiredAlphaEvidence)[number]>;

	const liveNativeEvidenceSourceMarkers = [
		'data-native-host-bridge-status',
		'data-native-platform-provenance',
		'data-window-material',
		'data-macos-chrome',
		'data-windows-chrome',
		'data-native-platform-mode',
		'hybrid-proof',
		'browser fallback active',
		'@scriptgpt/desktop-shell-ui',
		'enableMicaWindowChrome',
		'syncTaskbarProgress',
		'toggleWindowMaximize',
		'installSvelteKitPhpNativeHost',
		'ProgressBarStatus.None',
		'report-ready',
		'windows-mica-visual-row',
		'macos-traffic-light-row',
		'windows-caption-control-row',
		'ultragear-theme-row',
		'browser-fallback-visual-row'
	] as const;
	const nativeDomMarkers = nativeHostContract.requiredDomMarkers;
	const nativeHostResponsibilities = nativeHostContract.hostResponsibilities;
	const nativeVisualMatrix = nativeHostContract.nativeVisualMatrix;
	const progressReportHandoff = nativeHostContract.progressReportHandoff;
	const desktopShellUiBinding = nativeHostContract.desktopShellUiBinding;
	const bridgeReuseInventory = buildBridgeReuseInventory(report);
	const ultraGearParityRows = bridgeReuseInventory.ultraGearParityContract.parityRows;
	const communityResearchPack = buildCommunityResearchPack(report);
	const communitySourceSummary = communityResearchPack.summary;
	const keywordSearchGraph = communityResearchPack.keywordSearchGraph;
	const keywordAnalyticsLinkage = keywordSearchGraph.analyticsLinkage;
	const keywordGraphNodes = keywordSearchGraph.nodes;
	const keywordGraphEdges = keywordSearchGraph.edges.slice(0, 8);
	const communityCoverageGroups = [
		{
			label: 'Providers',
			values: communitySourceSummary.providerCoverage,
			description: 'Public source families represented by the research pack.'
		},
		{
			label: 'Evidence kinds',
			values: communitySourceSummary.evidenceKindCoverage,
			description: 'What each source can credibly prove for alpha review.'
		},
		{
			label: 'Collection risk',
			values: communitySourceSummary.collectionRiskCoverage,
			description: 'Where automation is stable, rate-limited, or manual.'
		}
	];
	const prioritizedCommunitySources = communityResearchPack.collectionPlan.slice(0, 6);
	const { analyticsRows, bridgePatterns, communitySignals, proofLedger, readinessAreas } = report;
	const alphaTarget = report.target;
	const alphaScore = report.overallScore;
	const readyCount = report.summary.ready;
	const watchCount = report.summary.watch;
	const blockedCount = report.summary.blocked;
	const alphaReadyProofCount = proofLedger.filter((item) => item.status === 'alpha-ready').length;
	const localGateProofCount = proofLedger.filter(
		(item) => item.status === 'needs-local-gate-proof'
	).length;
	const hostedProofCount = proofLedger.filter((item) => item.status === 'needs-hosted-proof').length;
	const reportJson = JSON.stringify(report, null, 2);
	const localHref = (path: string) => `${base}${path.startsWith('/') ? path : `/${path}`}`;
	const reportHref = localHref('/alpha-readiness/report.json');
	const reportHtmlHref = localHref('/alpha-readiness/report.html');
	const reportMarkdownHref = localHref('/alpha-readiness/report.md');
	const releaseNotesHref = localHref('/alpha-readiness/release-notes.md');
	const releaseChecklistHref = localHref('/alpha-readiness/release-checklist.md');
	const reportSvgHref = localHref('/alpha-readiness/report.svg');
	const communitySourceMapSvgHref = localHref('/alpha-readiness/community-source-map.svg');
	const manifestHref = localHref('/alpha-readiness/release-manifest.json');
	const gateMatrixHref = localHref('/alpha-readiness/gate-matrix.json');
	const evidenceIndexHref = localHref('/alpha-readiness/evidence-index.json');
	const packageContractHref = localHref('/alpha-readiness/package-contract.json');
	const nativeHostContractHref = localHref('/alpha-readiness/native-host-contract.json');
	const nativeHostGuideHref = localHref('/alpha-readiness/native-host-guide.md');
	const hostedSmokeChecklistHref = localHref('/alpha-readiness/hosted-smoke-checklist.json');
	const noHydrationHref = localHref('/alpha-readiness/no-hydration');
	const bridgeReuseHref = localHref('/alpha-readiness/bridge-reuse.json');
	const reviewIndexHref = localHref('/alpha-readiness/review-index.md');
	const communitySignalsJsonHref = localHref('/alpha-readiness/community-signals.json');
	const communityAnalyticsMarkdownHref = localHref('/alpha-readiness/community-analytics.md');
	const communityResearchPackHref = localHref('/alpha-readiness/community-research-pack.json');
	const readinessCsvHref = localHref('/alpha-readiness/readiness.csv');
	const communitySignalsCsvHref = localHref('/alpha-readiness/community-signals.csv');
	const communitySourcesCsvHref = localHref('/alpha-readiness/community-sources.csv');
	const evidenceLanes = [
		{
			label: 'Native UX',
			status: 'host contract',
			summary: 'Windows Mica/macOS chrome seams and UltraGear bridge reuse markers.',
			links: [
				{ label: 'Native host contract', href: nativeHostContractHref },
				{ label: 'Native host guide', href: nativeHostGuideHref },
				{ label: 'Bridge reuse map', href: bridgeReuseHref }
			]
		},
		{
			label: 'Reports and graphics',
			status: 'bundle',
			summary: 'HTML, Markdown, JSON, CSV, and SVG artifacts for reviewer handoff.',
			links: [
				{ label: 'HTML report', href: reportHtmlHref },
				{ label: 'Release SVG', href: reportSvgHref },
				{ label: 'Source map SVG', href: communitySourceMapSvgHref }
			]
		},
		{
			label: 'Community analytics',
			status: 'research lanes',
			summary: 'Keyword intents, source coverage, community links, and CSV export paths.',
			links: [
				{ label: 'Research pack', href: communityResearchPackHref },
				{ label: 'Analytics Markdown', href: communityAnalyticsMarkdownHref },
				{ label: 'Sources CSV', href: communitySourcesCsvHref }
			]
		},
		{
			label: 'Hosted proof',
			status: 'requires host',
			summary: 'The release still needs real PHP deployment smoke evidence before RC quality.',
			links: [
				{ label: 'Hosted checklist', href: hostedSmokeChecklistHref },
				{ label: 'Gate matrix', href: gateMatrixHref },
				{ label: 'Reviewer index', href: reviewIndexHref }
			]
		}
	];
	const trustLanes = [
		{
			label: 'Source-generated',
			status: 'deterministic-local-artifact',
			summary:
				'Reports, graphics, CSVs, manifests, contracts, and release notes generated from source-controlled alpha modules.',
			links: [
				{ label: 'Release manifest', href: manifestHref },
				{ label: 'Evidence index', href: evidenceIndexHref }
			]
		},
		{
			label: 'Community counts',
			status: 'directional-community-signal',
			summary:
				'Public-source analytics from GitHub, npm, Packagist, Stack Overflow, and Reddit are directional evidence, not telemetry.',
			links: [
				{ label: 'Analytics Markdown', href: communityAnalyticsMarkdownHref },
				{ label: 'Research pack', href: communityResearchPackHref }
			]
		},
		{
			label: 'Runtime endpoints',
			status: 'deterministic-runtime-evidence',
			summary:
				'The live fixture endpoints serve deterministic report data and do not call public community APIs at request time.',
			links: [
				{ label: 'Report JSON', href: reportHref },
				{ label: 'Gate matrix', href: gateMatrixHref }
			]
		},
		{
			label: 'Hosted proof',
			status: 'requires-alpha-smoke-base-url-for-pass-evidence',
			summary:
				'Hosted smoke only becomes pass evidence after ALPHA_SMOKE_BASE_URL targets a real deployed PHP host.',
			links: [
				{ label: 'Hosted checklist', href: hostedSmokeChecklistHref },
				{ label: 'Reviewer index', href: reviewIndexHref }
			]
		}
	];
	const statusClass = (status: AlphaReadinessStatus) => `status-pill status-pill--${status}`;
</script>

<svelte:head>
	<title>SvelteKit PHP Alpha Readiness Report</title>
	<meta
		name="description"
		content="Native-styled alpha readiness report for the SvelteKit PHP adapter, including runtime gates and open-source community keyword signals."
	/>
</svelte:head>

<NativeWindowShell labelledby="alpha-title">
	<NativeTitlebar
		appMark="SK/PHP"
		eyebrow="Alpha command surface"
		title={`${alphaTarget} readiness`}
		titleId="alpha-title"
		badges={['Windows 11 Mica fallback', 'macOS chrome rhythm']}
	/>

		<div class="hero-grid">
			<section class="hero-card hero-card--primary">
				<p class="eyebrow">Release signal</p>
				<h2>Alpha is becoming a reportable product surface, not just a test fixture.</h2>
				<p>
					This page translates the UltraGear bridge shell/report patterns into the adapter demo:
					Mica-style containment, macOS-native window cadence, structured report export, and
					keyword-linked open-source community analytics.
				</p>
				<div class="hero-actions">
					<a class="button button-primary" href={reportHref} download="sveltekit-php-alpha-readiness-report.json">
						Download report JSON
					</a>
					<a class="button" href={reportMarkdownHref} download="sveltekit-php-alpha-readiness-report.md">
						Download Markdown
					</a>
					<a class="button" href={releaseNotesHref} download="sveltekit-php-alpha-release-notes.md">
						Download release notes
					</a>
					<a class="button" href={releaseChecklistHref} download="sveltekit-php-alpha-release-checklist.md">
						Download release checklist
					</a>
					<a class="button" href={reportHtmlHref} download="sveltekit-php-alpha-readiness-report.html">
						Download HTML
					</a>
					<a class="button" href={reportSvgHref} download="sveltekit-php-alpha-readiness-report.svg">
						Download SVG graphic
					</a>
					<a class="button" href={communitySourceMapSvgHref} download="sveltekit-php-alpha-community-source-map.svg">
						Download source map SVG
					</a>
					<a class="button" href={manifestHref} download="sveltekit-php-alpha-release-manifest.json">
						Download manifest
					</a>
					<a class="button" href={gateMatrixHref} download="sveltekit-php-alpha-gate-matrix.json">
						Download gate matrix
					</a>
					<a class="button" href={evidenceIndexHref} download="sveltekit-php-alpha-evidence-index.json">
						Download evidence index
					</a>
					<a class="button" href={packageContractHref} download="sveltekit-php-alpha-package-contract.json">
						Download package contract
					</a>
					<a class="button" href={nativeHostContractHref} download="sveltekit-php-alpha-native-host-contract.json">
						Download native host contract
					</a>
					<a class="button" href={nativeHostGuideHref} download="sveltekit-php-alpha-native-host-guide.md">
						Download native host guide
					</a>
					<a class="button" href={hostedSmokeChecklistHref} download="sveltekit-php-alpha-hosted-smoke-checklist.json">
						Download hosted checklist
					</a>
					<a class="button" href={noHydrationHref}>
						Open no-hydration fixture
					</a>
					<a class="button" href={bridgeReuseHref} download="sveltekit-php-alpha-bridge-reuse.json">
						Download bridge map
					</a>
					<a class="button" href={reviewIndexHref} download="sveltekit-php-alpha-review-index.md">
						Download reviewer index
					</a>
					<a class="button" href={communitySignalsJsonHref} download="sveltekit-php-alpha-community-signals.json">
						Download signals JSON
					</a>
					<a class="button" href={communityAnalyticsMarkdownHref} download="sveltekit-php-alpha-community-analytics.md">
						Download analytics Markdown
					</a>
					<a class="button" href={communityResearchPackHref} download="sveltekit-php-alpha-community-research-pack.json">
						Download research pack
					</a>
					<a class="button" href={readinessCsvHref} download="sveltekit-php-alpha-readiness.csv">
						Download readiness CSV
					</a>
					<a class="button" href={communitySignalsCsvHref} download="sveltekit-php-alpha-community-signals.csv">
						Download signals CSV
					</a>
					<a class="button" href={communitySourcesCsvHref} download="sveltekit-php-alpha-community-sources.csv">
						Download sources CSV
					</a>
					<a class="button" href={reportHref}>Open report endpoint</a>
					<a class="button" href={reportHtmlHref}>Open HTML</a>
					<a class="button" href={reportMarkdownHref}>Open Markdown</a>
					<a class="button" href={releaseNotesHref}>Open release notes</a>
					<a class="button" href={releaseChecklistHref}>Open release checklist</a>
					<a class="button" href={reportSvgHref}>Open SVG graphic</a>
					<a class="button" href={communitySourceMapSvgHref}>Open source map SVG</a>
					<a class="button" href={manifestHref}>Open manifest</a>
					<a class="button" href={gateMatrixHref}>Open gate matrix</a>
					<a class="button" href={evidenceIndexHref}>Open evidence index</a>
					<a class="button" href={packageContractHref}>Open package contract</a>
					<a class="button" href={nativeHostContractHref}>Open native host contract</a>
					<a class="button" href={nativeHostGuideHref}>Open native host guide</a>
					<a class="button" href={hostedSmokeChecklistHref}>Open hosted checklist</a>
					<a class="button" href={bridgeReuseHref}>Open bridge map</a>
					<a class="button" href={reviewIndexHref}>Open reviewer index</a>
					<a class="button" href={communitySignalsJsonHref}>Open signals JSON</a>
					<a class="button" href={communityAnalyticsMarkdownHref}>Open analytics Markdown</a>
					<a class="button" href={communityResearchPackHref}>Open research pack</a>
					<a class="button" href={communitySourcesCsvHref}>Open sources CSV</a>
					<a class="button" href={localHref('/')}>Back to fixture index</a>
				</div>
			</section>

			<section class="score-card" aria-label="Overall alpha readiness score">
				<div class="score-ring" style={`--score:${alphaScore}%`}>
					<strong>{alphaScore}</strong>
					<span>/100</span>
				</div>
				<div>
					<p class="eyebrow">Current call</p>
					<h2>Alpha-track, not stable 1.0.0</h2>
					<p>{readyCount} ready, {watchCount} watch, {blockedCount} blocked.</p>
				</div>
			</section>
		</div>

		<section class="evidence-lane-panel" aria-labelledby="evidence-lanes-heading">
			<div class="section-heading">
				<p class="eyebrow">Alpha evidence lanes</p>
				<h2 id="evidence-lanes-heading">What a reviewer should inspect first</h2>
				<p>
					This condenses the growing alpha bundle into four proof lanes: native shell seams,
					report artifacts, open-source community analytics, and the hosted proof still needed
					before this can honestly move beyond alpha.
				</p>
			</div>
			<div class="evidence-lane-grid">
				{#each evidenceLanes as lane (lane.label)}
					<article>
						<div class="lane-topline">
							<span>{lane.status}</span>
							<strong>{lane.label}</strong>
						</div>
						<p>{lane.summary}</p>
						<div class="lane-links">
							{#each lane.links as link (link.href)}
								<a href={link.href}>{link.label}</a>
							{/each}
						</div>
					</article>
				{/each}
			</div>
		</section>

		<section class="trust-model-panel" aria-labelledby="trust-model-heading">
			<div class="section-heading">
				<p class="eyebrow">Evidence trust model</p>
				<h2 id="trust-model-heading">What each alpha artifact can prove</h2>
				<p>
					The live page now mirrors the generated HTML, Markdown, SVG, manifest, and hosted-smoke
					trust model: source-generated reports are deterministic, community counts are directional,
					runtime endpoints are inert, and hosted proof requires a real PHP deployment.
				</p>
			</div>

			<div class="trust-lane-grid">
				{#each trustLanes as lane (lane.status)}
					<article>
						<div class="trust-topline">
							<span>{lane.status}</span>
							<strong>{lane.label}</strong>
						</div>
						<p>{lane.summary}</p>
						<div class="trust-links">
							{#each lane.links as link (link.href)}
								<a href={link.href}>{link.label}</a>
							{/each}
						</div>
					</article>
				{/each}
			</div>
		</section>

		<section class="pattern-panel" aria-labelledby="bridge-patterns">
			<div class="section-heading">
				<p class="eyebrow">Imported patterns</p>
				<h2 id="bridge-patterns">UltraGear bridge reuse map</h2>
			</div>
			<div class="pattern-grid">
				{#each bridgePatterns as pattern (pattern.label)}
					<article>
						<span>{pattern.status}</span>
						<h3>{pattern.label}</h3>
						<p>{pattern.adopted}</p>
						<small>{pattern.source}</small>
					</article>
				{/each}
			</div>
		</section>

		<section
			class="ultragear-parity-panel"
			aria-labelledby="ultragear-parity-heading"
			data-ultragear-source-parity
		>
			<div class="section-heading">
				<p class="eyebrow">ultraGearParityContract</p>
				<h2 id="ultragear-parity-heading">Concrete UltraGear source parity</h2>
				<p>
					This panel maps actual source cues from the referenced UltraGear checkout to local
					adapter evidence. Native OS calls stay host-owned; the PHP/browser surface exposes
					DOM markers, host events, report graphics, and release-evidence artifacts.
				</p>
			</div>
			<div class="parity-grid">
				{#each ultraGearParityRows as row (row.sourceFile)}
					<article>
						<div class="parity-topline">
							<span>source-cue-to-adapter-evidence-map</span>
							<strong>{row.sourceFile}</strong>
						</div>
						<div class="parity-columns">
							<div>
								<h3>Source cues</h3>
								<div class="cue-list">
									{#each row.sourceCues as cue (cue)}
										<code>{cue}</code>
									{/each}
								</div>
							</div>
							<div>
								<h3>Adapter evidence</h3>
								<div class="cue-list">
									{#each row.localEvidence as cue (cue)}
										<code>{cue}</code>
									{/each}
								</div>
							</div>
						</div>
						<p>{row.boundary}</p>
					</article>
				{/each}
			</div>
		</section>

		<section
			class="native-contract-panel"
			aria-labelledby="desktop-shell-binding-heading"
			data-desktop-shell-ui-binding
		>
			<div class="section-heading">
				<p class="eyebrow">desktopShellUiBinding / {desktopShellUiBinding.packageName}</p>
				<h2 id="desktop-shell-binding-heading">Reusable UltraGear desktop shell binding</h2>
				<p>
					The live alpha surface names the actual helper package a desktop wrapper should bind
					instead of treating Mica, taskbar progress, and maximize behavior as generic style
					claims. These helpers stay optional host code; the PHP adapter runtime remains
					browser-safe.
				</p>
			</div>
			<div class="native-contract-grid">
				<article>
					<span class="contract-kicker">optional-host-implementation-reference</span>
					<h3>Source package</h3>
					<div class="native-marker-list">
						<div>
							<code>{desktopShellUiBinding.packageName}</code>
							<p>{desktopShellUiBinding.sourcePackage}</p>
						</div>
						<div>
							<code>upstreamWidgetSource</code>
							<p>{desktopShellUiBinding.upstreamWidgetSource}</p>
						</div>
						<div>
							<code>{desktopShellUiBinding.marker}</code>
							<p>{desktopShellUiBinding.proofUse}</p>
						</div>
						<div>
							<code>{desktopShellUiBinding.controllerBinding.installer}</code>
							<p>
								Installer recipe for wiring
								<code>{desktopShellUiBinding.controllerBinding.global}</code>
								to a host window.
							</p>
						</div>
					</div>
				</article>
				<article>
					<span class="contract-kicker">Reused helpers</span>
					<h3>Mica, progress, maximize</h3>
					<div class="native-marker-list">
						{#each desktopShellUiBinding.requiredImports as importName (importName)}
							<div>
								<code>{importName}</code>
								<p>Required UltraGear helper or native cue for the optional desktop wrapper.</p>
							</div>
						{/each}
					</div>
				</article>
				<article>
					<span class="contract-kicker">Controller binding</span>
					<h3>native-window-action mapping</h3>
					<div class="native-marker-list">
						{#each desktopShellUiBinding.controllerBinding.handlers as handler (handler.action)}
							<div>
								<code>{handler.action}</code>
								<p>
									<strong>{handler.handler}</strong>
									<span>{handler.ultraGearImplementation}</span>
									<span>{handler.nativeHostBridgeMapping}</span>
									<span>Detail fields: {handler.detailFields.join(', ')}</span>
									<span>{handler.notes}</span>
								</p>
							</div>
						{/each}
					</div>
				</article>
			</div>
		</section>

		<section class="native-contract-panel" aria-labelledby="native-contract-heading">
			<div class="section-heading">
				<p class="eyebrow">Native host boundary</p>
				<h2 id="native-contract-heading">Windows Mica and macOS chrome contract</h2>
				<p>
					The adapter exposes browser-safe DOM markers and report handoff links. A future desktop
					host owns real Mica, native dragging, traffic-light behavior, and progress APIs.
				</p>
			</div>
			<div class="native-contract-grid">
				<article>
					<span class="contract-kicker">DOM seams</span>
					<h3>Host-bindable markers</h3>
					<div class="native-marker-list">
						{#each nativeDomMarkers as marker (marker.marker)}
							<div>
								<code>{marker.marker}</code>
								<p>{marker.purpose}</p>
							</div>
						{/each}
					</div>
				</article>
				<article>
					<span class="contract-kicker">Host duties</span>
					<h3>Native wrapper responsibilities</h3>
					<div class="native-responsibility-list">
						{#each nativeHostResponsibilities as responsibility (responsibility.capability)}
							<div>
								<strong>{responsibility.capability}</strong>
								<p>{responsibility.sourceCue}</p>
								<span>{responsibility.status}</span>
							</div>
						{/each}
					</div>
					<a class="button" href={nativeHostContractHref}>Open native host contract</a>
					<a class="button" href={nativeHostGuideHref}>Open native host guide</a>
				</article>
			</div>
		</section>

		<section
			class="native-contract-panel"
			aria-labelledby="native-visual-matrix-heading"
			data-native-visual-matrix
		>
			<div class="section-heading">
				<p class="eyebrow">native-visual-matrix</p>
				<h2 id="native-visual-matrix-heading">Native visual proof matrix</h2>
				<p>
					Windows Mica, macOS traffic lights, Windows caption controls, UltraGear theme
					tokens, and browser fallback state are mapped to concrete adapter markers so the
					visual contract can be reviewed without importing native APIs into the PHP runtime.
				</p>
			</div>
			<div class="native-visual-grid">
				{#each nativeVisualMatrix.rows as row (row.id)}
					<article data-native-visual-row={row.id}>
						<div class="visual-row-topline">
							<span>{row.id}</span>
							<strong>{row.visualCue}</strong>
						</div>
						<p>{row.ultraGearCue}</p>
						<div class="cue-list">
							{#each row.adapterMarkers as marker (marker)}
								<code>{marker}</code>
							{/each}
						</div>
						<p>{row.hostBoundary}</p>
					</article>
				{/each}
			</div>
		</section>

		<section
			class="native-contract-panel"
			aria-labelledby="required-alpha-evidence-heading"
			data-required-alpha-evidence="requiredEvidence"
		>
			<div class="section-heading">
				<p class="eyebrow">requiredEvidence / required-alpha-evidence</p>
				<h2 id="required-alpha-evidence-heading">Required alpha evidence</h2>
				<p>
					These markers define the live reviewer boundary for treating this as a real
					1.0.2-alpha candidate instead of a generic adapter smoke test. They must stay
					synchronized across package metadata, package contract, release manifest, evidence
					index, hosted smoke checklist, remote smoke, reports, graphics, and this page.
				</p>
			</div>
			<div class="native-contract-grid">
				{#each liveRequiredEvidenceSourceMarkers as marker (marker)}
					<article>
						<span class="contract-kicker">required-alpha-evidence</span>
						<h3><code>{marker}</code></h3>
						<p>
							This requiredEvidence marker is part of the alpha proof boundary checked by
							local verification and hosted smoke before release review.
						</p>
					</article>
				{/each}
			</div>
		</section>

		<section
			class="native-contract-panel"
			aria-labelledby="native-live-evidence-source-heading"
			data-alpha-live-source-evidence
		>
			<div class="section-heading">
				<p class="eyebrow">live native evidence source markers</p>
				<h2 id="native-live-evidence-source-heading">Native bridge evidence markers</h2>
				<p>
					The live page keeps these exact source markers visible so hosted smoke can prove the
					browser-safe native-shell contract without importing native runtime dependencies into
					the PHP adapter.
				</p>
			</div>
			<div class="native-contract-grid">
				{#each liveNativeEvidenceSourceMarkers as marker (marker)}
					<article>
						<span class="contract-kicker">live-source-evidence</span>
						<h3><code>{marker}</code></h3>
						<p>
							This source marker links the live page to the native host contract, bridge reuse
							inventory, SVG report, and hosted smoke checklist.
						</p>
					</article>
				{/each}
			</div>
		</section>

		<section
			class="proof-ledger-panel"
			aria-labelledby="alpha-proof-ledger-heading"
			data-alpha-proof-ledger
		>
			<div class="section-heading">
				<p class="eyebrow">proofLedger</p>
				<h2 id="alpha-proof-ledger-heading">Alpha proof ledger</h2>
				<p>
					The alpha channel can stay above RC while keeping stable promotion blocked until local
					PHP runtime gates and hosted smoke proof are recorded.
				</p>
			</div>

			<div class="proof-ledger-summary" aria-label="Alpha proof ledger summary">
				<article>
					<span>{alphaReadyProofCount}</span>
					<strong>Alpha-ready rows</strong>
					<p>
						Includes alpha-over-rc-release-policy, native-visual-matrix, and
						analytics-linked-keyword-graph.
					</p>
				</article>
				<article>
					<span>{localGateProofCount}</span>
					<strong>Local gate blockers</strong>
					<p>
						Tracks alpha-runtime-gate-ledger and needs-local-gate-proof before RC/stable
						promotion.
					</p>
				</article>
				<article>
					<span>{hostedProofCount}</span>
					<strong>Hosted proof blockers</strong>
					<p>
						Tracks hosted-php-smoke-proof-required and needs-hosted-proof for deployment
						evidence.
					</p>
				</article>
			</div>

			<div class="proof-ledger-grid">
				{#each proofLedger as item (item.id)}
					<article class="proof-ledger-card" data-proof-ledger-row={item.id}>
						<div class="proof-ledger-card-topline">
							<code>{item.marker}</code>
							<span class={`proof-status ${item.status}`}>{item.status}</span>
						</div>
						<h3>{item.id}</h3>
						<p>{item.proves}</p>
						<div class="proof-ledger-evidence" aria-label={`Evidence for ${item.id}`}>
							{#each item.evidence as evidence (evidence)}
								<span>{evidence}</span>
							{/each}
						</div>
						{#if item.stableBlocker}
							<p class="stable-blocker"><strong>Stable blocker:</strong> {item.stableBlocker}</p>
						{/if}
					</article>
				{/each}
			</div>
		</section>

		<NativeHostBridgeStatus
			contractHref={nativeHostContractHref}
			guideHref={nativeHostGuideHref}
			bridgeReuseHref={bridgeReuseHref}
		/>

		<section
			class="native-contract-panel"
			aria-labelledby="progress-handoff-heading"
			data-progress-report-handoff
		>
			<div class="section-heading">
				<p class="eyebrow">progressReportHandoff</p>
				<h2 id="progress-handoff-heading">UltraGear progress and report handoff</h2>
				<p>
					UltraGear uses taskbar progress and structured validation exports. The adapter keeps
					native progress host-owned while exposing deterministic report artifacts and commands a
					desktop wrapper can bind to real progress UI.
				</p>
			</div>
			<div class="native-contract-grid">
				<article>
					<span class="contract-kicker">Host-owned cues</span>
					<h3>Taskbar progress semantics</h3>
					<div class="native-marker-list">
						{#each progressReportHandoff.hostOwnedCues as cue (cue)}
							<div>
								<code>{cue}</code>
								<p>Preserved as a native host responsibility, not a PHP runtime API call.</p>
							</div>
						{/each}
					</div>
				</article>
				<article>
					<span class="contract-kicker">statusMapping</span>
					<h3>Host progress lifecycle</h3>
					<div class="native-marker-list">
						{#each progressReportHandoff.statusMapping as status (status.adapterState)}
							<div>
								<code>{status.adapterState}</code>
								<p>
									<strong>{status.hostCue}</strong>
									<span>{status.reportCue}</span>
								</p>
							</div>
						{/each}
					</div>
				</article>
				<article>
					<span class="contract-kicker">Adapter evidence</span>
					<h3>Report artifacts and commands</h3>
					<div class="native-marker-list">
						{#each progressReportHandoff.adapterEvidence as endpoint (endpoint)}
							<div>
								<code>{endpoint}</code>
								{#if endpoint.startsWith('/alpha-readiness')}
									<p><a href={localHref(endpoint)}>Open report handoff endpoint</a></p>
								{:else}
									<p>Source cue, not a routed endpoint.</p>
								{/if}
							</div>
						{/each}
						{#each progressReportHandoff.commands as command (command)}
							<div>
								<code>{command}</code>
								<p>Command evidence for generating or verifying alpha report handoff artifacts.</p>
							</div>
						{/each}
					</div>
					<p>{progressReportHandoff.boundary}</p>
				</article>
			</div>
		</section>

		<section class="readiness-grid" aria-labelledby="readiness-heading">
			<div class="section-heading section-heading--span">
				<p class="eyebrow">Release gates</p>
				<h2 id="readiness-heading">Alpha readiness report</h2>
			</div>
			{#each readinessAreas as area (area.id)}
				<article class="readiness-card">
					<div class="card-topline">
						<span class={statusClass(area.status)}>{statusLabel[area.status]}</span>
						<strong>{area.score}%</strong>
					</div>
					<h3>{area.title}</h3>
					<p>{area.description}</p>
					<div class="meter" aria-label={`${area.title} score ${area.score} percent`}>
						<span style={`--bar:${area.score}%`}></span>
					</div>
					<ul>
						{#each area.evidence as item (item)}
							<li>{item}</li>
						{/each}
					</ul>
					<p class="gap"><strong>Gap:</strong> {area.gap}</p>
				</article>
			{/each}
		</section>

		<section class="analytics-panel" aria-labelledby="analytics-heading">
			<div class="section-heading">
				<p class="eyebrow">Open-source signal map</p>
				<h2 id="analytics-heading">Keyword searches and community analytics</h2>
				<p>
					These are explicit research links, not invented telemetry. They give alpha reviewers
					a repeatable path into GitHub, npm, Packagist, Svelte, PHP, Stack Overflow, and Reddit.
				</p>
			</div>

			<div class="source-summary-grid" aria-label="Community research source coverage">
				<article>
					<span>{communitySourceSummary.queryCount}</span>
					<strong>keyword intents</strong>
					<p>Curated demand/support searches for adapter adoption and shared-hosting friction.</p>
				</article>
				<article>
					<span>{communitySourceSummary.supportedSourceCount}</span>
					<strong>supported API sources</strong>
					<p>GitHub, npm, Packagist, Stack Overflow, and Reddit endpoints that the collector can query.</p>
				</article>
				<article>
					<span>{communitySourceSummary.manualSourceCount}</span>
					<strong>manual research links</strong>
					<p>Apache/Nginx and search-only surfaces kept explicit instead of pretending full telemetry.</p>
				</article>
			</div>

			<section
				class="keyword-graph-panel"
				aria-labelledby="keyword-graph-heading"
				data-community-keyword-search-graph
				data-analytics-linked-keyword-graph
			>
				<div class="collector-plan-heading">
					<div>
						<p class="eyebrow">keywordSearchGraph / analytics-linked-keyword-graph</p>
						<h3 id="keyword-graph-heading">Keyword searches linked to source evidence</h3>
					</div>
					<a href={communityResearchPackHref}>Open graph JSON</a>
				</div>
				<div class="keyword-graph-stats">
					<article>
						<span>{keywordGraphNodes.length}</span>
						<strong>keyword nodes</strong>
					</article>
					<article>
						<span>{keywordSearchGraph.edges.length}</span>
						<strong>source-to-keyword-edge links</strong>
					</article>
					<article>
						<span>{communitySourceSummary.supportedSourceCount}</span>
						<strong>supported-api-lanes</strong>
					</article>
					<article>
						<span>{communitySourceSummary.manualSourceCount}</span>
						<strong>manual-research-lanes</strong>
					</article>
					<article>
						<span>{keywordAnalyticsLinkage.graphicMarkers.length}</span>
						<strong>analytics score markers</strong>
					</article>
				</div>
				<div class="keyword-node-grid">
					{#each keywordGraphNodes as node (node.id)}
						<article>
							<div class="keyword-node-heading">
								<span>{node.id}</span>
								<strong>{node.curatedScore}/100</strong>
							</div>
							<h4>{node.keyword}</h4>
							<p>{node.intent}</p>
							<div class="cue-list">
								<code>{node.supportedApiLanes} supported API lanes</code>
								<code>{node.manualResearchLanes} manual research lanes</code>
								<code>{node.analyticsLinkage.marker}</code>
								<code>curated-signal-score {node.analyticsLinkage.curatedSignalScore}/100</code>
								<code>collected-demand-score {node.analyticsLinkage.collectedDemandScoreField}</code>
								<code>{node.analyticsLinkage.trustLevel}</code>
								{#each node.sourceHosts.slice(0, 4) as host (host)}
									<code>{host}</code>
								{/each}
							</div>
						</article>
					{/each}
				</div>
				<div class="edge-preview" aria-label="Keyword graph source-to-keyword-edge preview">
					{#each keywordGraphEdges as edge (`${edge.from}-${edge.to}`)}
						<article>
							<span>{edge.mode}</span>
							<strong>{edge.from} -> {edge.to}</strong>
							<p>{edge.sourceHost} / {edge.evidenceKind} / {edge.collectionRisk}</p>
							<p>
								<code>analytics-linked-keyword-graph</code>
								keeps this source-to-keyword-edge tied to curated and collected score evidence.
							</p>
						</article>
					{/each}
				</div>
			</section>

			<div class="community-ledger" aria-label="Community evidence coverage ledger">
				<div class="coverage-grid">
					{#each communityCoverageGroups as group (group.label)}
						<article>
							<span>{group.values.length}</span>
							<strong>{group.label}</strong>
							<p>{group.description}</p>
							<div class="coverage-tags">
								{#each group.values as value (value)}
									<code>{value}</code>
								{/each}
							</div>
						</article>
					{/each}
				</div>

				<div class="collector-plan" aria-label="Prioritized community source collection plan">
					<div class="collector-plan-heading">
						<div>
							<p class="eyebrow">Collection plan</p>
							<h3>Open-source analytics sources reviewers can audit first</h3>
						</div>
						<a href={communityResearchPackHref}>Open research pack</a>
					</div>
					<div class="collector-plan-list">
						{#each prioritizedCommunitySources as source (`${source.provider}-${source.sourceHost}`)}
							<article>
								<div>
									<span>{source.mode}</span>
									<strong>{source.provider}</strong>
								</div>
								<p>{source.proofUse}</p>
								<small>{source.sourceHost} / {source.evidenceKind} / {source.collectionRisk}</small>
							</article>
						{/each}
					</div>
				</div>
			</div>

			<figure class="source-map-preview">
				<a href={communitySourceMapSvgHref} aria-label="Open the full community source-map SVG">
					<img
						src={communitySourceMapSvgHref}
						alt="Community source map showing supported API and manual research lanes for open-source analytics sources"
						loading="lazy"
					/>
				</a>
				<figcaption>
					Community source-map graphic: supported public API lanes, manual research links, source hosts, and
					collector endpoints for the alpha analytics evidence bundle.
				</figcaption>
			</figure>

			<div class="analytics-layout">
				<div class="bar-chart" aria-label="Alpha readiness score by category">
					{#each analyticsRows as row (row.label)}
						<div class="bar-row">
							<span>{row.label}</span>
							<div class="bar-track">
								<span style={`--bar:${row.value}%`}></span>
							</div>
							<strong>{row.value}</strong>
						</div>
					{/each}
				</div>

				<div class="signal-list">
					{#each communitySignals as signal (signal.id)}
						<article>
							<div class="signal-score" style={`--score:${signal.metric}%`} aria-hidden="true"></div>
							<div>
								<h3>{signal.keyword}</h3>
								<p>{signal.intent}</p>
								<div class="signal-links">
									{#each signal.communities as community (community.href)}
										<a href={community.href} target="_blank" rel="noreferrer">{community.label}</a>
									{/each}
								</div>
							</div>
						</article>
					{/each}
				</div>
			</div>
		</section>

		<section class="report-preview" aria-labelledby="report-preview-heading">
			<div class="section-heading">
				<p class="eyebrow">Structured export</p>
				<h2 id="report-preview-heading">Report JSON preview</h2>
			</div>
			<pre>{reportJson}</pre>
		</section>
</NativeWindowShell>

<style>
	.hero-actions,
	.card-topline,
	.lane-topline,
	.lane-links,
	.trust-topline,
	.trust-links,
	.signal-links {
		display: flex;
		align-items: center;
	}

	.eyebrow {
		margin: 0 0 0.25rem;
		color: #64708a;
		font-size: 0.75rem;
		font-weight: 800;
		letter-spacing: 0.12em;
		text-transform: uppercase;
	}

	h2,
	h3,
	p {
		margin-top: 0;
	}

	.status-pill,
	.pattern-grid span {
		border: 1px solid rgba(79, 93, 128, 0.18);
		border-radius: 999px;
		padding: 0.42rem 0.66rem;
		background: rgba(255, 255, 255, 0.46);
		color: #46516a;
		font-size: 0.72rem;
		font-weight: 750;
	}

	.hero-grid,
	.readiness-grid,
	.analytics-layout {
		display: grid;
		gap: 1rem;
	}

	.hero-grid {
		grid-template-columns: minmax(0, 1.45fr) minmax(280px, 0.55fr);
		padding: 1.25rem;
	}

	.hero-card,
	.score-card,
	.evidence-lane-panel,
	.trust-model-panel,
	.pattern-panel,
	.native-contract-panel,
	.readiness-card,
	.analytics-panel,
	.report-preview {
		border: 1px solid rgba(79, 93, 128, 0.15);
		border-radius: 24px;
		background: rgba(255, 255, 255, 0.58);
		box-shadow: 0 12px 30px rgba(33, 42, 70, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.74);
	}

	.hero-card,
	.score-card,
	.evidence-lane-panel,
	.trust-model-panel,
	.pattern-panel,
	.native-contract-panel,
	.analytics-panel,
	.report-preview {
		padding: clamp(1rem, 2vw, 1.5rem);
	}

	.hero-card--primary {
		background:
			linear-gradient(135deg, rgba(255, 255, 255, 0.72), rgba(245, 249, 255, 0.52)),
			radial-gradient(circle at 92% 12%, rgba(26, 123, 199, 0.12), transparent 30%);
	}

	.hero-card h2,
	.score-card h2,
	.section-heading h2 {
		margin-bottom: 0.55rem;
		color: #111827;
		font-size: clamp(1.25rem, 2.6vw, 2.7rem);
		line-height: 1.02;
		letter-spacing: -0.06em;
	}

	.hero-card p,
	.score-card p,
	.readiness-card p,
	.analytics-panel p,
	.pattern-grid p,
	.report-preview pre {
		color: #4b5872;
		line-height: 1.6;
	}

	.hero-actions {
		gap: 0.75rem;
		flex-wrap: wrap;
		margin-top: 1.25rem;
	}

	.button {
		display: inline-flex;
		align-items: center;
		min-height: 2.75rem;
		border: 1px solid rgba(79, 93, 128, 0.2);
		border-radius: 999px;
		padding: 0 1rem;
		background: rgba(255, 255, 255, 0.54);
		color: #1f2937;
		font-weight: 800;
		text-decoration: none;
		transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease;
	}

	.button:hover,
	.signal-links a:hover {
		transform: translateY(-1px);
		background: rgba(255, 255, 255, 0.82);
		box-shadow: 0 12px 24px rgba(33, 42, 70, 0.12);
	}

	.button-primary {
		border-color: rgba(13, 116, 196, 0.2);
		background: linear-gradient(135deg, #0d74c4, #11a48f);
		color: white;
	}

	.score-card {
		display: grid;
		place-items: center;
		text-align: center;
	}

	.score-ring,
	.signal-score {
		background: conic-gradient(#0d74c4 var(--score), rgba(79, 93, 128, 0.14) 0);
	}

	.score-ring {
		display: grid;
		place-items: center;
		width: 10.5rem;
		aspect-ratio: 1;
		margin-bottom: 1rem;
		border-radius: 999px;
		box-shadow: inset 0 0 0 16px rgba(255, 255, 255, 0.7), 0 18px 40px rgba(13, 116, 196, 0.16);
	}

	.score-ring strong {
		font-size: 3rem;
		letter-spacing: -0.08em;
	}

	.score-ring span {
		margin-top: -1.6rem;
		color: #64708a;
		font-weight: 800;
	}

	.pattern-panel,
	.evidence-lane-panel,
	.trust-model-panel,
	.native-contract-panel,
	.analytics-panel,
	.report-preview {
		margin: 0 1.25rem 1.25rem;
	}

	.section-heading--span {
		grid-column: 1 / -1;
	}

	.pattern-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 1rem;
	}

	.evidence-lane-grid {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		gap: 1rem;
	}

	.trust-lane-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}

	.native-contract-grid {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 1rem;
	}

	.native-visual-grid {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 1rem;
	}

	.pattern-grid article {
		border: 1px solid rgba(79, 93, 128, 0.13);
		border-radius: 20px;
		padding: 1rem;
		background: rgba(255, 255, 255, 0.38);
	}

	.evidence-lane-grid article {
		display: flex;
		min-height: 13.5rem;
		flex-direction: column;
		justify-content: space-between;
		border: 1px solid rgba(79, 93, 128, 0.13);
		border-radius: 22px;
		padding: 1rem;
		background:
			linear-gradient(135deg, rgba(255, 255, 255, 0.58), rgba(245, 249, 255, 0.36)),
			radial-gradient(circle at 88% 10%, rgba(13, 116, 196, 0.12), transparent 34%);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.68);
	}

	.trust-lane-grid article {
		display: flex;
		min-height: 12rem;
		flex-direction: column;
		justify-content: space-between;
		border: 1px solid rgba(79, 93, 128, 0.13);
		border-radius: 22px;
		padding: 1rem;
		background:
			linear-gradient(135deg, rgba(255, 255, 255, 0.58), rgba(238, 248, 251, 0.36)),
			radial-gradient(circle at 88% 10%, rgba(17, 164, 143, 0.13), transparent 34%);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.68);
	}

	.native-contract-grid article,
	.native-visual-grid article {
		border: 1px solid rgba(79, 93, 128, 0.13);
		border-radius: 22px;
		padding: 1rem;
		background:
			linear-gradient(135deg, rgba(255, 255, 255, 0.54), rgba(245, 249, 255, 0.34)),
			radial-gradient(circle at 90% 10%, rgba(13, 116, 196, 0.1), transparent 32%);
	}

	.pattern-grid h3,
	.native-contract-grid h3,
	.readiness-card h3,
	.signal-list h3 {
		margin: 0.8rem 0 0.4rem;
		color: #111827;
		font-size: 1rem;
	}

	.lane-topline {
		justify-content: space-between;
		gap: 0.75rem;
	}

	.trust-topline {
		justify-content: space-between;
		gap: 0.75rem;
		align-items: flex-start;
	}

	.lane-topline span,
	.lane-links a,
	.trust-topline span,
	.trust-links a {
		border: 1px solid rgba(79, 93, 128, 0.16);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.5);
		color: #0f5c94;
		font-size: 0.72rem;
		font-weight: 850;
		text-decoration: none;
	}

	.lane-topline span,
	.trust-topline span {
		padding: 0.36rem 0.58rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.trust-topline span {
		max-width: 16rem;
		overflow-wrap: anywhere;
	}

	.lane-topline strong,
	.trust-topline strong {
		color: #111827;
		font-size: 1rem;
		text-align: right;
	}

	.evidence-lane-grid p,
	.trust-lane-grid p {
		margin: 1rem 0;
		color: #4b5872;
		font-size: 0.92rem;
		line-height: 1.55;
	}

	.lane-links,
	.trust-links {
		gap: 0.45rem;
		flex-wrap: wrap;
	}

	.lane-links a,
	.trust-links a {
		padding: 0.42rem 0.65rem;
		transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease;
	}

	.lane-links a:hover,
	.trust-links a:hover {
		transform: translateY(-1px);
		background: rgba(255, 255, 255, 0.82);
		box-shadow: 0 12px 24px rgba(33, 42, 70, 0.12);
	}

	.pattern-grid small {
		color: #697690;
		font-weight: 650;
	}

	.contract-kicker,
	.native-responsibility-list span {
		display: inline-flex;
		border: 1px solid rgba(79, 93, 128, 0.16);
		border-radius: 999px;
		padding: 0.38rem 0.62rem;
		background: rgba(255, 255, 255, 0.48);
		color: #0f5c94;
		font-size: 0.72rem;
		font-weight: 850;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.native-marker-list,
	.native-responsibility-list {
		display: grid;
		gap: 0.75rem;
		margin: 1rem 0;
	}

	.native-marker-list div,
	.native-responsibility-list div {
		border: 1px solid rgba(79, 93, 128, 0.12);
		border-radius: 18px;
		padding: 0.8rem;
		background: rgba(255, 255, 255, 0.36);
	}

	.native-marker-list code {
		color: #0f5c94;
		font-size: 0.84rem;
		font-weight: 850;
	}

	.native-marker-list p,
	.native-responsibility-list p {
		margin: 0.45rem 0 0;
		color: #4b5872;
		line-height: 1.5;
	}

	.native-responsibility-list strong {
		display: block;
		color: #111827;
	}

	.visual-row-topline {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.visual-row-topline span {
		border: 1px solid rgba(79, 93, 128, 0.16);
		border-radius: 999px;
		padding: 0.36rem 0.58rem;
		background: rgba(255, 255, 255, 0.5);
		color: #0f5c94;
		font-size: 0.72rem;
		font-weight: 850;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.visual-row-topline strong {
		color: #111827;
		text-align: right;
	}

	.native-visual-grid p {
		color: #4b5872;
		line-height: 1.55;
	}

	.readiness-grid {
		grid-template-columns: repeat(2, minmax(0, 1fr));
		padding: 0 1.25rem 1.25rem;
	}

	.readiness-card {
		padding: 1rem;
	}

	.card-topline {
		justify-content: space-between;
		gap: 1rem;
	}

	.card-topline strong {
		font-size: 1.45rem;
		letter-spacing: -0.05em;
	}

	.status-pill--ready {
		border-color: rgba(18, 164, 111, 0.22);
		background: rgba(18, 164, 111, 0.12);
		color: #0c704e;
	}

	.status-pill--watch {
		border-color: rgba(217, 119, 6, 0.22);
		background: rgba(245, 158, 11, 0.14);
		color: #8a4d00;
	}

	.status-pill--blocked {
		border-color: rgba(220, 38, 38, 0.22);
		background: rgba(244, 63, 94, 0.12);
		color: #a5122e;
	}

	.meter,
	.bar-track {
		overflow: hidden;
		border-radius: 999px;
		background: rgba(79, 93, 128, 0.12);
	}

	.meter {
		height: 0.6rem;
		margin: 1rem 0;
	}

	.meter span,
	.bar-track span {
		display: block;
		width: var(--bar);
		height: 100%;
		border-radius: inherit;
		background: linear-gradient(90deg, #0d74c4, #11a48f);
	}

	.readiness-card ul {
		margin: 0;
		padding-left: 1.1rem;
		color: #334155;
		line-height: 1.55;
	}

	.gap {
		margin-bottom: 0;
		padding-top: 0.75rem;
		border-top: 1px solid rgba(79, 93, 128, 0.13);
	}

	.analytics-layout {
		grid-template-columns: minmax(260px, 0.7fr) minmax(0, 1.3fr);
		align-items: start;
	}

	.source-summary-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.85rem;
		margin: 1rem 0 1.25rem;
	}

	.community-ledger {
		display: grid;
		gap: 1rem;
		margin: 1rem 0 1.25rem;
	}

	.proof-ledger-panel {
		margin: 0 1.5rem 1.5rem;
		padding: 1.25rem;
		border: 1px solid rgba(20, 184, 166, 0.22);
		border-radius: 28px;
		background:
			linear-gradient(135deg, rgba(15, 118, 110, 0.12), rgba(245, 158, 11, 0.08)),
			rgba(255, 255, 255, 0.78);
		box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08);
	}

	.proof-ledger-summary,
	.proof-ledger-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.9rem;
	}

	.proof-ledger-summary {
		margin-top: 1rem;
	}

	.proof-ledger-grid {
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		margin-top: 1rem;
	}

	.proof-ledger-summary article,
	.proof-ledger-card {
		padding: 1rem;
		border: 1px solid rgba(15, 23, 42, 0.1);
		border-radius: 20px;
		background: rgba(255, 255, 255, 0.72);
	}

	.proof-ledger-summary span {
		display: block;
		font-size: clamp(1.8rem, 3vw, 2.6rem);
		font-weight: 800;
		letter-spacing: -0.06em;
	}

	.proof-ledger-card h3 {
		margin: 0.85rem 0 0.4rem;
		font-size: 1rem;
	}

	.proof-ledger-card p {
		margin: 0;
	}

	.proof-ledger-card code {
		color: rgb(15, 118, 110);
		font-size: 0.8rem;
	}

	.proof-ledger-card-topline,
	.proof-ledger-evidence {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		align-items: center;
	}

	.proof-status,
	.proof-ledger-evidence span {
		padding: 0.28rem 0.55rem;
		border-radius: 999px;
		font-size: 0.74rem;
		font-weight: 750;
	}

	.proof-status.alpha-ready {
		background: rgba(22, 163, 74, 0.14);
		color: rgb(21, 128, 61);
	}

	.proof-status.needs-local-gate-proof,
	.proof-status.needs-hosted-proof {
		background: rgba(245, 158, 11, 0.18);
		color: rgb(146, 64, 14);
	}

	.proof-ledger-evidence {
		margin-top: 0.85rem;
	}

	.proof-ledger-evidence span {
		background: rgba(15, 23, 42, 0.07);
		color: rgb(51, 65, 85);
	}

	.stable-blocker {
		margin: 0.85rem 0 0;
		font-size: 0.88rem;
		color: rgb(146, 64, 14);
	}

	.coverage-grid {
		display: grid;
		grid-template-columns: repeat(3, minmax(0, 1fr));
		gap: 0.85rem;
	}

	.source-summary-grid article {
		border: 1px solid rgba(79, 93, 128, 0.13);
		border-radius: 20px;
		padding: 1rem;
		background:
			linear-gradient(135deg, rgba(255, 255, 255, 0.58), rgba(245, 249, 255, 0.36)),
			radial-gradient(circle at 92% 12%, rgba(17, 164, 143, 0.11), transparent 32%);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.68);
	}

	.coverage-grid article,
	.collector-plan {
		border: 1px solid rgba(79, 93, 128, 0.13);
		border-radius: 20px;
		padding: 1rem;
		background:
			linear-gradient(135deg, rgba(255, 255, 255, 0.58), rgba(245, 249, 255, 0.36)),
			radial-gradient(circle at 92% 12%, rgba(13, 116, 196, 0.11), transparent 32%);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.68);
	}

	.source-summary-grid span {
		display: block;
		color: #0d74c4;
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 900;
		line-height: 0.9;
		letter-spacing: -0.08em;
	}

	.coverage-grid span {
		display: block;
		color: #0d74c4;
		font-size: clamp(1.8rem, 3vw, 2.5rem);
		font-weight: 900;
		line-height: 0.95;
		letter-spacing: -0.08em;
	}

	.source-summary-grid strong,
	.coverage-grid strong {
		display: block;
		margin-top: 0.5rem;
		color: #111827;
		font-size: 0.95rem;
	}

	.source-summary-grid p,
	.coverage-grid p {
		margin: 0.45rem 0 0;
		color: #4b5872;
		font-size: 0.86rem;
		line-height: 1.5;
	}

	.coverage-tags,
	.collector-plan-heading,
	.collector-plan-list article div {
		display: flex;
		align-items: center;
	}

	.coverage-tags {
		gap: 0.35rem;
		flex-wrap: wrap;
		margin-top: 0.8rem;
	}

	.coverage-tags code,
	.collector-plan-list span,
	.collector-plan-heading a {
		border: 1px solid rgba(79, 93, 128, 0.16);
		border-radius: 999px;
		background: rgba(255, 255, 255, 0.5);
		color: #0f5c94;
		font-size: 0.72rem;
		font-weight: 850;
		text-decoration: none;
	}

	.coverage-tags code {
		padding: 0.36rem 0.56rem;
		white-space: normal;
	}

	.collector-plan-heading {
		justify-content: space-between;
		gap: 1rem;
		margin-bottom: 1rem;
	}

	.collector-plan-heading h3 {
		margin: 0;
		color: #111827;
		font-size: 1rem;
	}

	.collector-plan-heading a {
		flex: 0 0 auto;
		padding: 0.48rem 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease;
	}

	.collector-plan-heading a:hover {
		transform: translateY(-1px);
		background: rgba(255, 255, 255, 0.82);
		box-shadow: 0 12px 24px rgba(33, 42, 70, 0.12);
	}

	.collector-plan-list {
		display: grid;
		grid-template-columns: repeat(2, minmax(0, 1fr));
		gap: 0.75rem;
	}

	.collector-plan-list article {
		border: 1px solid rgba(79, 93, 128, 0.12);
		border-radius: 16px;
		padding: 0.8rem;
		background: rgba(255, 255, 255, 0.34);
	}

	.collector-plan-list article div {
		justify-content: space-between;
		gap: 0.75rem;
	}

	.collector-plan-list span {
		padding: 0.32rem 0.52rem;
		text-transform: uppercase;
		letter-spacing: 0.08em;
	}

	.collector-plan-list strong {
		color: #111827;
		text-align: right;
	}

	.collector-plan-list p {
		margin: 0.7rem 0 0.45rem;
		color: #4b5872;
		font-size: 0.88rem;
		line-height: 1.5;
	}

	.collector-plan-list small {
		color: #697690;
		font-weight: 750;
	}

	.source-map-preview {
		margin: 1rem 0 1.25rem;
		border: 1px solid rgba(79, 93, 128, 0.13);
		border-radius: 24px;
		padding: 0.75rem;
		background:
			linear-gradient(135deg, rgba(255, 255, 255, 0.6), rgba(245, 249, 255, 0.38)),
			radial-gradient(circle at 92% 8%, rgba(17, 164, 143, 0.14), transparent 28%);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.74), 0 14px 36px rgba(33, 42, 70, 0.08);
	}

	.source-map-preview a {
		display: block;
		overflow: hidden;
		border-radius: 18px;
		background: rgba(255, 255, 255, 0.45);
	}

	.source-map-preview img {
		display: block;
		width: 100%;
		height: auto;
	}

	.source-map-preview figcaption {
		margin-top: 0.75rem;
		color: #4b5872;
		font-size: 0.88rem;
		font-weight: 700;
		line-height: 1.5;
	}

	.bar-chart,
	.signal-list {
		display: grid;
		gap: 0.75rem;
	}

	.bar-row {
		display: grid;
		grid-template-columns: 5rem minmax(0, 1fr) 2.5rem;
		gap: 0.75rem;
		align-items: center;
		color: #334155;
		font-weight: 800;
	}

	.bar-track {
		height: 0.7rem;
	}

	.signal-list article {
		display: grid;
		grid-template-columns: auto minmax(0, 1fr);
		gap: 1rem;
		padding: 1rem;
		border: 1px solid rgba(79, 93, 128, 0.13);
		border-radius: 20px;
		background: rgba(255, 255, 255, 0.4);
	}

	.signal-score {
		width: 3rem;
		aspect-ratio: 1;
		border-radius: 999px;
		box-shadow: inset 0 0 0 8px rgba(255, 255, 255, 0.74);
	}

	.signal-links {
		gap: 0.5rem;
		flex-wrap: wrap;
	}

	.signal-links a {
		border: 1px solid rgba(79, 93, 128, 0.16);
		border-radius: 999px;
		padding: 0.4rem 0.65rem;
		background: rgba(255, 255, 255, 0.54);
		color: #0f5c94;
		font-size: 0.78rem;
		font-weight: 800;
		text-decoration: none;
		transition: transform 140ms ease, box-shadow 140ms ease, background 140ms ease;
	}

	.report-preview pre {
		max-height: 24rem;
		margin: 0;
		overflow: auto;
		border-radius: 18px;
		padding: 1rem;
		background: rgba(13, 23, 42, 0.92);
		color: #dbeafe;
		font-size: 0.82rem;
	}

	@media (prefers-color-scheme: dark) {
		.hero-card,
		.score-card,
		.evidence-lane-panel,
		.trust-model-panel,
		.pattern-panel,
		.native-contract-panel,
		.readiness-card,
		.analytics-panel,
		.report-preview {
			border-color: rgba(255, 255, 255, 0.08);
			background: rgba(15, 23, 42, 0.58);
			box-shadow: 0 24px 70px rgba(0, 0, 0, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.05);
		}

		.hero-card h2,
		.score-card h2,
		.section-heading h2,
		.pattern-grid h3,
		.lane-topline strong,
		.trust-topline strong,
		.native-contract-grid h3,
		.visual-row-topline strong,
		.native-responsibility-list strong,
		.source-summary-grid strong,
		.coverage-grid strong,
		.collector-plan-heading h3,
		.collector-plan-list strong,
		.readiness-card h3,
		.signal-list h3 {
			color: #f8fafc;
		}

		.hero-card p,
		.score-card p,
		.readiness-card p,
		.analytics-panel p,
		.pattern-grid p,
		.evidence-lane-grid p,
		.trust-lane-grid p,
		.native-marker-list p,
		.native-responsibility-list p,
		.native-visual-grid p,
		.source-summary-grid p,
		.coverage-grid p,
		.collector-plan-list p,
		.collector-plan-list small,
		.eyebrow,
		.pattern-grid small {
			color: #b8c3d8;
		}

		.pattern-grid article,
		.evidence-lane-grid article,
		.trust-lane-grid article,
		.signal-list article,
		.source-map-preview,
		.source-map-preview a,
		.source-summary-grid article,
		.coverage-grid article,
		.collector-plan,
		.collector-plan-list article,
		.native-contract-grid article,
		.native-visual-grid article,
		.native-marker-list div,
		.native-responsibility-list div,
		.lane-topline span,
		.lane-links a,
		.trust-topline span,
		.trust-links a,
		.coverage-tags code,
		.collector-plan-list span,
		.collector-plan-heading a,
		.signal-links a,
		.button {
			border-color: rgba(255, 255, 255, 0.09);
			background: rgba(255, 255, 255, 0.045);
			color: #dbeafe;
		}

		.visual-row-topline span {
			border-color: rgba(255, 255, 255, 0.09);
			background: rgba(255, 255, 255, 0.045);
			color: #dbeafe;
		}

		.source-map-preview figcaption {
			color: #b8c3d8;
		}

		.button-primary {
			background: linear-gradient(135deg, #0d74c4, #11a48f);
			color: white;
		}

		.readiness-card ul,
		.bar-row {
			color: #d7def0;
		}

		.report-preview pre {
			background: rgba(2, 6, 23, 0.86);
		}
	}

	@media (max-width: 900px) {
		.hero-grid,
		.readiness-grid,
		.pattern-grid,
		.evidence-lane-grid,
		.trust-lane-grid,
		.native-contract-grid,
		.native-visual-grid,
		.source-summary-grid,
		.coverage-grid,
		.collector-plan-list,
		.analytics-layout {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.hero-grid,
		.readiness-grid {
			padding: 0.75rem;
		}

		.pattern-panel,
		.evidence-lane-panel,
		.trust-model-panel,
		.native-contract-panel,
		.analytics-panel,
		.report-preview {
			margin: 0 0.75rem 0.75rem;
		}

		.bar-row {
			grid-template-columns: 1fr;
			gap: 0.35rem;
		}
	}
	.ultragear-parity-panel {
		margin: 0 1.25rem 1.25rem;
		border: 1px solid rgba(79, 93, 128, 0.15);
		border-radius: 24px;
		padding: clamp(1rem, 2vw, 1.5rem);
		background: rgba(255, 255, 255, 0.58);
		box-shadow: 0 12px 30px rgba(33, 42, 70, 0.08), inset 0 1px 0 rgba(255, 255, 255, 0.74);
	}

	.parity-grid {
		display: grid;
		gap: 1rem;
	}

	.parity-grid article,
	.keyword-graph-panel,
	.keyword-graph-stats article,
	.keyword-node-grid article,
	.edge-preview article {
		border: 1px solid rgba(79, 93, 128, 0.13);
		border-radius: 22px;
		background:
			linear-gradient(135deg, rgba(255, 255, 255, 0.58), rgba(245, 249, 255, 0.36)),
			radial-gradient(circle at 94% 8%, rgba(255, 45, 122, 0.11), transparent 34%);
		box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.68);
	}

	.parity-grid article,
	.keyword-graph-panel,
	.keyword-graph-stats article,
	.keyword-node-grid article,
	.edge-preview article {
		padding: 1rem;
	}

	.parity-topline,
	.keyword-node-heading {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 0.75rem;
	}

	.parity-topline span,
	.keyword-node-heading span,
	.edge-preview span {
		border: 1px solid rgba(79, 93, 128, 0.16);
		border-radius: 999px;
		padding: 0.36rem 0.58rem;
		background: rgba(255, 255, 255, 0.5);
		color: #0f5c94;
		font-size: 0.72rem;
		font-weight: 850;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.parity-topline strong,
	.keyword-node-heading strong,
	.edge-preview strong {
		color: #111827;
		font-size: 1rem;
		text-align: right;
	}

	.parity-columns {
		display: grid;
		grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
		gap: 1rem;
		margin: 1rem 0;
	}

	.parity-columns h3,
	.keyword-node-grid h4 {
		margin: 0 0 0.65rem;
		color: #111827;
		font-size: 0.95rem;
	}

	.cue-list {
		display: flex;
		gap: 0.38rem;
		flex-wrap: wrap;
	}

	.cue-list code {
		border: 1px solid rgba(79, 93, 128, 0.16);
		border-radius: 999px;
		padding: 0.36rem 0.56rem;
		background: rgba(255, 255, 255, 0.5);
		color: #0f5c94;
		font-size: 0.72rem;
		font-weight: 850;
		white-space: normal;
	}

	.parity-grid p,
	.keyword-node-grid p,
	.edge-preview p {
		margin: 0.65rem 0 0;
		color: #4b5872;
		line-height: 1.55;
	}

	.keyword-graph-panel {
		margin: 1rem 0 1.25rem;
		background:
			linear-gradient(135deg, rgba(255, 255, 255, 0.56), rgba(245, 249, 255, 0.34)),
			radial-gradient(circle at 92% 10%, rgba(13, 116, 196, 0.12), transparent 32%);
	}

	.keyword-graph-stats,
	.keyword-node-grid,
	.edge-preview {
		display: grid;
		gap: 0.75rem;
	}

	.keyword-graph-stats {
		grid-template-columns: repeat(5, minmax(0, 1fr));
		margin-bottom: 0.85rem;
	}

	.keyword-node-grid,
	.edge-preview {
		grid-template-columns: repeat(2, minmax(0, 1fr));
	}

	.edge-preview {
		margin-top: 0.85rem;
	}

	.keyword-graph-stats span {
		display: block;
		color: #0d74c4;
		font-size: clamp(1.8rem, 3vw, 2.4rem);
		font-weight: 900;
		line-height: 0.95;
		letter-spacing: -0.08em;
	}

	.keyword-graph-stats strong {
		display: block;
		margin-top: 0.5rem;
		color: #111827;
		font-size: 0.95rem;
	}

	@media (prefers-color-scheme: dark) {
		.ultragear-parity-panel,
		.parity-grid article,
		.keyword-graph-panel,
		.keyword-graph-stats article,
		.keyword-node-grid article,
		.edge-preview article {
			border-color: rgba(255, 255, 255, 0.09);
			background: rgba(255, 255, 255, 0.045);
			box-shadow: 0 24px 70px rgba(0, 0, 0, 0.26), inset 0 1px 0 rgba(255, 255, 255, 0.05);
		}

		.parity-topline strong,
		.parity-columns h3,
		.keyword-node-heading strong,
		.keyword-node-grid h4,
		.edge-preview strong,
		.keyword-graph-stats strong {
			color: #f8fafc;
		}

		.parity-grid p,
		.keyword-node-grid p,
		.edge-preview p {
			color: #b8c3d8;
		}

		.parity-topline span,
		.keyword-node-heading span,
		.edge-preview span,
		.cue-list code {
			border-color: rgba(255, 255, 255, 0.09);
			background: rgba(255, 255, 255, 0.045);
			color: #dbeafe;
		}
	}

	@media (max-width: 900px) {
		.parity-columns,
		.keyword-graph-stats,
		.keyword-node-grid,
		.edge-preview {
			grid-template-columns: 1fr;
		}
	}

	@media (max-width: 640px) {
		.ultragear-parity-panel {
			margin: 0 0.75rem 0.75rem;
		}
	}
</style>

