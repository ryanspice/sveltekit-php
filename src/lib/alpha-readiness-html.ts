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
	failure?: string;
	checks?: unknown[];
} | null;

type ReportGraphicLinks = {
	readinessGraphicHref?: string;
	communitySourceMapHref?: string;
	runtimeCommunitySourceMapHref?: string;
};

function escapeHtml(value: unknown) {
	return String(value)
		.replaceAll('&', '&amp;')
		.replaceAll('<', '&lt;')
		.replaceAll('>', '&gt;')
		.replaceAll('"', '&quot;')
		.replaceAll("'", '&#39;');
}

export function renderAlphaReadinessHtml(
	report: AlphaReadinessReport,
	communityAnalytics: CommunityAnalyticsArtifact = null,
	remoteSmoke: RemoteSmokeArtifact = null,
	graphicLinks: ReportGraphicLinks = {}
) {
	const readinessGraphicHref = graphicLinks.readinessGraphicHref ?? '/alpha-readiness/report.svg';
	const communitySourceMapHref =
		graphicLinks.communitySourceMapHref ?? '/alpha-readiness/community-source-map.svg';
	const runtimeCommunitySourceMapHref =
		graphicLinks.runtimeCommunitySourceMapHref ?? '/alpha-readiness/community-source-map.svg';
	const bridgeReuseInventory = buildBridgeReuseInventory(report);
	const nativeHostContract = buildAlphaNativeHostContract(report);
	const communityResearchPack = buildCommunityResearchPack(report);
	const keywordSearchGraph = communityResearchPack.keywordSearchGraph;
	const progressReportHandoff = bridgeReuseInventory.progressReportHandoff;
	const nativeVisualMatrix = bridgeReuseInventory.nativeVisualMatrix;
	const nativePlatformProvenance = bridgeReuseInventory.nativePlatformProvenance;
	const desktopShellUiBinding = nativeHostContract.desktopShellUiBinding;
	const requiredEvidenceCards = requiredAlphaEvidence
		.map(
			(marker) => `
				<article class="card" data-required-alpha-evidence>
					<div class="row"><span class="pill">required-alpha-evidence</span><strong><code>${escapeHtml(marker)}</code></strong></div>
					<p>This <code>requiredEvidence</code> marker must remain synchronized across package metadata, package contract, release manifest, evidence index, hosted smoke checklist, remote smoke, and report handoffs.</p>
				</article>`
		)
		.join('');
	const ultraGearParityCards = bridgeReuseInventory.ultraGearParityContract.parityRows
		.map(
			(row) => `
				<article class="card" data-ultragear-source-parity>
					<div class="row"><span class="pill">ultraGearParityContract</span><strong>${escapeHtml(row.sourceFile)}</strong></div>
					<p><strong>Source cues:</strong> ${row.sourceCues.map((cue) => `<code>${escapeHtml(cue)}</code>`).join(' ')}</p>
					<p><strong>Adapter evidence:</strong> ${row.localEvidence.map((cue) => `<code>${escapeHtml(cue)}</code>`).join(' ')}</p>
			<p class="gap">${escapeHtml(row.boundary)}</p>
				</article>`
		)
		.join('');
	const nativePlatformProvenanceCards = `
		<article class="card" data-native-platform-provenance>
			<div class="row"><span class="pill">${escapeHtml(nativePlatformProvenance.marker)}</span><strong>UltraGear native platform source cues</strong></div>
			<p><strong>Source root:</strong> <code>${escapeHtml(nativePlatformProvenance.sourceRoot)}</code></p>
			<p><strong>Windows Mica:</strong> ${nativePlatformProvenance.windowsMicaCues.map((cue) => `<code>${escapeHtml(cue)}</code>`).join(' ')}</p>
			<p><strong>macOS chrome:</strong> ${nativePlatformProvenance.macosChromeCues.map((cue) => `<code>${escapeHtml(cue)}</code>`).join(' ')}</p>
			<p><strong>Window actions:</strong> ${nativePlatformProvenance.windowActionCues.map((cue) => `<code>${escapeHtml(cue)}</code>`).join(' ')}</p>
			<p><strong>Progress/report:</strong> ${nativePlatformProvenance.progressReportCues.map((cue) => `<code>${escapeHtml(cue)}</code>`).join(' ')}</p>
			<p class="gap">This keeps Windows 11 Mica, macOS-native chrome, host-owned window controls, and structured report handoff tied to concrete LG UltraGear source files instead of generic style claims.</p>
		</article>
		${nativePlatformProvenance.sourceFiles
			.map(
				(file) => `
					<article class="card">
						<div class="row"><span class="pill">source file</span><strong><code>${escapeHtml(file)}</code></strong></div>
						<p>Adapter evidence: ${nativePlatformProvenance.adapterEvidence.map((item) => `<code>${escapeHtml(item)}</code>`).join(' ')}</p>
						<p class="gap"><code>${escapeHtml(nativePlatformProvenance.marker)}</code> is required by hosted smoke, release-prep verification, and release manifest evidence.</p>
					</article>`
			)
			.join('')}`;
	const desktopShellUiBindingCards = `
		<article class="card" data-desktop-shell-ui-binding>
			<div class="row"><span class="pill">${escapeHtml(desktopShellUiBinding.marker)}</span><strong>${escapeHtml(desktopShellUiBinding.packageName)}</strong></div>
			<p><strong>Source package:</strong> <code>${escapeHtml(desktopShellUiBinding.sourcePackage)}</code></p>
			<p><strong>Upstream widget source:</strong> <code>${escapeHtml(desktopShellUiBinding.upstreamWidgetSource)}</code></p>
			<p><strong>Installer:</strong> <code>${escapeHtml(desktopShellUiBinding.controllerBinding.installer)}</code></p>
			<p><strong>Host global:</strong> <code>${escapeHtml(desktopShellUiBinding.controllerBinding.global)}</code></p>
			<p><strong>Reused helpers:</strong> ${desktopShellUiBinding.requiredImports.map((helper) => `<code>${escapeHtml(helper)}</code>`).join(' ')}</p>
			<p class="gap">The optional wrapper binds <code>native-window-action</code> events to UltraGear helper-package implementations while the PHP adapter runtime stays browser-safe.</p>
		</article>
		${desktopShellUiBinding.controllerBinding.handlers
			.map(
				(handler) => `
					<article class="card">
						<div class="row"><span class="pill">${escapeHtml(handler.action)}</span><strong>${escapeHtml(handler.handler)}</strong></div>
						<p><code>${escapeHtml(handler.ultraGearImplementation)}</code></p>
						<p><strong>Bridge mapping:</strong> <code>${escapeHtml(handler.nativeHostBridgeMapping)}</code></p>
						<p><strong>Detail fields:</strong> ${handler.detailFields.map((field) => `<code>${escapeHtml(field)}</code>`).join(' ')}</p>
						<p class="gap">${escapeHtml(handler.notes)}</p>
					</article>`
			)
			.join('')}`;
	const keywordGraphCards = `
		<article class="card" data-community-keyword-search-graph>
			<div class="row"><span class="pill">keywordSearchGraph</span><strong>${escapeHtml(keywordSearchGraph.nodes.length)} keyword nodes</strong></div>
			<p><code>source-to-keyword-edge</code> links: ${escapeHtml(keywordSearchGraph.edges.length)}</p>
			<p><code>community-analytics-freshness-contract</code>: refresh public-source counts within ${escapeHtml(communityResearchPack.analyticsFreshnessContract.maxAgeHours)} hours before alpha release review.</p>
			<p><code>supported-api-lanes</code>: ${escapeHtml(communityResearchPack.summary.supportedSourceCount)} / <code>manual-research-lanes</code>: ${escapeHtml(communityResearchPack.summary.manualSourceCount)}</p>
			<p><code>analytics-linked-keyword-graph</code>: <code>curated-signal-score</code> + <code>collected-demand-score</code> as <code>directional-community-signal</code></p>
			<p class="gap">${keywordSearchGraph.nodes
				.map((node) => `<code>${escapeHtml(node.id)}:${escapeHtml(node.sourceHosts.slice(0, 3).join('|'))}</code>`)
				.join(' ')}</p>
		</article>
		${keywordSearchGraph.edges
			.slice(0, 4)
			.map(
				(edge) => `
					<article class="card">
						<div class="row"><span class="pill">${escapeHtml(edge.mode)}</span><strong>${escapeHtml(edge.from)} -> ${escapeHtml(edge.to)}</strong></div>
						<p>${escapeHtml(edge.sourceHost)} / ${escapeHtml(edge.evidenceKind)} / ${escapeHtml(edge.collectionRisk)}</p>
						<p class="gap"><code>analytics-linked-keyword-graph</code> keeps this edge tied to curated and collected score handoffs.</p>
					</article>`
			)
			.join('')}`;
	const progressReportHandoffCards = `
		<article class="card" data-progress-report-handoff>
			<div class="row"><span class="pill">progressReportHandoff</span><strong>host-owned progress</strong></div>
			<p><strong>UltraGear cues:</strong> ${progressReportHandoff.sourceCues.map((cue) => `<code>${escapeHtml(cue)}</code>`).join(' ')}</p>
			<p><strong>Adapter evidence:</strong> ${progressReportHandoff.adapterEvidence.map((item) => `<code>${escapeHtml(item)}</code>`).join(' ')}</p>
			<p><strong>statusMapping:</strong> ${progressReportHandoff.statusMapping
				.map(
					(status) =>
						`<code>${escapeHtml(status.adapterState)}</code> ${escapeHtml(status.hostCue)} ${escapeHtml(status.reportCue)}`
				)
				.join(' ')}</p>
			<p class="gap">${escapeHtml(progressReportHandoff.proofUse)}</p>
		</article>`;
	const nativeVisualMatrixCards = `
		<article class="card" data-native-visual-matrix>
			<div class="row"><span class="pill">native-visual-matrix</span><strong>host-owned chrome evidence</strong></div>
			<p><strong>Rows:</strong> ${nativeVisualMatrix.rows.map((row) => `<code>${escapeHtml(row)}</code>`).join(' ')}</p>
			<p><strong>UltraGear cues:</strong> ${nativeVisualMatrix.sourceCues.map((cue) => `<code>${escapeHtml(cue)}</code>`).join(' ')}</p>
			<p class="gap">${escapeHtml(nativeVisualMatrix.proofUse)}</p>
		</article>
		${nativeVisualMatrix.rows
			.map(
				(row) => `
					<article class="card">
						<div class="row"><span class="pill">native visual row</span><strong><code>${escapeHtml(row)}</code></strong></div>
						<p>Mapped into the live alpha page, native-host contract, release manifest, evidence index, and hosted smoke checklist.</p>
						<p class="gap">Keeps Windows Mica, macOS traffic-light cadence, Windows caption controls, UltraGear theme tokens, and browser fallback claims reviewable as explicit evidence.</p>
					</article>`
			)
			.join('')}`;
	const communityCoverageCards = [
		{
			label: 'Providers',
			values: communityResearchPack.summary.providerCoverage,
			description: 'Public source families represented by the research pack.'
		},
		{
			label: 'Evidence kinds',
			values: communityResearchPack.summary.evidenceKindCoverage,
			description: 'What each source can credibly prove for alpha review.'
		},
		{
			label: 'Collection risk',
			values: communityResearchPack.summary.collectionRiskCoverage,
			description: 'Where automation is stable, rate-limited, or manual.'
		}
	]
		.map(
			(group) => `
				<article class="card">
					<div class="row"><span class="pill">${escapeHtml(group.label)}</span><strong>${escapeHtml(group.values.length)}</strong></div>
					<p>${escapeHtml(group.description)}</p>
					<p class="gap">${group.values.map((value) => `<code>${escapeHtml(value)}</code>`).join(' ')}</p>
				</article>`
		)
		.join('');
	const communityCollectionCards = communityResearchPack.collectionPlan
		.slice(0, 6)
		.map(
			(source) => `
				<article class="card">
					<div class="row"><span class="pill">${escapeHtml(source.mode)}</span><strong>${escapeHtml(source.provider)}</strong></div>
					<p>${escapeHtml(source.proofUse)}</p>
					<p class="gap">${escapeHtml(source.sourceHost)} / ${escapeHtml(source.evidenceKind)} / ${escapeHtml(source.collectionRisk)}</p>
				</article>`
		)
		.join('');
	const readinessCards = report.readinessAreas
		.map(
			(area) => `
				<article class="card">
					<div class="row">
						<span class="pill pill-${escapeHtml(area.status)}">${escapeHtml(area.status)}</span>
						<strong>${escapeHtml(area.score)}/100</strong>
					</div>
					<h3>${escapeHtml(area.title)}</h3>
					<p>${escapeHtml(area.description)}</p>
					<div class="meter" aria-label="${escapeHtml(area.title)} ${escapeHtml(area.score)} percent">
						<span style="width:${escapeHtml(area.score)}%"></span>
					</div>
					<ul>${area.evidence.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul>
					<p class="gap"><strong>Gap:</strong> ${escapeHtml(area.gap)}</p>
				</article>`
		)
		.join('');

	const signalCards = report.communitySignals
		.map(
			(signal) => `
				<article class="signal">
					<div class="dial" style="--score:${escapeHtml(signal.metric)}%"><span>${escapeHtml(signal.metric)}</span></div>
					<div>
						<h3>${escapeHtml(signal.keyword)}</h3>
						<p>${escapeHtml(signal.intent)}</p>
						<div class="links">
							${signal.communities
								.map(
									(community) =>
										`<a href="${escapeHtml(community.href)}">${escapeHtml(community.label)}</a>`
								)
								.join('')}
						</div>
					</div>
				</article>`
		)
		.join('');

	const analyticsCards = communityAnalytics
		? (communityAnalytics.queries ?? [])
				.map(
					(query) => `
				<article class="card">
					<div class="row">
						<span class="pill">${escapeHtml(query.aggregate?.demandScore ?? 0)}/100 demand</span>
						<strong>${escapeHtml(query.aggregate?.totalMentions ?? 0)} mentions</strong>
					</div>
					<h3>${escapeHtml(query.keyword)}</h3>
					<p>${escapeHtml(query.intent ?? '')}</p>
					<div class="meter" aria-label="${escapeHtml(query.keyword)} demand score">
						<span style="width:${escapeHtml(query.aggregate?.demandScore ?? 0)}%"></span>
					</div>
					<p class="gap">${escapeHtml(query.aggregate?.successfulSources ?? 0)} sources ok, ${escapeHtml(query.aggregate?.failedSources ?? 0)} failed, ${escapeHtml(query.aggregate?.skippedSources ?? 0)} skipped.</p>
				</article>`
				)
				.join('')
		: `<article class="card"><h3>No collected analytics embedded</h3><p>Run <code>bun run alpha:analytics</code> before <code>bun run alpha:report</code> to embed public community-source counts.</p></article>`;

	const graphicsCards = `
		<article class="card">
			<div class="row">
				<span class="pill">release graphic</span>
				<strong>SVG</strong>
			</div>
			<h3>Readiness release card</h3>
			<p>Portable native-styled summary graphic for PRs, release notes, and handoff bundles.</p>
			<p class="gap"><a href="${escapeHtml(readinessGraphicHref)}">Open readiness SVG</a></p>
		</article>
		<article class="card">
			<div class="row">
				<span class="pill">source map</span>
				<strong>SVG</strong>
			</div>
			<h3>Community source map</h3>
			<p>Visualizes supported-json-api and manual-research-link lanes across open-source community keyword sources.</p>
			<p class="gap"><a href="${escapeHtml(communitySourceMapHref)}">Open bundled community-source-map.svg</a></p>
			<p class="gap"><a href="${escapeHtml(runtimeCommunitySourceMapHref)}">Open runtime /alpha-readiness/community-source-map.svg</a></p>
		</article>`;

	const remoteSmokeCard = remoteSmoke
		? `<article class="card">
				<div class="row">
					<span class="pill pill-${escapeHtml(remoteSmoke.status === 'passed' ? 'ready' : remoteSmoke.status === 'failed' ? 'blocked' : 'watch')}">${escapeHtml(remoteSmoke.status ?? 'unknown')}</span>
					<strong>${escapeHtml((remoteSmoke.checks ?? []).length)} checks</strong>
				</div>
				<h3>Hosted deployment smoke</h3>
				<p>${remoteSmoke.baseUrl ? `Target ${escapeHtml(remoteSmoke.baseUrl)} was checked.` : 'No hosted target was checked.'}</p>
				<p class="gap">${escapeHtml(remoteSmoke.reason ?? remoteSmoke.failure ?? `Checked ${remoteSmoke.checkedAt ?? 'unknown'}`)}</p>
			</article>`
		: `<article class="card"><h3>No hosted smoke embedded</h3><p>Set <code>ALPHA_SMOKE_BASE_URL</code> and run <code>bun run alpha:remote:smoke</code> after deployment to embed real-host evidence.</p></article>`;

	const trustCards = `
		<article class="card">
			<div class="row"><span class="pill">deterministic-local-artifact</span><strong>generated</strong></div>
			<h3>Source-generated reports</h3>
			<p>HTML, Markdown, SVG, CSV, manifest, gate, package, native-host, and evidence-index files are generated from source-controlled alpha modules.</p>
			<p class="gap">Refresh with <code>bun run alpha:report:full</code> before review.</p>
		</article>
		<article class="card">
			<div class="row"><span class="pill">directional-community-signal</span><strong>public APIs</strong></div>
			<h3>Community analytics</h3>
			<p>GitHub, npm, Packagist, Stack Overflow, and Reddit counts are directional public-source evidence, not product telemetry.</p>
			<p class="gap">Collect with <code>bun run alpha:analytics</code> when fresh counts are needed.</p>
		</article>
		<article class="card">
			<div class="row"><span class="pill">deterministic-runtime-evidence</span><strong>runtime</strong></div>
			<h3>Hosted endpoints</h3>
			<p>Runtime evidence endpoints serve deterministic report data and do not call live community APIs.</p>
			<p class="gap">Use hosted smoke to prove deployment, content types, and safety probes.</p>
		</article>
		<article class="card">
			<div class="row"><span class="pill">requires-alpha-smoke-base-url-for-pass-evidence</span><strong>hosted</strong></div>
			<h3>Real PHP host proof</h3>
			<p>Hosted smoke only counts as pass evidence after <code>ALPHA_SMOKE_BASE_URL</code> targets a real deployed PHP host.</p>
			<p class="gap">Run <code>bun run alpha:gate:hosted</code> for final alpha proof.</p>
		</article>`;
	const proofLedgerCards = report.proofLedger
		.map(
			(item) => `
				<article class="card">
					<div class="row"><span class="pill">${escapeHtml(item.status)}</span><strong><code>${escapeHtml(item.marker)}</code></strong></div>
					<h3>${escapeHtml(item.id)}</h3>
					<p>${escapeHtml(item.proves)}</p>
					<p>${item.evidence.map((evidence) => `<code>${escapeHtml(evidence)}</code>`).join(' ')}</p>
					<p class="gap"><strong>Stable blocker:</strong> ${escapeHtml(item.stableBlocker)}</p>
				</article>`
		)
		.join('');

	const nativeHostBridgeCards = `
		<article class="card">
			<div class="row"><span class="pill">data-native-host-bridge-status</span><strong>live seam</strong></div>
			<h3>Native host bridge status</h3>
			<p>The live alpha page exposes optional native host registration and deterministic browser fallback state for reviewers.</p>
			<p class="gap"><code>window.__SVELTEKIT_PHP_NATIVE_HOST__</code> / <code>window.__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__</code></p>
		</article>
		<article class="card">
			<div class="row"><span class="pill">data-native-host-handoff-controls</span><strong>live handoff</strong></div>
			<h3>Mica, progress, and report events</h3>
			<p>The live alpha page can emit <code>set-window-effect</code>, <code>set-progress</code>, <code>clear-progress</code>, and <code>report-ready</code> through the browser-safe <code>native-window-action</code> seam.</p>
			<p class="gap"><code>setWindowEffect</code> / <code>setProgress</code> / <code>clearProgress</code> / <code>reportReady</code> / <code>/alpha-readiness/native-host-guide.md</code></p>
		</article>
		<article class="card">
			<div class="row"><span class="pill">browser-fallback</span><strong>safe default</strong></div>
			<h3>Host-owned native commands</h3>
			<p>Windows Mica, macOS traffic-light behavior, startDragging, and toggleMaximize remain host-owned instead of adapter runtime calls.</p>
			<p class="gap">The PHP/browser demo stays deployable while preserving native wrapper seams.</p>
		</article>`;

	return `<!doctype html>
<html lang="en">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>SvelteKit PHP ${escapeHtml(report.target)} readiness report</title>
		<style>
			:root {
				color-scheme: light dark;
				--bg: #edf4ff;
				--panel: rgba(255, 255, 255, 0.62);
				--text: #111827;
				--muted: #58647a;
				--line: rgba(79, 93, 128, 0.16);
				--accent: #0d74c4;
				--accent-2: #11a48f;
			}
			body {
				margin: 0;
				background:
					radial-gradient(circle at 14% 12%, rgba(0, 177, 255, 0.22), transparent 28rem),
					radial-gradient(circle at 86% 16%, rgba(255, 45, 122, 0.18), transparent 26rem),
					linear-gradient(135deg, var(--bg), #f3e9f1);
				color: var(--text);
				font: 15px/1.55 "Segoe UI Variable", "Segoe UI", -apple-system, BlinkMacSystemFont, sans-serif;
			}
			main { max-width: 1180px; margin: 0 auto; padding: clamp(20px, 4vw, 48px); }
			.shell {
				border: 1px solid var(--line);
				border-radius: 28px;
				background: var(--panel);
				box-shadow: 0 24px 70px rgba(33, 42, 70, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.72);
				backdrop-filter: blur(28px) saturate(136%);
				overflow: hidden;
			}
			header {
				display: grid;
				grid-template-columns: auto 1fr auto;
				gap: 16px;
				align-items: center;
				padding: 18px 22px;
				border-bottom: 1px solid var(--line);
			}
			.lights { display: flex; gap: 8px; }
			.lights span { width: 12px; height: 12px; border-radius: 999px; }
			.lights span:nth-child(1) { background: #ff5f57; }
			.lights span:nth-child(2) { background: #ffbd2e; }
			.lights span:nth-child(3) { background: #28c840; }
			h1, h2, h3, p { margin-top: 0; }
			h1 {
				margin-bottom: 0;
				font-size: clamp(28px, 5vw, 58px);
				line-height: 0.95;
				letter-spacing: -0.065em;
			}
			.hero, .grid, .signals { display: grid; gap: 16px; }
			.hero { grid-template-columns: minmax(0, 1fr) 220px; padding: 24px; }
			.score {
				display: grid;
				place-items: center;
				border: 1px solid var(--line);
				border-radius: 24px;
				background: rgba(255, 255, 255, 0.36);
				text-align: center;
			}
			.ring, .dial {
				display: grid;
				place-items: center;
				border-radius: 999px;
				background: conic-gradient(var(--accent) var(--score), rgba(79, 93, 128, 0.14) 0);
			}
			.ring {
				width: 150px;
				aspect-ratio: 1;
				box-shadow: inset 0 0 0 18px rgba(255, 255, 255, 0.7);
				font-size: 36px;
				font-weight: 850;
			}
			section { padding: 0 24px 24px; }
			.grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
			.card, .signal {
				border: 1px solid var(--line);
				border-radius: 22px;
				padding: 18px;
				background: rgba(255, 255, 255, 0.44);
			}
			.row, .links { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
			.row { justify-content: space-between; }
			.pill, .links a {
				border: 1px solid var(--line);
				border-radius: 999px;
				padding: 6px 10px;
				background: rgba(255, 255, 255, 0.42);
				color: var(--accent);
				font-size: 12px;
				font-weight: 800;
				text-decoration: none;
			}
			.pill-ready { color: #0c704e; }
			.pill-watch { color: #8a4d00; }
			.pill-blocked { color: #a5122e; }
			.meter { height: 10px; border-radius: 999px; overflow: hidden; background: rgba(79, 93, 128, 0.14); }
			.meter span { display: block; height: 100%; border-radius: inherit; background: linear-gradient(90deg, var(--accent), var(--accent-2)); }
			.signal { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: 16px; }
			.dial { width: 54px; aspect-ratio: 1; box-shadow: inset 0 0 0 10px rgba(255, 255, 255, 0.68); font-weight: 850; }
			.gap, .muted { color: var(--muted); }
			code {
				border: 1px solid var(--line);
				border-radius: 8px;
				padding: 2px 5px;
				background: rgba(255, 255, 255, 0.36);
				color: var(--accent);
				font-weight: 800;
			}
			@media (prefers-color-scheme: dark) {
				:root {
					--bg: #101827;
					--panel: rgba(15, 23, 42, 0.62);
					--text: #f8fafc;
					--muted: #b8c3d8;
					--line: rgba(255, 255, 255, 0.09);
				}
				.card, .signal, .score { background: rgba(255, 255, 255, 0.045); }
			}
			@media (max-width: 760px) { header, .hero, .grid { grid-template-columns: 1fr; } }
		</style>
	</head>
	<body>
		<main>
			<div class="shell">
				<header>
					<div class="lights" aria-hidden="true"><span></span><span></span><span></span></div>
					<div>
						<p class="muted">Generated alpha readiness export</p>
						<h1>${escapeHtml(report.target)}</h1>
					</div>
					<strong>${escapeHtml(report.issued)}</strong>
				</header>
				<div class="hero">
					<div>
						<h2>Native-styled release report</h2>
						<p>This export reuses the same report model as the SvelteKit route and JSON endpoint. Community analytics are explicit research links, not fabricated live telemetry.</p>
						<p class="muted">Bridge source: ${escapeHtml(report.bridgeSource)}</p>
						<p><code>${escapeHtml(report.releasePolicy.marker)}</code> channel <code>${escapeHtml(report.releasePolicy.channel)}</code>, track <code>${escapeHtml(report.releasePolicy.track)}</code>, rank <code>${escapeHtml(report.releasePolicy.rank)}</code>.</p>
					</div>
					<div class="score">
						<div class="ring" style="--score:${escapeHtml(report.overallScore)}%">${escapeHtml(report.overallScore)}</div>
						<p>${escapeHtml(report.summary.ready)} ready, ${escapeHtml(report.summary.watch)} watch, ${escapeHtml(report.summary.blocked)} blocked</p>
					</div>
				</div>
				<section>
					<h2>Release policy</h2>
					<div class="grid">
						<article class="card">
							<div class="row"><span class="pill">${escapeHtml(report.releasePolicy.marker)}</span><strong>${escapeHtml(report.releasePolicy.track)}</strong></div>
							<p>Channel <code>${escapeHtml(report.releasePolicy.channel)}</code>, rank <code>${escapeHtml(report.releasePolicy.rank)}</code>.</p>
							<p class="gap">${escapeHtml(report.releasePolicy.releaseRule)}</p>
						</article>
						<article class="card">
							<div class="row"><span class="pill">stable blocker</span><strong>not latest</strong></div>
							<p>Disallowed channels: ${report.releasePolicy.disallowedChannels.map((channel) => `<code>${escapeHtml(channel)}</code>`).join(' ')}</p>
							<p class="gap">${escapeHtml(report.releasePolicy.stablePromotionRule)}</p>
						</article>
					</div>
				</section>
				<section><h2>Required alpha evidence</h2><div class="grid">${requiredEvidenceCards}</div></section>
				<section><h2>Alpha proof ledger</h2><div class="grid">${proofLedgerCards}</div></section>
				<section><h2>Readiness areas</h2><div class="grid">${readinessCards}</div></section>
				<section><h2>Community keyword signals</h2><div class="signals">${signalCards}</div></section>
				<section><h2>Community evidence coverage ledger</h2><div class="grid">${communityCoverageCards}</div></section>
				<section><h2>UltraGear source parity</h2><div class="grid">${ultraGearParityCards}</div></section>
				<section><h2>Reusable UltraGear desktop shell binding</h2><div class="grid">${desktopShellUiBindingCards}</div></section>
				<section><h2>UltraGear native platform provenance</h2><div class="grid">${nativePlatformProvenanceCards}</div></section>
				<section><h2>Native visual matrix</h2><div class="grid">${nativeVisualMatrixCards}</div></section>
				<section><h2>UltraGear progress and report handoff</h2><div class="grid">${progressReportHandoffCards}</div></section>
				<section><h2>Community keyword search graph</h2><div class="grid">${keywordGraphCards}</div></section>
				<section><h2>Open-source analytics sources reviewers can audit first</h2><div class="grid">${communityCollectionCards}</div></section>
				<section><h2>Report graphics</h2><div class="grid">${graphicsCards}</div></section>
				<section><h2>Evidence trust model</h2><div class="grid">${trustCards}</div></section>
				<section><h2>Native host bridge status</h2><div class="grid">${nativeHostBridgeCards}</div></section>
				<section>
					<h2>Collected community analytics</h2>
					<p class="muted">${
						communityAnalytics
							? `Collected ${escapeHtml(communityAnalytics.collectedAt ?? 'unknown')}. ${escapeHtml(communityAnalytics.summary?.successfulSources ?? 0)} sources ok, ${escapeHtml(communityAnalytics.summary?.failedSources ?? 0)} failed, ${escapeHtml(communityAnalytics.summary?.skippedSources ?? 0)} skipped.`
							: 'No live collection artifact was present when this report was exported.'
					}</p>
					<div class="grid">${analyticsCards}</div>
				</section>
				<section><h2>Hosted deployment smoke</h2><div class="grid">${remoteSmokeCard}</div></section>
			</div>
		</main>
	</body>
</html>
`;
}
