import type { AlphaReadinessReport } from './alpha-readiness';
import { buildBridgeReuseInventory } from './alpha-bridge-reuse';
import { buildCommunityResearchPack } from './alpha-community-research-pack';
import { buildAlphaHardProofBlockers } from './alpha-hard-proof-blockers';
import { buildAlphaNativeHostContract } from './alpha-native-host-contract';
import { buildAlphaNativeHostWrapperSmoke } from './alpha-native-host-wrapper-smoke';
import { requiredAlphaEvidence } from './alpha-required-evidence';

type CommunityAnalyticsArtifact = {
	collectedAt?: string;
	summary?: {
		successfulSources?: number;
		failedSources?: number;
		skippedSources?: number;
		averageDemandScore?: number;
	};
	queries?: {
		keyword: string;
		intent?: string;
		aggregate?: {
			demandScore?: number;
			totalMentions?: number;
			successfulSources?: number;
			failedSources?: number;
			skippedSources?: number;
		};
	}[];
} | null;

type RemoteSmokeArtifact = {
	status?: string;
	checkedAt?: string;
	baseUrl?: string;
	reason?: string;
	checks?: unknown[];
} | null;

function formatCoverage(values: { value: string; count: number }[] = []) {
	return values.map((item) => `${item.value}: ${item.count}`).join(', ');
}

export function renderAlphaReadinessMarkdown(
	report: AlphaReadinessReport,
	communityAnalytics: CommunityAnalyticsArtifact = null,
	remoteSmoke: RemoteSmokeArtifact = null
) {
	const bridgeReuseInventory = buildBridgeReuseInventory(report);
	const nativeHostContract = buildAlphaNativeHostContract(report);
	const nativeHostWrapperSmoke = buildAlphaNativeHostWrapperSmoke(report);
	const communityResearchPack = buildCommunityResearchPack(report);
	const keywordSearchGraph = communityResearchPack.keywordSearchGraph;
	const progressReportHandoff = bridgeReuseInventory.progressReportHandoff;
	const nativeVisualMatrix = bridgeReuseInventory.nativeVisualMatrix;
	const nativeHostCompatibilityMatrix = bridgeReuseInventory.nativeHostCompatibilityMatrix;
	const nativePlatformProvenance = bridgeReuseInventory.nativePlatformProvenance;
	const desktopShellUiBinding = nativeHostContract.desktopShellUiBinding;
	const hardProofBlockers = buildAlphaHardProofBlockers();
	const lines = [
		`# SvelteKit PHP ${report.target} readiness report`,
		'',
		`- Issued: ${report.issued}`,
		`- Overall score: ${report.overallScore}/100`,
		`- Bridge source: ${report.bridgeSource}`,
		`- Release policy: \`${report.releasePolicy.marker}\`; channel \`${report.releasePolicy.channel}\`; track \`${report.releasePolicy.track}\`; rank \`${report.releasePolicy.rank}\`.`,
		`- Summary: ${report.summary.ready} ready, ${report.summary.watch} watch, ${report.summary.blocked} blocked`,
		'',
		'## Release policy',
		'',
		`- Marker: \`${report.releasePolicy.marker}\``,
		`- Channel: \`${report.releasePolicy.channel}\``,
		`- Track: \`${report.releasePolicy.track}\``,
		`- Rank: \`${report.releasePolicy.rank}\``,
		`- Disallowed channels: ${report.releasePolicy.disallowedChannels.map((channel) => `\`${channel}\``).join(', ')}`,
		`- Rule: ${report.releasePolicy.releaseRule}`,
		`- Stable promotion rule: ${report.releasePolicy.stablePromotionRule}`,
		'',
		'## Required alpha evidence',
		'',
		'These `requiredEvidence` markers must remain synchronized with the `required-alpha-evidence` surface across package metadata, package contract, release manifest, evidence index, hosted smoke checklist, remote smoke, and report handoffs before this can be treated as an alpha-ready candidate.',
		'',
		...requiredAlphaEvidence.map((marker) => `- \`${marker}\``),
		'',
		'## Alpha proof ledger',
		'',
		'This ledger separates source-level alpha evidence from proof still needed before stable `1.0.0`.',
		''
	];

	for (const item of report.proofLedger) {
		lines.push(`### ${item.id}`, '');
		lines.push(`- Marker: \`${item.marker}\``);
		lines.push(`- Status: \`${item.status}\``);
		lines.push(`- Proves: ${item.proves}`);
		lines.push('- Evidence:');
		for (const evidence of item.evidence) {
			lines.push(`  - ${evidence}`);
		}
		lines.push(`- Stable blocker: ${item.stableBlocker}`, '');
	}

	lines.push(
		'## No-hydration prerender proof',
		'',
		'- Runtime fixture: `/alpha-readiness/no-hydration`.',
		'- Required evidence marker: `csr-disabled-prerender-contract`.',
		'- Stable SSR marker: `theme-stable-ssr-html`.',
		'- Route contract: `prerender=true` and `csr=false`.',
		'- Hosted smoke must reject `<script`, `sveltekit:start`, and `data-sveltekit-hydrate` in the fixture HTML.',
		'- Release use: proves blog/static-theme pages can avoid client hydration repaint when the route is intended to be fully prerendered.',
		'',
		'## Current Svelte 5/SvelteKit 2 adapter parity snapshot',
		'',
		`- Last reviewed: ${report.latestPackageSnapshotReviewed}.`,
		'- Marker: `latest-sveltekit-compatibility-audit`.',
		'- Same-major support: Svelte 5 and SvelteKit 2 stay green through the packed latest-same-major fixture smoke.',
		'- Validation lane: Vite 8 and `@sveltejs/vite-plugin-svelte` 7 have isolated fixture proof through `alpha:latest-vite-major:smoke`; dependency floors stay unchanged.',
		'',
		...report.latestPackageSnapshot.map(
			(item) =>
				`- ${item.packageName}: latest ${item.latest}; repo range ${item.currentRange}; support ${item.support}; ${item.stance}`
		),
		'',
		'### Official adapter snapshot',
		'',
		...report.officialAdapterSnapshot.map(
			(item) =>
				`- ${item.packageName}: latest ${item.latest}; support ${item.support}; parity use: ${item.parityUse}`
		),
		'',
		'## Live blog consumer evidence',
		'',
		`- Marker: \`${report.liveConsumerEvidence.marker}\`.`,
		`- URL: ${report.liveConsumerEvidence.url}.`,
		`- Status: \`${report.liveConsumerEvidence.status}\`.`,
		`- Root/robots/sitemap: ${report.liveConsumerEvidence.staticNoHydration.homepageStatus}/${report.liveConsumerEvidence.staticNoHydration.robotsStatus}/${report.liveConsumerEvidence.staticNoHydration.sitemapStatus}.`,
		`- Static/no-hydration observed: data-site Ryan ${report.liveConsumerEvidence.staticNoHydration.dataSiteRyan}; Ryan metadata ${report.liveConsumerEvidence.staticNoHydration.ryanMetadataPresent}; sveltekit:start marker ${report.liveConsumerEvidence.staticNoHydration.sveltekitStartMarkerPresent}; module script marker ${report.liveConsumerEvidence.staticNoHydration.moduleScriptPresent}; __sveltekit marker ${report.liveConsumerEvidence.staticNoHydration.sveltekitMarkerPresent}.`,
		`- SEO audit: ${report.liveConsumerEvidence.seoAudit.tool} ${report.liveConsumerEvidence.seoAudit.reportId}; ${report.liveConsumerEvidence.seoAudit.pagesScanned} pages; score ${report.liveConsumerEvidence.seoAudit.score}; grade ${report.liveConsumerEvidence.seoAudit.grade}; findings ${report.liveConsumerEvidence.seoAudit.findings.high} high, ${report.liveConsumerEvidence.seoAudit.findings.medium} medium, ${report.liveConsumerEvidence.seoAudit.findings.low} low, ${report.liveConsumerEvidence.seoAudit.findings.info} info.`,
		'- Boundary: blog.ryanspice.com is consumer proof for real static/no-hydration behavior; it does not replace the dedicated hosted PHP adapter fixture.',
		'- Follow-up notes:',
		...report.liveConsumerEvidence.planningNotes.map((note) => `  - ${note}`),
		'',
		'## Hard proof blockers',
		'',
		'The `hard-proof-blocker-ledger` keeps stable-promotion blockers synchronized across manifest, gate matrix, package contract, release notes, reviewer index, and generated reports.',
		'',
		...hardProofBlockers.flatMap((blocker) => [
			`### ${blocker.id}`,
			'',
			`- Marker: \`${blocker.marker}\``,
			`- Status: \`${blocker.status}\``,
			`- Scope: \`${blocker.scope}\``,
			`- Required command: \`${blocker.requiredCommand}\``,
			`- Required artifacts: ${blocker.requiredArtifacts.map((artifact) => `\`${artifact}\``).join(', ')}`,
			`- Blocks: \`${blocker.blocks}\``,
			`- Reviewer action: ${blocker.reviewerAction}`,
			''
		]),
		'## Evidence trust model',
		'',
		'- `deterministic-local-artifact`: generated reports, graphics, CSVs, manifests, and contracts from source-controlled alpha modules.',
		'- `directional-community-signal`: public-source community analytics collected by `bun run alpha:analytics`; counts are not telemetry.',
		'- `no-live-community-api-runtime-boundary`: runtime community analytics endpoints serve deterministic report handoffs; public-source collection stays in explicit local/CI commands.',
		'- `deterministic-runtime-evidence`: runtime endpoints serve deterministic report data and do not call live community APIs.',
		'- `requires-alpha-smoke-base-url-for-pass-evidence`: hosted smoke only proves deployment after `ALPHA_SMOKE_BASE_URL` targets a real PHP host.',
		'',
		'## Native host bridge status',
		'',
		'- Live page marker: `data-native-host-bridge-status`.',
		'- Live handoff controls marker: `data-native-host-handoff-controls`.',
		'- Native host binding guide: `/alpha-readiness/native-host-guide.md` and `report/alpha-native-host-guide.md`.',
		'- Optional host controller: `window.__SVELTEKIT_PHP_NATIVE_HOST__` with `startDragging`, `toggleMaximize`, `setWindowEffect`, `setProgress`, `clearProgress`, and `reportReady` handlers.',
		'- Handoff actions: `set-window-effect`, `set-progress`, `clear-progress`, and `report-ready` are emitted as browser-safe `native-window-action` events.',
		'- Browser fallback history: `window.__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__` records `browser-fallback`, `native-host`, and `unsupported` results.',
		'- Boundary: Windows Mica and macOS chrome commands remain host-owned; `macos-material-host-policy`, `source-observed-macos-host-scaffold`, and `macos-native-vibrancy-unverified` keep macOS material support source-observed until real macOS host smoke exists.',
		'',
		'## Native host wrapper smoke handoff',
		'',
		`- Marker: \`${nativeHostWrapperSmoke.marker}\`.`,
		`- Status: \`${nativeHostWrapperSmoke.status}\`.`,
		`- Command: \`${nativeHostWrapperSmoke.command}\`.`,
		`- Runtime endpoint: \`${nativeHostWrapperSmoke.runtimeEndpoint}\`.`,
		`- Generated artifact: \`${nativeHostWrapperSmoke.artifact}\`.`,
		`- Trust level: \`${nativeHostWrapperSmoke.trustLevel}\`.`,
		`- realHostVerified: \`${nativeHostWrapperSmoke.realHostVerified}\` (the deterministic report does not claim a Windows/macOS wrapper run).`,
		`- Required actions: ${nativeHostWrapperSmoke.summary.requiredActions.map((action) => `\`${action}\``).join(', ')}.`,
		`- Required helpers: ${nativeHostWrapperSmoke.summary.requiredHelpers.map((helper) => `\`${helper}\``).join(', ')}.`,
		`- Event replay contract: \`${nativeHostWrapperSmoke.eventReplayContract.marker}\` over \`${nativeHostWrapperSmoke.eventReplayContract.eventName}\`, expecting \`${nativeHostWrapperSmoke.eventReplayContract.expectedMode}\` history and \`noFallbackAllowedForRealHost\`.`,
		`- Event replay transcript: ${nativeHostWrapperSmoke.summary.eventReplayExpectationCount} \`native-host-wrapper-event-replay-step\` entries with \`expectedHistoryResult\` and \`expectedDesktopShellUiHelper\` fields.`,
		'- Progress-state contract: `TaskbarProgressState` expectations are generated from `toDesktopShellUiTaskbarProgressState` and checked before a wrapper calls `syncTaskbarProgress`.',
		`- Probe steps: ${nativeHostWrapperSmoke.summary.probeStepCount}; progress expectations: ${nativeHostWrapperSmoke.summary.progressExpectationCount}; missing actions: ${nativeHostWrapperSmoke.summary.missingActions.length}; missing mappings: ${nativeHostWrapperSmoke.summary.missingMappings.length}; failed progress expectations: ${nativeHostWrapperSmoke.summary.failedProgressExpectations.length}.`,
		`- Boundary: ${nativeHostWrapperSmoke.noNativeApiBoundary.reason}`,
		`- Stable blocker: ${nativeHostWrapperSmoke.stableBlocker}`,
		'',
		'## UltraGear source parity',
		'',
		'- Live page marker: `data-ultragear-source-parity`.',
		'- Contract marker: `ultraGearParityContract`.',
		'- Proof stage: `source-cue-to-adapter-evidence-map`.',
		''
	);

	for (const row of bridgeReuseInventory.ultraGearParityContract.parityRows) {
		lines.push(`### ${row.sourceFile}`, '');
		lines.push(`- Source cues: ${row.sourceCues.map((cue) => `\`${cue}\``).join(', ')}`);
		lines.push(`- Adapter evidence: ${row.localEvidence.map((cue) => `\`${cue}\``).join(', ')}`);
		lines.push(`- Boundary: ${row.boundary}`, '');
	}

	lines.push(
		'## Reusable UltraGear desktop shell binding',
		'',
		`- Live page marker: \`data-desktop-shell-ui-binding\`.`,
		`- Contract marker: \`${desktopShellUiBinding.marker}\`.`,
		`- Package: \`${desktopShellUiBinding.packageName}\`.`,
		`- Source package: \`${desktopShellUiBinding.sourcePackage}\`.`,
		`- Upstream widget source: \`${desktopShellUiBinding.upstreamWidgetSource}\`.`,
		`- Installer: \`${desktopShellUiBinding.controllerBinding.installer}\`.`,
		`- Host global: \`${desktopShellUiBinding.controllerBinding.global}\`.`,
		`- Reused helpers: ${desktopShellUiBinding.requiredImports.map((helper) => `\`${helper}\``).join(', ')}.`,
		`- Proof use: ${desktopShellUiBinding.proofUse}`,
		''
	);

	for (const handler of desktopShellUiBinding.controllerBinding.handlers) {
		lines.push(`### ${handler.action}`, '');
		lines.push(`- Handler: \`${handler.handler}\`.`);
		lines.push(`- UltraGear implementation: \`${handler.ultraGearImplementation}\`.`);
		lines.push(`- Native host bridge mapping: \`${handler.nativeHostBridgeMapping}\`.`);
		lines.push(`- Detail fields: ${handler.detailFields.map((field) => `\`${field}\``).join(', ')}.`);
		lines.push(`- Notes: ${handler.notes}`, '');
	}

	lines.push(
		'## UltraGear native platform provenance',
		'',
		`- Marker: \`${nativePlatformProvenance.marker}\``,
		`- Source root: \`${nativePlatformProvenance.sourceRoot}\``,
		`- Source files: ${nativePlatformProvenance.sourceFiles.map((file) => `\`${file}\``).join(', ')}.`,
		`- Windows Mica cues: ${nativePlatformProvenance.windowsMicaCues.map((cue) => `\`${cue}\``).join(', ')}.`,
		`- macOS chrome cues: ${nativePlatformProvenance.macosChromeCues.map((cue) => `\`${cue}\``).join(', ')}.`,
		'- macOS host-material boundary markers: `macos-material-host-policy`, `source-observed-macos-host-scaffold`, `macos-native-vibrancy-unverified`.',
		`- Window-action cues: ${nativePlatformProvenance.windowActionCues.map((cue) => `\`${cue}\``).join(', ')}.`,
		`- Progress/report cues: ${nativePlatformProvenance.progressReportCues.map((cue) => `\`${cue}\``).join(', ')}.`,
		`- Adapter evidence: ${nativePlatformProvenance.adapterEvidence.map((item) => `\`${item}\``).join(', ')}.`,
		'- Proof use: keeps Windows 11 Mica, source-observed macOS host-material policy, unverified native macOS vibrancy, host-owned window actions, and structured report/progress handoff tied to concrete LG UltraGear source files.',
		'',
		'## Native visual matrix',
		'',
		'- Live page marker: `data-native-visual-matrix`.',
		'- Contract marker: `native-visual-matrix`.',
		`- Rows: ${nativeVisualMatrix.rows.map((row) => `\`${row}\``).join(', ')}.`,
		`- UltraGear cues: ${nativeVisualMatrix.sourceCues.map((cue) => `\`${cue}\``).join(', ')}.`,
		`- Proof use: ${nativeVisualMatrix.proofUse}`,
		'',
		'## Native host compatibility matrix',
		'',
		'- Required evidence marker: `native-host-compatibility-matrix`.',
		`- Contract marker: \`${nativeHostCompatibilityMatrix.marker}\`.`,
		`- Trust level: \`${nativeHostCompatibilityMatrix.trustLevel}\`.`,
		'- Proof stage: `source-observed-host-compatibility-contract`.',
		'- Boundary: maps observed UltraGear Windows/native host cues to browser-safe adapter host actions without claiming real OS-native smoke proof.',
		...nativeHostCompatibilityMatrix.rows.flatMap((row) => [
			`### ${row.id}`,
			'',
			`- Evidence row: \`${JSON.stringify(row)}\`.`,
			''
		]),
		'## UltraGear progress and report handoff',
		'',
		'- Live page marker: `data-progress-report-handoff`.',
		'- Contract marker: `progressReportHandoff`.',
		`- Source cues: ${progressReportHandoff.sourceCues.map((cue) => `\`${cue}\``).join(', ')}.`,
		`- Adapter evidence: ${progressReportHandoff.adapterEvidence.map((item) => `\`${item}\``).join(', ')}.`,
		`- statusMapping: ${progressReportHandoff.statusMapping.map((status) => `\`${status.adapterState}\` -> \`${status.hostCue}\` (${status.reportCue})`).join('; ')}.`,
		`- Proof use: ${progressReportHandoff.proofUse}`,
		'',
		'## Community keyword search graph',
		'',
		'- Live page marker: `data-community-keyword-search-graph`.',
		'- Contract marker: `keywordSearchGraph`.',
		`- Keyword nodes: ${keywordSearchGraph.nodes.length}.`,
		`- Source-to-keyword-edge links: ${keywordSearchGraph.edges.length}.`,
		`- Analytics freshness contract: \`${communityResearchPack.analyticsFreshnessContract.marker}\`; refresh within ${communityResearchPack.analyticsFreshnessContract.maxAgeHours} hours before alpha release review.`,
		`- Supported-api-lanes: ${communityResearchPack.summary.supportedSourceCount}.`,
		`- Manual-research-lanes: ${communityResearchPack.summary.manualSourceCount}.`,
		'- Source checklist marker: `alpha-community-source-evidence-checklist` keeps release-use, source-health, and blocked-source handling attached to every source descriptor.',
		'- Analytics linkage: `analytics-linked-keyword-graph` ties `curated-signal-score` to `collected-demand-score` fields under the `directional-community-signal` trust model, while `no-live-community-api-runtime-boundary` keeps runtime endpoints deterministic.',
		''
	);

	for (const node of keywordSearchGraph.nodes) {
		lines.push(
			`- ${node.id}: ${node.keyword}; ${node.supportedApiLanes} supported API lanes, ${node.manualResearchLanes} manual research lanes; curated-signal-score ${node.curatedScore}/100; collected-demand-score field ${node.analyticsLinkage.collectedDemandScoreField}; hosts ${node.sourceHosts.join(', ')}.`
		);
	}

	lines.push(
		'',
		'## Community evidence coverage ledger',
		'',
		`- Providers (${communityResearchPack.summary.providerCoverage.length}): ${formatCoverage(communityResearchPack.summary.providerCoverage)}`,
		`- Evidence kinds (${communityResearchPack.summary.evidenceKindCoverage.length}): ${formatCoverage(communityResearchPack.summary.evidenceKindCoverage)}`,
		`- Collection risk (${communityResearchPack.summary.collectionRiskCoverage.length}): ${formatCoverage(communityResearchPack.summary.collectionRiskCoverage)}`,
		`- Source health (${communityResearchPack.summary.sourceHealthCoverage.length}): ${formatCoverage(communityResearchPack.summary.sourceHealthCoverage)}`,
		`- Result total fields (${communityResearchPack.summary.resultTotalFieldCoverageByField.length}): ${formatCoverage(communityResearchPack.summary.resultTotalFieldCoverageByField)}`,
		'',
		'## Open-source analytics sources reviewers can audit first',
		''
	);

	for (const source of communityResearchPack.collectionPlan.slice(0, 6)) {
		lines.push(
			`- ${source.provider} (${source.sourceHost}): ${source.mode}, ${source.evidenceKind}, ${source.collectionRisk}, ${source.sourceHealth}. Result field: ${source.resultTotalField}. Top fields: ${source.topResultFields.join(', ')}. Sample rule: ${source.sampleReviewRule} Proof use: ${source.proofUse} Release use: ${source.releaseUse} Checklist: ${source.alphaEvidenceChecklist.join(', ')}. Blocked policy: ${source.blockedOutcomePolicy}`
		);
	}

	lines.push(
		'',
		'## UltraGear bridge reuse map',
		''
	);

	for (const pattern of report.bridgePatterns) {
		lines.push(`### ${pattern.label}`, '');
		lines.push(`- Status: ${pattern.status}`);
		lines.push(`- Source: ${pattern.source}`);
		lines.push(`- Adopted: ${pattern.adopted}`, '');
	}

	lines.push('## Readiness areas', '');
	for (const area of report.readinessAreas) {
		lines.push(`### ${area.title}`, '');
		lines.push(`- Status: ${area.status}`);
		lines.push(`- Score: ${area.score}/100`);
		lines.push(`- Description: ${area.description}`);
		lines.push('- Evidence:');
		for (const item of area.evidence) {
			lines.push(`  - ${item}`);
		}
		lines.push(`- Gap: ${area.gap}`, '');
	}

	lines.push('## Community keyword signals', '');
	for (const signal of report.communitySignals) {
		lines.push(`### ${signal.keyword}`, '');
		lines.push(`- Intent: ${signal.intent}`);
		lines.push(`- Signal score: ${signal.metric}/100`);
		lines.push('- Research links:');
		for (const community of signal.communities) {
			lines.push(`  - [${community.label}](${community.href})`);
		}
		lines.push('');
	}

	lines.push('## Report graphics', '');
	lines.push('- Readiness release card: `/alpha-readiness/report.svg`');
	lines.push('- Community source map: `/alpha-readiness/community-source-map.svg`');
	lines.push(
		'- Generated artifact: `report/alpha-community-source-map.svg` maps supported-json-api and manual-research-link lanes for the keyword research sources and carries `no-live-community-api-runtime-boundary` metadata.',
		''
	);

	lines.push('## Collected community analytics', '');
	if (communityAnalytics) {
		lines.push(`- Collected: ${communityAnalytics.collectedAt ?? 'unknown'}`);
		lines.push(`- Successful sources: ${communityAnalytics.summary?.successfulSources ?? 0}`);
		lines.push(`- Failed sources: ${communityAnalytics.summary?.failedSources ?? 0}`);
		lines.push(`- Skipped sources: ${communityAnalytics.summary?.skippedSources ?? 0}`);
		lines.push(`- Average demand score: ${communityAnalytics.summary?.averageDemandScore ?? 0}/100`, '');

		for (const query of communityAnalytics.queries ?? []) {
			lines.push(`### ${query.keyword}`, '');
			lines.push(`- Demand score: ${query.aggregate?.demandScore ?? 0}/100`);
			lines.push(`- Total mentions: ${query.aggregate?.totalMentions ?? 0}`);
			lines.push(
				`- Sources: ${query.aggregate?.successfulSources ?? 0} ok, ${query.aggregate?.failedSources ?? 0} failed, ${query.aggregate?.skippedSources ?? 0} skipped`,
				''
			);
		}
	} else {
		lines.push(
			'No collected analytics artifact found. Run `bun run alpha:analytics` before `bun run alpha:report` to embed public community-source counts.',
			''
		);
	}

	lines.push('## Hosted deployment smoke', '');
	if (remoteSmoke) {
		lines.push(`- Status: ${remoteSmoke.status ?? 'unknown'}`);
		lines.push(`- Checked: ${remoteSmoke.checkedAt ?? 'unknown'}`);
		if (remoteSmoke.baseUrl) {
			lines.push(`- Base URL: ${remoteSmoke.baseUrl}`);
		}
		if (remoteSmoke.reason) {
			lines.push(`- Reason: ${remoteSmoke.reason}`);
		}
		lines.push(`- Checks recorded: ${(remoteSmoke.checks ?? []).length}`, '');
	} else {
		lines.push(
			'No hosted deployment smoke artifact found. Set `ALPHA_SMOKE_BASE_URL` and run `bun run alpha:remote:smoke` after deploying to record real-host evidence.',
			''
		);
	}

	lines.push('## Limitations', '');
	for (const limitation of report.limitations) {
		lines.push(`- ${limitation}`);
	}

	lines.push('');
	return lines.join('\n');
}

