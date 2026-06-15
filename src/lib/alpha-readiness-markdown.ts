import type { AlphaReadinessReport } from './alpha-readiness';
import { buildBridgeReuseInventory } from './alpha-bridge-reuse';
import { buildCommunityResearchPack } from './alpha-community-research-pack';
import { buildAlphaNativeHostContract } from './alpha-native-host-contract';
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

export function renderAlphaReadinessMarkdown(
	report: AlphaReadinessReport,
	communityAnalytics: CommunityAnalyticsArtifact = null,
	remoteSmoke: RemoteSmokeArtifact = null
) {
	const bridgeReuseInventory = buildBridgeReuseInventory(report);
	const nativeHostContract = buildAlphaNativeHostContract(report);
	const communityResearchPack = buildCommunityResearchPack(report);
	const keywordSearchGraph = communityResearchPack.keywordSearchGraph;
	const progressReportHandoff = bridgeReuseInventory.progressReportHandoff;
	const nativeVisualMatrix = bridgeReuseInventory.nativeVisualMatrix;
	const nativePlatformProvenance = bridgeReuseInventory.nativePlatformProvenance;
	const desktopShellUiBinding = nativeHostContract.desktopShellUiBinding;
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
		'## Evidence trust model',
		'',
		'- `deterministic-local-artifact`: generated reports, graphics, CSVs, manifests, and contracts from source-controlled alpha modules.',
		'- `directional-community-signal`: public-source community analytics collected by `bun run alpha:analytics`; counts are not telemetry.',
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
		'- Boundary: Windows Mica and macOS chrome commands remain host-owned; the PHP/browser runtime stays deployable.',
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
		`- Window-action cues: ${nativePlatformProvenance.windowActionCues.map((cue) => `\`${cue}\``).join(', ')}.`,
		`- Progress/report cues: ${nativePlatformProvenance.progressReportCues.map((cue) => `\`${cue}\``).join(', ')}.`,
		`- Adapter evidence: ${nativePlatformProvenance.adapterEvidence.map((item) => `\`${item}\``).join(', ')}.`,
		'- Proof use: keeps Windows 11 Mica, macOS-native chrome, host-owned window actions, and structured report/progress handoff tied to concrete LG UltraGear source files.',
		'',
		'## Native visual matrix',
		'',
		'- Live page marker: `data-native-visual-matrix`.',
		'- Contract marker: `native-visual-matrix`.',
		`- Rows: ${nativeVisualMatrix.rows.map((row) => `\`${row}\``).join(', ')}.`,
		`- UltraGear cues: ${nativeVisualMatrix.sourceCues.map((cue) => `\`${cue}\``).join(', ')}.`,
		`- Proof use: ${nativeVisualMatrix.proofUse}`,
		'',
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
		'- Analytics linkage: `analytics-linked-keyword-graph` ties `curated-signal-score` to `collected-demand-score` fields under the `directional-community-signal` trust model.',
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
		`- Providers (${communityResearchPack.summary.providerCoverage.length}): ${communityResearchPack.summary.providerCoverage.join(', ')}`,
		`- Evidence kinds (${communityResearchPack.summary.evidenceKindCoverage.length}): ${communityResearchPack.summary.evidenceKindCoverage.join(', ')}`,
		`- Collection risk (${communityResearchPack.summary.collectionRiskCoverage.length}): ${communityResearchPack.summary.collectionRiskCoverage.join(', ')}`,
		'',
		'## Open-source analytics sources reviewers can audit first',
		''
	);

	for (const source of communityResearchPack.collectionPlan.slice(0, 6)) {
		lines.push(
			`- ${source.provider} (${source.sourceHost}): ${source.mode}, ${source.evidenceKind}, ${source.collectionRisk}. Proof use: ${source.proofUse}`
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
		'- Generated artifact: `report/alpha-community-source-map.svg` maps supported-json-api and manual-research-link lanes for the keyword research sources.',
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
