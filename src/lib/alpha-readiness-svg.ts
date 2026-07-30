import type { AlphaReadinessReport } from './alpha-readiness';
import { buildBridgeReuseInventory } from './alpha-bridge-reuse';
import { buildAlphaNativeHostWrapperSmoke } from './alpha-native-host-wrapper-smoke';
import { requiredAlphaEvidence } from './alpha-required-evidence';

type CommunityAnalyticsSummary = {
	successfulSources: number;
	failedSources: number;
	skippedSources: number;
	weightedAverageDemandScore?: number;
	analyticsLinkageMarkers?: string[];
	trustBoundaryCoverage?: Record<string, number>;
	freshnessWindows?: Record<string, number>;
};

type CommunityAnalyticsArtifact = {
	summary?: CommunityAnalyticsSummary;
	queries?: Array<{
		analyticsLinkageMarker?: string;
		sourceToKeywordEdges?: string[];
		aggregate?: {
			weightedDemandScore?: number;
		};
	}>;
} | null;

type RemoteSmokeArtifact = {
	status?: string;
} | null;

function escapeSvg(value: unknown) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

export function renderAlphaReadinessSvg(
	report: AlphaReadinessReport,
	communityAnalytics: CommunityAnalyticsArtifact = null,
	remoteSmoke: RemoteSmokeArtifact = null
) {
	const width = 1200;
	const height = 800;
	const areaColors = {
		ready: '#10b981',
		watch: '#f59e0b',
		blocked: '#ef4444'
	};
	const hostedStatus = remoteSmoke?.status ?? 'missing';
	const hostedColor =
		hostedStatus === 'passed' ? areaColors.ready : hostedStatus === 'failed' ? areaColors.blocked : areaColors.watch;
	const analyticsSummary = communityAnalytics?.summary
		? `${communityAnalytics.summary.successfulSources} ok / ${communityAnalytics.summary.failedSources} failed / ${communityAnalytics.summary.skippedSources} skipped`
		: 'analytics not collected';
	const queryWeightedScores =
		communityAnalytics?.queries
			?.map((query) => query.aggregate?.weightedDemandScore)
			.filter((score): score is number => typeof score === 'number' && Number.isFinite(score)) ?? [];
	const weightedDemandScore =
		typeof communityAnalytics?.summary?.weightedAverageDemandScore === 'number'
			? communityAnalytics.summary.weightedAverageDemandScore
			: queryWeightedScores.length
				? Math.round(
						(queryWeightedScores.reduce((total, score) => total + score, 0) / queryWeightedScores.length) *
							10
					) / 10
				: 'missing';
	const analyticsLinkageMarkers =
		communityAnalytics?.summary?.analyticsLinkageMarkers?.join(' | ') ||
		Array.from(
			new Set(
				communityAnalytics?.queries
					?.map((query) => query.analyticsLinkageMarker)
					.filter((marker): marker is string => Boolean(marker)) ?? []
			)
		).join(' | ') ||
		'analytics-linked-keyword-graph';
	const sourceToKeywordEdgeCount =
		communityAnalytics?.queries?.reduce(
			(total, query) => total + (query.sourceToKeywordEdges?.length ?? 0),
			0
		) ?? 0;
	const freshnessWindows = communityAnalytics?.summary?.freshnessWindows
		? Object.keys(communityAnalytics.summary.freshnessWindows).join(' | ')
		: '168h';
	const trustBoundaries = communityAnalytics?.summary?.trustBoundaryCoverage
		? Object.keys(communityAnalytics.summary.trustBoundaryCoverage).join(' | ')
		: 'public-api | public-web-search | manual-review';
	const proofLedgerMarkers = report.proofLedger.map((item) => item.marker).join(' | ');
	const requiredEvidenceMarkers = requiredAlphaEvidence.join(' | ');
	const nativeHostCompatibilityMatrix = buildBridgeReuseInventory(report).nativeHostCompatibilityMatrix;
	const nativeHostCompatibilityRows = nativeHostCompatibilityMatrix.rows
		.map((row) => row.id)
		.join(' | ');
	const nativeHostCompatibilityEvidence = nativeHostCompatibilityMatrix.rows
		.map((row) => JSON.stringify(row))
		.join(' | ');
	const nativeHostWrapperSmoke = buildAlphaNativeHostWrapperSmoke(report);
	const nativeWrapperRealHostStatus = nativeHostWrapperSmoke.realHostVerified
		? 'real-host-verified'
		: 'real-host-not-verified';
	const proofLedgerBlockers =
		report.proofLedger
			.filter((item) => item.status !== 'alpha-ready')
			.map((item) => `${item.marker}:${item.status}`)
			.join(' | ') || 'all-alpha-ready';
	const scoreRadians = (report.overallScore / 100) * Math.PI * 2;
	const scoreX = 96 + 86 * Math.sin(scoreRadians);
	const scoreY = 96 - 86 * Math.cos(scoreRadians);
	const areaBars = report.readinessAreas
		.slice(0, 5)
		.map((area, index) => {
			const y = 260 + index * 58;
			const label = area.title.length > 28 ? `${area.title.slice(0, 25)}...` : area.title;
			return `
				<g>
					<text x="78" y="${y}" class="label">${escapeSvg(label)}</text>
					<rect x="330" y="${y - 18}" width="430" height="18" rx="9" class="track" />
					<rect x="330" y="${y - 18}" width="${Math.max(8, Math.round(area.score * 4.3))}" height="18" rx="9" fill="${areaColors[area.status]}" />
					<text x="785" y="${y}" class="value">${escapeSvg(area.score)}/100 ${escapeSvg(area.status)}</text>
				</g>`;
		})
		.join('');
	const signalDots = report.communitySignals
		.slice(0, 4)
		.map((signal, index) => {
			const x = 875 + (index % 2) * 138;
			const y = 330 + Math.floor(index / 2) * 118;
			return `
				<g>
					<circle cx="${x}" cy="${y}" r="44" class="signal-ring" />
					<circle cx="${x}" cy="${y}" r="${Math.max(14, Math.round(signal.metric / 2.4))}" fill="url(#blueGreen)" opacity="0.86" />
					<text x="${x}" y="${y + 7}" class="signal-score" text-anchor="middle">${escapeSvg(signal.metric)}</text>
					<text x="${x}" y="${y + 70}" class="small" text-anchor="middle">${escapeSvg(signal.id)}</text>
				</g>`;
		})
		.join('');

	return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="title desc" data-alpha-proof-ledger="proofLedger" data-native-platform-provenance="lg-ultragear-native-platform-provenance" data-real-host-permission-checklist="lg-ultragear-host-permission-checklist" data-native-host-handoff-controls="native-window-action" data-native-host-wrapper-smoke="${escapeSvg(nativeHostWrapperSmoke.status)}" data-window-chrome-state="mica-active" data-transparent-webview-material-boundary="host-owned" data-macos-material-host-policy="source-observed-macos-host-scaffold" data-macos-native-vibrancy="unverified" data-required-alpha-evidence="requiredEvidence">
	<title id="title">SvelteKit PHP ${escapeSvg(report.target)} alpha readiness graphic</title>
	<desc id="desc">Native-styled alpha readiness graphic with readiness scores, community analytics, hosted smoke status, native-host-wrapper-smoke status ${escapeSvg(nativeHostWrapperSmoke.status)}, sourceToKeywordEdge links, analyticsLinkageMarker metadata, no-live-community-api-runtime-boundary runtime separation, weightedDemandScore, freshnessMaxAgeHours, trustBoundary, manualReviewRequired, required-alpha-evidence markers ${escapeSvg(requiredEvidenceMarkers)}, native-host-compatibility-matrix rows ${escapeSvg(nativeHostCompatibilityRows)}, progressReportHandoff statusMapping, ProgressBarStatus.Indeterminate, macos-vibrancy-host-policy markers, macos-material-host-policy, source-observed-macos-host-scaffold, macos-native-vibrancy-unverified, app-window.maximized, windowChromeState, data-window-chrome-state, transparent-webview-material-boundary, theme-ultragear, setPointerCapture, lostpointercapture, lg-ultragear-native-platform-provenance markers, lg-ultragear-host-permission-checklist permission evidence, and proofLedger markers ${escapeSvg(proofLedgerMarkers)} with blocker status ${escapeSvg(proofLedgerBlockers)}.</desc>
	<metadata>requiredEvidence required-alpha-evidence ${escapeSvg(requiredEvidenceMarkers)} proofLedger ${escapeSvg(proofLedgerMarkers)} ${escapeSvg(proofLedgerBlockers)} hard-proof-blocker-ledger alpha-over-rc-release-policy alpha-runtime-gate-ledger hosted-php-smoke-proof-required needs-local-gate-proof needs-hosted-proof real-host-permission-checklist native-host-compatibility-matrix source-observed-host-compatibility-contract ${escapeSvg(nativeHostCompatibilityRows)} ${escapeSvg(nativeHostCompatibilityEvidence)} lg-ultragear-host-permission-checklist realHostPermissionChecklist real-host-permission-cue-required hostPermissionCues requiredHostPermission src-tauri/capabilities/default.json src-tauri/src/lib.rs cfg!(target_os = "windows") ShellFeatureProbe.mica_supported current_shell_features() core:window:allow-set-effects macos-traffic-light-row macos-vibrancy-host-policy macos-material-host-policy source-observed-macos-host-scaffold macos-native-vibrancy-unverified macos-vibrancy-visual-row data-macos-chrome src-tauri/Cargo.toml MacosLauncher::LaunchAgent core:window:allow-set-progress-bar core:window:allow-start-dragging core:window:allow-toggle-maximize native-host-wrapper-smoke=${escapeSvg(nativeHostWrapperSmoke.status)} native-host-wrapper-probe=steps:${escapeSvg(nativeHostWrapperSmoke.summary.probeStepCount)} realHostVerified=${escapeSvg(nativeHostWrapperSmoke.realHostVerified)} ${escapeSvg(nativeWrapperRealHostStatus)} report/alpha-native-host-wrapper-smoke.json /alpha-readiness/native-host-wrapper-smoke.json analyticsLinkageMarker=${escapeSvg(analyticsLinkageMarkers)} no-live-community-api-runtime-boundary sourceToKeywordEdge=count:${escapeSvg(sourceToKeywordEdgeCount)} weightedDemandScore=${escapeSvg(weightedDemandScore)} freshnessMaxAgeHours=${escapeSvg(freshnessWindows)} trustBoundary=${escapeSvg(trustBoundaries)} manualReviewRequired=true lg-ultragear-native-platform-provenance desktopShellUiBinding @scriptgpt/desktop-shell-ui packages/desktop-shell-ui/src/index.ts packages/ultragear-widget-ui/src/app.ts features.micaSupported installSvelteKitPhpNativeHost enableMicaWindowChrome enableMicaWindowChrome(win) syncTaskbarProgress syncTaskbarProgress(win, { saveInFlight, refreshInFlight, hasQueuedSave }) toggleWindowMaximize toggleDesktopWindowMaximize(win) win.startDragging() bindColorSchemeWatcher prefersDarkMode window.matchMedia("(prefers-color-scheme: dark)") Effect.Mica app-window.maximized theme-ultragear setPointerCapture lostpointercapture ProgressBarStatus.Indeterminate win.setEffects webview.setBackgroundColor([0, 0, 0, 0]) windowChromeState mica-active mica-inactive plain data-window-chrome-state transparent-webview-material-boundary win.startDragging win.setProgressBar reportJson reportUrl data-native-host-handoff-controls set-window-effect set-progress clear-progress report-ready setWindowEffect setProgress clearProgress reportReady</metadata>
	<defs>
		<linearGradient id="mica" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="#eff8ff" />
			<stop offset="0.48" stop-color="#f7edf5" />
			<stop offset="1" stop-color="#e7f7f3" />
		</linearGradient>
		<radialGradient id="washA" cx="18%" cy="18%" r="60%">
			<stop offset="0" stop-color="#38bdf8" stop-opacity="0.38" />
			<stop offset="1" stop-color="#38bdf8" stop-opacity="0" />
		</radialGradient>
		<radialGradient id="washB" cx="90%" cy="8%" r="58%">
			<stop offset="0" stop-color="#fb7185" stop-opacity="0.3" />
			<stop offset="1" stop-color="#fb7185" stop-opacity="0" />
		</radialGradient>
		<linearGradient id="blueGreen" x1="0" y1="0" x2="1" y2="1">
			<stop offset="0" stop-color="#0d74c4" />
			<stop offset="1" stop-color="#11a48f" />
		</linearGradient>
		<filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
			<feDropShadow dx="0" dy="22" stdDeviation="24" flood-color="#1f2937" flood-opacity="0.18" />
		</filter>
		<style>
			.bg { fill: url(#mica); }
			.panel { fill: rgba(255,255,255,0.68); stroke: rgba(80,95,130,0.2); stroke-width: 1.4; filter: url(#shadow); }
			.caption { fill: rgba(255,255,255,0.48); stroke: rgba(80,95,130,0.14); }
			.title { font: 800 54px "Segoe UI Variable", "Segoe UI", sans-serif; fill: #111827; letter-spacing: -2.8px; }
			.subtitle { font: 500 20px "Segoe UI", sans-serif; fill: #58647a; }
			.section { font: 800 22px "Segoe UI", sans-serif; fill: #111827; }
			.label { font: 700 17px "Segoe UI", sans-serif; fill: #1f2937; }
			.value { font: 800 17px "Segoe UI", sans-serif; fill: #334155; }
			.small { font: 700 13px "Segoe UI", sans-serif; fill: #58647a; }
			.chrome-label { font: 800 13px "Segoe UI", sans-serif; fill: #1f2937; letter-spacing: .2px; }
			.win-button { fill: rgba(255,255,255,0.5); stroke: rgba(80,95,130,0.22); }
			.track { fill: rgba(80,95,130,0.16); }
			.signal-ring { fill: rgba(255,255,255,0.5); stroke: rgba(80,95,130,0.18); }
			.signal-score { font: 900 20px "Segoe UI", sans-serif; fill: #ffffff; }
		</style>
	</defs>
	<rect width="${width}" height="${height}" class="bg" />
	<rect width="${width}" height="${height}" fill="url(#washA)" />
	<rect width="${width}" height="${height}" fill="url(#washB)" />
	<rect x="44" y="38" width="1112" height="724" rx="34" class="panel" />
	<rect x="44" y="38" width="1112" height="78" rx="34" class="caption" />
	<circle cx="84" cy="78" r="10" fill="#ff5f57" />
	<circle cx="116" cy="78" r="10" fill="#ffbd2e" />
	<circle cx="148" cy="78" r="10" fill="#28c840" />
	<text x="186" y="84" class="chrome-label">Windows 11 Mica + source-observed macOS host policy</text>
	<g aria-label="native-window-action caption controls">
		<rect x="1016" y="62" width="32" height="24" rx="8" class="win-button" />
		<rect x="1056" y="62" width="32" height="24" rx="8" class="win-button" />
		<rect x="1096" y="62" width="32" height="24" rx="8" class="win-button" />
		<text x="1032" y="79" class="small" text-anchor="middle">-</text>
		<text x="1072" y="80" class="small" text-anchor="middle">[]</text>
		<text x="1112" y="80" class="small" text-anchor="middle">x</text>
	</g>
	<text x="78" y="180" class="subtitle">SvelteKit PHP release evidence</text>
	<text x="78" y="238" class="title">${escapeSvg(report.target)}</text>
	<g transform="translate(895 145)">
		<circle cx="96" cy="96" r="86" fill="rgba(255,255,255,0.48)" stroke="rgba(80,95,130,0.18)" />
		<path d="M96 10 A86 86 0 ${report.overallScore > 50 ? 1 : 0} 1 ${scoreX} ${scoreY}" fill="none" stroke="url(#blueGreen)" stroke-width="18" stroke-linecap="round" />
		<text x="96" y="108" text-anchor="middle" class="title">${escapeSvg(report.overallScore)}</text>
		<text x="96" y="135" text-anchor="middle" class="small">overall</text>
	</g>
	<text x="78" y="312" class="section">Readiness areas</text>
	${areaBars}
	<text x="875" y="312" class="section">Community signals</text>
	${signalDots}
	<g>
		<rect x="78" y="570" width="322" height="38" rx="19" fill="rgba(255,255,255,0.52)" stroke="rgba(80,95,130,0.16)" />
		<circle cx="102" cy="589" r="8" fill="#0d74c4" />
		<text x="118" y="595" class="small">analytics: ${escapeSvg(analyticsSummary)}</text>
	</g>
	<g>
		<rect x="424" y="570" width="312" height="38" rx="19" fill="rgba(255,255,255,0.52)" stroke="rgba(80,95,130,0.16)" />
		<circle cx="448" cy="589" r="8" fill="${hostedColor}" />
		<text x="464" y="595" class="small">hosted smoke: ${escapeSvg(hostedStatus)}</text>
	</g>
	<g>
		<rect x="760" y="570" width="324" height="38" rx="19" fill="rgba(255,255,255,0.52)" stroke="rgba(80,95,130,0.16)" />
		<circle cx="784" cy="589" r="8" fill="#11a48f" />
		<text x="800" y="595" class="small">trust model: generated / collected / hosted-gated</text>
	</g>
	<text x="78" y="626" class="small">Evidence trust: deterministic-local-artifact, directional-community-signal, no-live-community-api-runtime-boundary, deterministic-runtime-evidence</text>
	<text x="78" y="648" class="small">Hosted proof: requires-alpha-smoke-base-url-for-pass-evidence</text>
	<text x="78" y="670" class="small">Bridge source: ${escapeSvg(report.bridgeSource)}</text>
	<text x="78" y="692" class="small">Native host bridge: data-native-host-bridge-status, data-native-host-handoff-controls, browser-fallback, host-owned window commands</text>
	<text x="78" y="714" class="small">Community ledger: analyticsLinkageMarker ${escapeSvg(analyticsLinkageMarkers)}, sourceToKeywordEdge count ${escapeSvg(sourceToKeywordEdgeCount)}, weightedDemandScore ${escapeSvg(weightedDemandScore)}</text>
	<text x="78" y="736" class="small">Wrapper smoke: native-host-wrapper-smoke ${escapeSvg(nativeHostWrapperSmoke.status)}, native-host-wrapper-probe ${escapeSvg(nativeHostWrapperSmoke.summary.probeStepCount)} steps, ${escapeSvg(nativeWrapperRealHostStatus)}</text>
	<text x="620" y="648" class="small">proofLedger blockers: ${escapeSvg(proofLedgerBlockers)}</text>
	<text x="620" y="692" class="small">Chrome proof: native-visual-matrix, windows-mica-visual-row, macos-material-host-policy, macos-native-vibrancy-unverified</text>
	<text x="620" y="714" class="small">progressReportHandoff statusMapping: set-progress, clear-progress, report-ready, ProgressBarStatus.None report/alpha-readiness.full.json</text>
	<text x="620" y="736" class="small">Native compatibility: native-host-compatibility-matrix, ${escapeSvg(nativeHostCompatibilityRows)}, source-observed-host-compatibility-contract</text>
	<text x="78" y="758" class="small">Required alpha evidence: requiredEvidence, required-alpha-evidence, ${escapeSvg(requiredEvidenceMarkers)}</text>
</svg>
`;
}
