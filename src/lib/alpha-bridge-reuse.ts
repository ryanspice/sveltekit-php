import type { AlphaReadinessReport } from './alpha-readiness';

export function buildBridgeReuseInventory(report: AlphaReadinessReport) {
	return {
		target: report.target,
		issued: report.issued,
		bridgeSource: report.bridgeSource,
		patterns: report.bridgePatterns.map((pattern) => ({
			label: pattern.label,
			source: pattern.source,
			adopted: pattern.adopted,
			status: pattern.status
		})),
		implementationFiles: [
			{
				path: 'src/lib/components/native-shell/NativeWindowShell.svelte',
				role: 'Browser-safe Mica/acrylic shell and native report containment.'
			},
			{
				path: 'src/lib/components/native-shell/NativeTitlebar.svelte',
				role: 'macOS traffic-light cadence, Windows caption affordance, pointer-threshold drag gestures, blur-cancel safety, and future native-host event markers.'
			},
			{
				path: 'src/lib/components/native-shell/NativeHostBridgeStatus.svelte',
				role: 'Live alpha reviewer panel for native host controller availability and bounded fallback/native command history.'
			},
			{
				path: 'src/lib/native-shell/native-host-event-bridge.ts',
				role: 'Browser-safe host event bridge that maps native-window-action events to optional window.__SVELTEKIT_PHP_NATIVE_HOST__ drag, maximize, Mica effect, progress, clear-progress, and report-ready handlers with deterministic fallback history.'
			},
			{
				path: 'src/lib/alpha-readiness-html.ts',
				role: 'Standalone native-styled HTML report renderer.'
			},
			{
				path: 'src/lib/alpha-readiness-svg.ts',
				role: 'Portable release-card graphic renderer.'
			},
			{
				path: 'src/lib/alpha-community-source-map-svg.ts',
				role: 'Portable community-source map graphic renderer for supported API/manual research lanes.'
			},
			{
				path: 'src/routes/alpha-readiness/+page.svelte',
				role: 'Hosted command surface that exposes every alpha evidence artifact.'
			}
		],
		referencedBridgeImplementations: [
			'@scriptgpt/desktop-shell-ui',
			'packages/desktop-shell-ui/src/index.ts enableMicaWindowChrome, syncTaskbarProgress, toggleWindowMaximize, and bindColorSchemeWatcher',
			'src/app.ts applyWindowChrome and syncWindowProgress',
			'src/lib/bridge-ui/shell/BridgeShell.svelte',
			'src/lib/bridge-ui/shell/BridgeTopbar.svelte',
			'src/lib/bridge-ui/tokens/theme.css',
			'src/lib/bridge-ui/pages/ValidationView.svelte'
		],
		nativePlatformProvenance: {
			marker: 'lg-ultragear-native-platform-provenance',
			sourceRoot: 'B:/Dev/GPTLIGHTINGSTRENGTHTEST/lg-ultragear-bridge',
			sourceFiles: [
				'@scriptgpt/desktop-shell-ui',
				'packages/desktop-shell-ui/src/index.ts',
				'src/app.ts',
				'src/lib/bridge-ui/shell/BridgeShell.svelte',
				'src/lib/bridge-ui/shell/BridgeTopbar.svelte',
				'src/lib/bridge-ui/tokens/theme.css',
				'src/lib/bridge-ui/pages/ValidationView.svelte'
			],
			windowsMicaCues: [
				'enableMicaWindowChrome',
				'applyWindowChrome',
				'Effect.Mica',
				'win.setEffects',
				':root[data-window-effect="mica"]',
				'--window-bg-mica',
				'--window-wash-inactive'
			],
			macosChromeCues: [
				'macos-traffic-light-row',
				'data-native-platform',
				'data-window-control-group',
				'data-window-control',
				'.caption-button'
			],
			windowActionCues: [
				'toggleWindowMaximize',
				'DRAG_START_THRESHOLD_PX',
				'dragBlockSelector',
				'win.startDragging',
				'dispatch("start-dragging")',
				'dispatch("maximize")'
			],
			progressReportCues: [
				'syncTaskbarProgress',
				'TaskbarProgressState',
					'saveInFlight',
					'refreshInFlight',
					'hasQueuedSave',
				'syncWindowProgress',
				'win.setProgressBar',
				'ProgressBarStatus.Indeterminate',
				'ProgressBarStatus.Normal',
				'ProgressBarStatus.None',
				'reportJson',
				'reportUrl',
				'Download report JSON',
				'Structured report preview'
			],
			adapterEvidence: [
				'/alpha-readiness',
				'src/lib/components/native-shell/NativeWindowShell.svelte data-window-material',
				'src/lib/components/native-shell/NativeWindowShell.svelte data-native-platform-provenance',
				'src/lib/components/native-shell/NativeWindowShell.svelte data-desktop-shell-ui-binding',
				'src/lib/components/native-shell/NativeTitlebar.svelte data-native-platform-mode',
				'src/lib/components/native-shell/NativeTitlebar.svelte hybrid-proof',
				'src/lib/components/native-shell/NativeTitlebar.svelte data-drag-block-selector',
				'src/lib/components/native-shell/NativeTitlebar.svelte data-action="maximize"',
				'src/lib/native-shell/native-host-event-bridge.ts set-window-effect',
				'src/lib/native-shell/native-host-event-bridge.ts set-progress',
				'src/lib/native-shell/native-host-event-bridge.ts clear-progress',
				'src/lib/native-shell/native-host-event-bridge.ts report-ready',
				'/alpha-readiness/report.svg',
				'/alpha-readiness/native-host-contract.json',
				'/alpha-readiness/bridge-reuse.json',
				'/alpha-readiness/release-manifest.json'
			],
			proofUse:
				'Names the exact LG UltraGear source files and cue families reused by the alpha adapter evidence for Windows Mica styling, macOS-style chrome rhythm, host-owned window actions, and report/progress handoff.'
		},
		sourceCues: [
			{
				source: 'packages/desktop-shell-ui/src/index.ts',
				cues: [
					'enableMicaWindowChrome',
					'syncTaskbarProgress',
					'toggleWindowMaximize',
					'bindColorSchemeWatcher',
					'prefersDarkMode',
					'TaskbarProgressState',
					'saveInFlight',
					'refreshInFlight',
					'hasQueuedSave',
					'Effect.Mica',
					'ProgressBarStatus.Indeterminate',
					'ProgressBarStatus.Normal',
					'ProgressBarStatus.None',
					'progress: 18'
				],
				adopted:
					'The native host binding guide maps the adapter controller shape to the reusable UltraGear desktop-shell helpers instead of only copying visual vocabulary.'
			},
			{
				source: 'src/app.ts',
				cues: [
					'applyWindowChrome',
					'Effect.Mica',
					'win.setEffects',
					'syncWindowProgress',
					'win.setProgressBar',
					'ProgressBarStatus.Indeterminate',
					'ProgressBarStatus.Normal',
					'ProgressBarStatus.None'
				],
				adopted:
					'Mica intent and explicit progress/reporting vocabulary are represented without importing Tauri APIs into the adapter runtime.'
			},
			{
				source: 'src/lib/bridge-ui/shell/BridgeShell.svelte',
				cues: [
					':root[data-window-effect="mica"]',
					':root[data-window-effect="mica"][data-window-focused="false"]',
					'app-window.maximized'
				],
				adopted:
					'NativeWindowShell mirrors the material/focus/maximized shell states as browser-safe CSS tokens.'
			},
			{
				source: 'src/lib/bridge-ui/shell/BridgeTopbar.svelte',
				cues: [
					'DRAG_START_THRESHOLD_PX',
					'[data-no-window-drag]',
					'.caption-button',
					'pointerdown',
					'setPointerCapture',
					'window blur drag cancellation',
					'start-dragging',
					'maximize'
				],
				adopted:
					'NativeTitlebar preserves the drag/no-drag boundary, movement threshold, double-click maximize, and caption-control rhythm for future native hosts.'
			},
			{
				source: 'src/lib/bridge-ui/pages/ValidationView.svelte',
				cues: ['reportJson', 'reportUrl', 'Download report JSON', 'Structured report preview'],
				adopted:
					'Alpha readiness uses the same structured report preview/download pattern for release evidence handoff.'
			},
			{
				source: 'src/app.ts',
				cues: [
					'data-window-drag',
					'caption-button',
					'data-action="minimize"',
					'data-action="maximize"',
					'caption-button--danger'
				],
				adopted:
					'Caption controls and drag regions are represented as reviewable DOM markers while real window actions stay host-owned.'
			}
		],
		ultraGearParityContract: {
			sourceRoot: 'B:/Dev/GPTLIGHTINGSTRENGTHTEST/lg-ultragear-bridge',
			proofStage: 'source-cue-to-adapter-evidence-map',
			trustLevel: 'manual-source-parity-contract',
			parityRows: [
				{
					sourceFile: 'packages/desktop-shell-ui/src/index.ts',
					sourceCues: [
						'enableMicaWindowChrome',
						'syncTaskbarProgress',
						'toggleWindowMaximize',
						'bindColorSchemeWatcher',
						'prefersDarkMode',
						'TaskbarProgressState',
					'saveInFlight',
					'refreshInFlight',
					'hasQueuedSave',
						'Effect.Mica',
						'ProgressBarStatus.Indeterminate',
						'ProgressBarStatus.Normal',
						'ProgressBarStatus.None',
						'progress: 18'
					],
					localFiles: [
						'src/lib/alpha-native-host-guide.ts',
						'src/lib/alpha-native-host-contract.ts',
						'src/lib/native-shell/native-host-event-bridge.ts'
					],
					localEvidence: [
						'desktopShellUiBinding',
						'installSvelteKitPhpNativeHost',
						'enableMicaWindowChrome',
						'syncTaskbarProgress',
						'toggleWindowMaximize',
						'setWindowEffect',
						'setProgress',
						'clearProgress',
						'reportReady'
					],
					boundary:
						'Reusable Tauri helpers are referenced as the optional desktop host implementation path while the PHP adapter package keeps native APIs out of its runtime.'
				},
				{
					sourceFile: 'src/app.ts',
					sourceCues: [
						'applyWindowChrome',
						'Effect.Mica',
						'win.setEffects',
						'syncWindowProgress',
						'win.setProgressBar',
						'ProgressBarStatus.Indeterminate',
						'ProgressBarStatus.Normal',
						'ProgressBarStatus.None',
						'progress: 18',
						'data-window-drag',
						'data-action="maximize"'
					],
					localFiles: [
						'src/lib/components/native-shell/NativeWindowShell.svelte',
						'src/lib/components/native-shell/NativeTitlebar.svelte',
						'src/lib/native-shell/native-host-event-bridge.ts',
						'src/lib/alpha-native-host-contract.ts'
					],
					localEvidence: [
						'data-window-effect="mica"',
						'data-native-host-bridge-status',
						'native-window-action',
						'set-window-effect',
						'set-progress',
						'clear-progress',
						'report-ready',
						'setWindowEffect',
						'setProgress',
						'clearProgress',
						'reportReady',
						'/alpha-readiness/native-host-contract.json'
					],
					boundary:
						'Native Mica effects and taskbar progress remain host-owned; the PHP adapter exposes browser-safe visual tokens and progress/report evidence instead.'
				},
				{
					sourceFile: 'src/lib/bridge-ui/shell/BridgeShell.svelte',
					sourceCues: [
						'app-window.maximized',
						':root[data-window-effect="mica"]',
						':root[data-window-effect="mica"][data-window-focused="false"]',
						'--window-bg-mica',
						'--window-wash-inactive'
					],
					localFiles: [
						'src/lib/components/native-shell/NativeWindowShell.svelte',
						'src/lib/alpha-readiness-svg.ts'
					],
					localEvidence: [
						'window-frame--maximized',
						'data-window-focused',
						'data-window-effect',
						'Native chrome visual contract'
					],
					boundary:
						'The adapter mirrors material, focus, and maximized states with CSS tokens while avoiding host-window APIs.'
				},
				{
					sourceFile: 'src/lib/bridge-ui/shell/BridgeTopbar.svelte',
					sourceCues: [
						'DRAG_START_THRESHOLD_PX',
						'dragBlockSelector',
						'onpointerdown',
						'onpointermove',
						'dispatch("start-dragging")',
						'dispatch("maximize")'
					],
					localFiles: [
						'src/lib/components/native-shell/NativeTitlebar.svelte',
						'src/lib/native-shell/native-host-event-bridge.ts'
					],
					localEvidence: [
						'data-drag-start-threshold-px',
						'data-drag-block-selector',
						'data-action="maximize"',
						'caption-button',
						'window blur drag cancellation',
						'data-no-window-drag',
						'native-window-action',
						'startDragging',
						'toggleMaximize',
						'browser-fallback'
					],
					boundary:
						'The adapter preserves titlebar gesture semantics as inert DOM events until an optional host registers window handlers.'
				},
				{
					sourceFile: 'src/lib/bridge-ui/pages/ValidationView.svelte',
					sourceCues: [
						'VALIDATION_STEPS',
						'summary-strip',
						'reportJson',
						'reportUrl',
						'Download report JSON',
						'Structured report preview'
					],
					localFiles: [
						'src/routes/alpha-readiness/+page.svelte',
						'src/lib/alpha-readiness-html.ts',
						'src/lib/alpha-readiness-markdown.ts',
						'src/lib/alpha-release-manifest.ts'
					],
					localEvidence: [
						'readiness cards',
						'report downloads',
						'alpha-release-manifest.json',
						'alpha-review-index.md',
						'community-source-map.svg'
					],
					boundary:
						'The adapter translates hardware validation reporting into PHP-safe release readiness evidence, graphics, CSVs, and reviewer handoff files.'
				}
			]
		},
		progressReportHandoff: {
			sourceCues: [
				'packages/desktop-shell-ui/src/index.ts syncTaskbarProgress',
				'enableMicaWindowChrome',
				'toggleWindowMaximize',
				'syncWindowProgress',
				'ProgressBarStatus.Indeterminate',
				'ProgressBarStatus.Normal',
				'ProgressBarStatus.None',
				'progress: 18',
				'reportJson',
				'reportUrl',
				'Download report JSON',
				'Structured report preview'
			],
			adapterEvidence: [
				'src/lib/native-shell/native-host-event-bridge.ts set-progress',
				'src/lib/native-shell/native-host-event-bridge.ts clear-progress',
				'src/lib/native-shell/native-host-event-bridge.ts report-ready',
				'/alpha-readiness/report.json',
				'/alpha-readiness/report.html',
				'/alpha-readiness/report.md',
				'/alpha-readiness/report.svg',
				'/alpha-readiness/release-manifest.json',
				'/alpha-readiness/gate-matrix.json',
				'report/alpha-readiness.full.json',
				'report/alpha-release-manifest.json'
			],
			statusMapping: [
				{
					adapterState: 'collecting-evidence',
					hostCue: 'ProgressBarStatus.Indeterminate',
					reportCue:
						'community analytics, hosted smoke, or release evidence is pending; host can receive native-window-action set-progress'
				},
				{
					adapterState: 'generating-report-bundle',
					hostCue: 'ProgressBarStatus.Normal',
					reportCue:
						'deterministic JSON, HTML, Markdown, SVG, CSV, and manifest artifacts are being written; host can receive native-window-action set-progress'
				},
				{
					adapterState: 'report-ready',
					hostCue: 'ProgressBarStatus.None',
					reportCue:
						'report/alpha-readiness.full.json and /alpha-readiness/report.json can be downloaded; host can receive native-window-action report-ready and clear-progress'
				}
			],
			proofUse:
				'Translates UltraGear taskbar progress and structured validation export patterns into PHP-safe alpha report artifacts and host-bindable progress semantics.'
		},
		nativeVisualMatrix: {
			marker: 'native-visual-matrix',
			rows: [
				'windows-mica-visual-row',
				'macos-traffic-light-row',
				'windows-caption-control-row',
				'ultragear-theme-row',
				'browser-fallback-visual-row'
			],
			sourceCues: [
				'packages/desktop-shell-ui/src/index.ts enableMicaWindowChrome',
				'packages/desktop-shell-ui/src/index.ts syncTaskbarProgress',
				'toggleWindowMaximize',
				'src/app.ts applyWindowChrome',
				'Effect.Mica',
				'win.setEffects',
				'syncWindowProgress',
				'set-window-effect',
				'set-progress',
				'clear-progress',
				'report-ready',
				':root[data-window-effect="mica"]',
				'DRAG_START_THRESHOLD_PX',
				'.caption-button',
				'dispatch("start-dragging")',
				'dispatch("maximize")',
				'--window-bg-mica',
				'--window-wash-inactive'
			],
			proofUse:
				'Keeps Windows Mica, macOS traffic-light cadence, Windows caption controls, UltraGear theme tokens, and browser fallback status tied to concrete adapter markers and report surfaces.'
		},
		adapterCues: [
			{
				file: 'src/lib/components/native-shell/NativeWindowShell.svelte',
				cues: ['data-window-effect', 'data-window-focused', 'window-frame--maximized'],
				proves: 'The adapter shell exposes browser-safe Mica/focus/maximized states equivalent to the UltraGear shell state contract.'
			},
			{
				file: 'src/lib/components/native-shell/NativeTitlebar.svelte',
				cues: [
					'data-window-drag',
					'data-no-window-drag',
					'data-drag-start-threshold-px',
					'data-drag-block-selector',
					'data-action="maximize"',
					'caption-button',
					'window blur drag cancellation',
					'native-window-action',
					'start-dragging',
					'toggle-maximize'
				],
				proves:
					'The adapter titlebar carries drag/no-drag, movement-threshold markers, and browser-safe host events for future native hosts.'
			},
			{
				file: 'src/lib/native-shell/native-host-event-bridge.ts',
				cues: [
					'__SVELTEKIT_PHP_NATIVE_HOST__',
					'__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__',
					'startDragging',
					'toggleMaximize',
					'setWindowEffect',
					'setProgress',
					'clearProgress',
					'reportReady',
					'set-window-effect',
					'set-progress',
					'clear-progress',
					'report-ready',
					'browser-fallback'
				],
				proves:
					'The adapter has a concrete optional native-host controller seam and deterministic browser fallback instead of silently dropping titlebar, Mica effect, progress, or report-ready commands.'
			},
			{
				file: 'src/lib/components/native-shell/NativeHostBridgeStatus.svelte',
				cues: [
					'data-native-host-bridge-status',
					'data-native-host-handoff-controls',
					'__SVELTEKIT_PHP_NATIVE_HOST__',
					'__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__',
					'progressStatus: indeterminate',
					'set-window-effect',
					'set-progress',
					'clear-progress',
					'report-ready',
					'browser fallback active',
					'native host registered'
				],
				proves:
					'The live alpha page exposes host-controller availability, fallback/native command history, and clickable Mica/progress/report handoff events to reviewers without requiring a desktop wrapper.'
			},
			{
				file: 'src/lib/alpha-readiness-svg.ts',
				cues: [
					'Windows 11 Mica',
					'macOS traffic lights',
					'data-window-effect',
					'data-native-platform',
					'data-window-control',
					'native-window-action',
					'progressReportHandoff',
					'statusMapping',
					'ProgressBarStatus.Indeterminate',
					'ProgressBarStatus.None',
					'report-ready'
				],
				proves:
					'The portable SVG report includes explicit visual proof markers for the Mica/macOS/native-caption contract and UltraGear progress lifecycle, so PR and release-note graphics carry the same native-host seam as the live page.'
			}
		],
		boundaries: [
			'Tauri APIs are intentionally not imported into the PHP adapter fixture.',
			'Native window calls remain host-app concerns, not adapter runtime behavior.',
			'The adapter route provides browser-safe visual/reporting contracts for Windows 11 Mica and macOS-native styling.'
		],
		evidenceEndpoints: [
			'/alpha-readiness',
			'/alpha-readiness/report.html',
			'/alpha-readiness/report.svg',
			'/alpha-readiness/community-source-map.svg',
			'/alpha-readiness/native-host-contract.json',
			'/alpha-readiness/release-manifest.json',
			'/alpha-readiness/bridge-reuse.json'
		]
	};
}
