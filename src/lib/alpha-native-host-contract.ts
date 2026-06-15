import type { AlphaReadinessReport } from './alpha-readiness';

export function buildAlphaNativeHostContract(report: AlphaReadinessReport) {
	return {
		target: report.target,
		issued: report.issued,
		bridgeSource: report.bridgeSource,
		purpose:
			'Define the native-host integration seam for Windows 11 Mica, macOS chrome rhythm, caption controls, report exports, and progress/evidence handoff without importing Tauri APIs into the PHP adapter runtime.',
		adapterBoundary: {
			runtime: 'browser-and-php-host-safe',
			tauriImportsAllowed: false,
			nativeWindowCallsAllowed: false,
			reason:
				'The adapter package must remain deployable on standard PHP hosts. Native window behavior belongs in an optional desktop host wrapper.'
		},
		desktopShellUiBinding: {
			marker: 'desktopShellUiBinding',
			packageName: '@scriptgpt/desktop-shell-ui',
			sourcePackage: 'packages/desktop-shell-ui/src/index.ts',
			upstreamWidgetSource: 'packages/ultragear-widget-ui/src/app.ts',
			trustLevel: 'optional-host-implementation-reference',
			requiredImports: [
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
				'ProgressBarStatus.None'
			],
			controllerBinding: {
				global: 'window.__SVELTEKIT_PHP_NATIVE_HOST__',
				installer: 'installSvelteKitPhpNativeHost',
				hostWindow: '@tauri-apps/api/window getCurrentWindow()',
				handlers: [
					{
						handler: 'startDragging',
						action: 'start-dragging',
						ultraGearImplementation: 'win.startDragging()',
						nativeHostBridgeMapping:
							"getDesktopShellUiCommandMapping('start-dragging') -> win.startDragging",
						detailFields: ['dragStartThresholdPx', 'source'],
						notes:
							'Mirrors the UltraGear widget start-dragging action while preserving drag-block selector guards in the browser shell.'
					},
					{
						handler: 'setWindowEffect',
						action: 'set-window-effect',
						ultraGearImplementation: 'enableMicaWindowChrome(win)',
						nativeHostBridgeMapping:
							"getDesktopShellUiCommandMapping('set-window-effect') -> enableMicaWindowChrome",
						detailFields: ['windowEffect', 'source'],
						notes:
							'Call when detail.windowEffect is mica; unsupported platforms can keep the browser-safe CSS fallback.'
					},
					{
						handler: 'setProgress',
						action: 'set-progress',
						ultraGearImplementation:
							'syncTaskbarProgress(win, toDesktopShellUiTaskbarProgressState(detail))',
						nativeHostBridgeMapping:
							"getDesktopShellUiCommandMapping('set-progress') -> syncTaskbarProgress",
						detailFields: ['progress', 'progressStatus', 'source'],
						notes:
							'Translate adapter progressStatus into TaskbarProgressState { saveInFlight, refreshInFlight, hasQueuedSave } before calling the desktop-shell-ui helper.'
					},
					{
						handler: 'clearProgress',
						action: 'clear-progress',
						ultraGearImplementation:
							'syncTaskbarProgress(win, { saveInFlight: false, refreshInFlight: false, hasQueuedSave: false })',
						nativeHostBridgeMapping:
							"getDesktopShellUiCommandMapping('clear-progress') -> syncTaskbarProgress",
						detailFields: ['progressStatus', 'source'],
						notes: 'Clears queued/in-flight taskbar state, which maps to ProgressBarStatus.None.'
					},
					{
						handler: 'toggleMaximize',
						action: 'toggle-maximize',
						ultraGearImplementation: 'toggleWindowMaximize(win)',
						nativeHostBridgeMapping:
							"getDesktopShellUiCommandMapping('toggle-maximize') -> toggleWindowMaximize",
						detailFields: ['source'],
						notes: 'Uses the shared maximize/unmaximize helper rather than duplicating window state logic.'
					},
					{
						handler: 'reportReady',
						action: 'report-ready',
						ultraGearImplementation: 'host.reportReady({ reportHref, reportKind, reportLabel })',
						nativeHostBridgeMapping:
							"getDesktopShellUiCommandMapping('report-ready') -> host.reportReady",
						detailFields: ['reportHref', 'reportKind', 'reportLabel', 'source'],
						notes:
							'Keeps report URLs and generated alpha evidence artifacts host-owned without adding native APIs to the PHP adapter.'
					}
				]
			},
			proofUse:
				'Gives a desktop wrapper a concrete LG UltraGear helper-package binding path for Windows 11 Mica, taskbar progress, maximize, and color-scheme handling while preserving the adapter runtime boundary.'
		},
		requiredDomMarkers: [
			{
				marker: 'data-native-shell',
				source: 'src/lib/components/native-shell/NativeWindowShell.svelte',
				purpose: 'Stable root marker for desktop-host discovery and visual regression snapshots.'
			},
			{
				marker: 'data-desktop-shell-ui-binding',
				source: 'src/lib/components/native-shell/NativeWindowShell.svelte',
				purpose:
					'Declares that the browser-safe native shell is mapped to the optional @scriptgpt/desktop-shell-ui binding contract.'
			},
			{
				marker: 'data-desktop-shell-helper-functions',
				source: 'src/lib/components/native-shell/NativeWindowShell.svelte',
				purpose:
					'Keeps enableMicaWindowChrome, syncTaskbarProgress, and toggleWindowMaximize discoverable on the live native shell surface.'
			},
			{
				marker: 'data-native-shell-theme',
				source: 'src/lib/components/native-shell/NativeWindowShell.svelte',
				purpose:
					'Declares the active shell theme, including theme-alpha, theme-light, theme-dark, and the UltraGear-derived theme-ultragear.'
			},
			{
				marker: 'data-native-window-frame',
				source: 'src/lib/components/native-shell/NativeWindowShell.svelte',
				purpose:
					'Stable host/screenshot target for the frameless window frame, Mica fallback wash, and maximized-window edge behavior.'
			},
			{
				marker: 'data-window-effect="mica"',
				source: 'src/lib/components/native-shell/NativeWindowShell.svelte',
				purpose:
					'Browser-safe declaration that the surface is styled after Windows 11 Mica, with acrylic/none compatibility slots reserved.'
			},
			{
				marker: 'data-window-material="windows-11-mica"',
				source: 'src/lib/components/native-shell/NativeWindowShell.svelte',
				purpose:
					'Stable material marker used by hosted smoke checks to distinguish the Windows 11 Mica visual contract from generic CSS theming.'
			},
			{
				marker: 'data-window-focused',
				source: 'src/lib/components/native-shell/NativeWindowShell.svelte',
				purpose: 'Focus-state styling seam equivalent to the UltraGear bridge inactive Mica treatment.'
			},
			{
				marker: 'data-native-titlebar',
				source: 'src/lib/components/native-shell/NativeTitlebar.svelte',
				purpose: 'Stable titlebar marker for native host binding, screenshots, and chrome parity checks.'
			},
			{
				marker: 'data-native-platform',
				source: 'src/lib/components/native-shell/NativeTitlebar.svelte',
				purpose:
					'Platform chrome switch for auto, windows, or macos visual seams without importing host APIs.'
			},
			{
				marker: 'data-native-platform-mode="hybrid-proof"',
				source: 'src/lib/components/native-shell/NativeTitlebar.svelte',
				purpose:
					'Declares that the alpha surface intentionally renders both macOS and Windows chrome proof rows for reviewer comparison.'
			},
			{
				marker: 'data-window-drag',
				source: 'src/lib/components/native-shell/NativeTitlebar.svelte',
				purpose:
					'Future host wrapper can bind safe titlebar drag behavior here, matching the UltraGear pointer-threshold drag cue.'
			},
			{
				marker: 'data-no-window-drag',
				source: 'src/lib/components/native-shell/NativeTitlebar.svelte',
				purpose: 'Buttons and chips inside the titlebar must not start native drag.'
			},
			{
				marker: 'data-drag-start-threshold-px',
				source: 'src/lib/components/native-shell/NativeTitlebar.svelte',
				purpose: 'Preserves the UltraGear drag threshold cue without binding native APIs.'
			},
			{
				marker: 'data-drag-block-selector',
				source: 'src/lib/components/native-shell/NativeTitlebar.svelte',
				purpose:
					'Exposes the UltraGear no-drag selector list for host-wrapper parity and drag-region debugging.'
			},
			{
				marker: 'data-window-control-group',
				source: 'src/lib/components/native-shell/NativeTitlebar.svelte',
				purpose:
					'Separates decorative macOS traffic lights from Windows caption-control seams for platform-specific host replacement.'
			},
			{
				marker: 'data-window-control',
				source: 'src/lib/components/native-shell/NativeTitlebar.svelte',
				purpose:
					'Names minimize, maximize, and close control placeholders so a host wrapper can bind real commands later.'
			},
			{
				marker: 'data-native-host-bridge-status',
				source: 'src/lib/components/native-shell/NativeHostBridgeStatus.svelte',
				purpose:
					'Stable live-review marker for host controller availability, browser fallback state, and recent native host command history.'
			},
			{
				marker: 'data-native-host-handoff-controls',
				source: 'src/lib/components/native-shell/NativeHostBridgeStatus.svelte',
				purpose:
					'Stable live-review marker for browser-safe Mica, progress, clear-progress, and report-ready event dispatch controls.'
			}
		],
		nativeShellThemes: [
			{
				name: 'theme-alpha',
				source: 'src/lib/components/native-shell/NativeWindowShell.svelte',
				purpose: 'Default report surface with light/dark Mica fallback tokens.'
			},
			{
				name: 'theme-ultragear',
				source: 'B:/Dev/GPTLIGHTINGSTRENGTHTEST/lg-ultragear-bridge/src/lib/bridge-ui/tokens/theme.css',
				purpose:
					'UltraGear-derived dark desktop material direction for future host prototypes and visual parity checks.'
			}
		],
		visualSnapshotContract: {
			route: '/alpha-readiness',
			graphic: '/alpha-readiness/report.svg',
			components: [
				'src/lib/components/native-shell/NativeWindowShell.svelte',
				'src/lib/components/native-shell/NativeTitlebar.svelte',
				'src/lib/alpha-readiness-svg.ts'
			],
			requiredMarkers: [
				'Windows 11 Mica',
				'macOS traffic lights',
				'data-window-effect',
				'data-native-platform',
				'data-window-control',
				'native-window-action',
				'set-window-effect',
				'set-progress',
				'report-ready'
			],
			purpose:
				'Gives reviewers a screenshot/graphic-oriented proof target for the native visual contract without requiring a real desktop wrapper during PHP-host smoke.'
		},
		nativeVisualMatrix: {
			marker: 'native-visual-matrix',
			proofStage: 'browser-safe-native-visual-contract',
			trustLevel: 'deterministic-runtime-evidence',
			rows: [
				{
					id: 'windows-mica-visual-row',
					platform: 'windows',
					visualCue: 'Windows 11 Mica material',
					ultraGearCue:
						'src/app.ts applyWindowChrome, Effect.Mica, win.setEffects, :root[data-window-effect="mica"], --window-bg-mica',
					adapterMarkers: [
						'data-native-shell-theme',
						'data-window-effect="mica"',
						'data-window-material="windows-11-mica"',
						'data-native-platform',
						'data-native-window-frame',
						'window-frame--maximized',
						'set-window-effect'
					],
					visibleSurfaces: ['/alpha-readiness', '/alpha-readiness/report.svg'],
					hostBoundary:
						'The PHP adapter renders a browser-safe Mica fallback; real Mica remains host-owned.'
				},
				{
					id: 'macos-traffic-light-row',
					platform: 'macos',
					visualCue: 'macOS traffic-light rhythm',
					ultraGearCue:
						'BridgeTopbar.svelte traffic-light cadence, pointer threshold, and titlebar drag boundary',
					adapterMarkers: [
						'data-native-titlebar',
						'data-native-platform',
						'data-window-control-group="macos"',
						'data-no-window-drag'
					],
					visibleSurfaces: ['/alpha-readiness', '/alpha-readiness/report.svg'],
					hostBoundary:
						'The browser page shows the macOS rhythm; a desktop host owns real titlebar integration.'
				},
				{
					id: 'windows-caption-control-row',
					platform: 'windows',
					visualCue: 'Windows caption controls and drag seam',
					ultraGearCue:
						'DRAG_START_THRESHOLD_PX, dragBlockSelector, dispatch("start-dragging"), dispatch("maximize")',
					adapterMarkers: [
						'data-window-control-group="windows"',
						'data-window-control',
						'data-action="maximize"',
						'caption-button',
						'data-window-drag',
						'data-drag-start-threshold-px',
						'data-drag-block-selector',
						'native-window-action'
					],
					visibleSurfaces: ['/alpha-readiness', '/alpha-readiness/native-host-contract.json'],
					hostBoundary:
						'The adapter emits browser-safe native-window-action events; real minimize/maximize/close behavior remains host-owned.'
				},
				{
					id: 'ultragear-theme-row',
					platform: 'desktop-host',
					visualCue: 'UltraGear dark material theme',
					ultraGearCue:
						'lg-ultragear-bridge theme.css dark material wash, inactive-window wash, and accent gradients',
					adapterMarkers: [
						'theme-ultragear',
						'--window-wash-inactive',
						'--window-bg-mica',
						'--window-surface'
					],
					visibleSurfaces: [
						'/alpha-readiness/native-host-contract.json',
						'/alpha-readiness/bridge-reuse.json'
					],
					hostBoundary:
						'The theme tokens are present for visual parity checks without requiring the PHP adapter to become the desktop shell.'
				},
				{
					id: 'browser-fallback-visual-row',
					platform: 'browser',
					visualCue: 'Hosted browser fallback with host status',
					ultraGearCue:
						'Native command availability is explicit rather than silently degrading when host APIs are absent',
					adapterMarkers: [
						'data-native-host-bridge-status',
						'window.__SVELTEKIT_PHP_NATIVE_HOST__',
						'window.__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__',
						'browser-fallback',
						'setProgress',
						'clearProgress',
						'reportReady'
					],
					visibleSurfaces: ['/alpha-readiness', '/alpha-readiness/bridge-reuse.json'],
					hostBoundary:
						'Hosted PHP demos expose the fallback state so reviewers do not confuse browser styling with real OS chrome.'
				}
			],
			reviewerRule:
				'Every row must stay visible or machine-readable before alpha release; stable 1.0.0 still needs a real host wrapper/smoke path for OS-native proof.'
		},
		ultraGearSourceParity: {
			sourceRoot: 'B:/Dev/GPTLIGHTINGSTRENGTHTEST/lg-ultragear-bridge',
			sourceFiles: [
				'packages/desktop-shell-ui/src/index.ts',
				'src/app.ts',
				'src/lib/bridge-ui/shell/BridgeShell.svelte',
				'src/lib/bridge-ui/shell/BridgeTopbar.svelte',
				'src/lib/bridge-ui/pages/ValidationView.svelte',
				'src/lib/bridge-ui/tokens/theme.css'
			],
			requiredSourceCues: [
				'enableMicaWindowChrome',
				'syncTaskbarProgress',
				'toggleWindowMaximize',
				'TaskbarProgressState',
				'applyWindowChrome',
				'Effect.Mica',
				'win.setEffects',
				'syncWindowProgress',
				'win.setProgressBar',
				'ProgressBarStatus.Indeterminate',
				'app-window.maximized',
				':root[data-window-effect="mica"]',
				'DRAG_START_THRESHOLD_PX',
				'dragBlockSelector',
				'window blur drag cancellation',
				'dispatch("start-dragging")',
				'dispatch("maximize")',
				'Download report JSON',
				'Structured report preview'
			],
			adapterTranslation:
				'Native OS calls stay in an optional host wrapper; adapter source carries the matching DOM markers, browser fallback event bridge, native-styled report graphics, and structured release evidence artifacts.'
		},
		progressReportHandoff: {
			sourceCue: 'src/app.ts syncWindowProgress and src/lib/bridge-ui/pages/ValidationView.svelte reportUrl/reportJson',
			hostOwnedCues: [
				'syncWindowProgress',
				'ProgressBarStatus.Indeterminate',
				'ProgressBarStatus.Normal',
				'ProgressBarStatus.None',
				'progress: 18'
			],
			adapterEvidence: [
				'/alpha-readiness',
				'src/lib/native-shell/native-host-event-bridge.ts set-window-effect',
				'src/lib/components/native-shell/NativeHostBridgeStatus.svelte progressStatus indeterminate',
				'src/lib/native-shell/native-host-event-bridge.ts set-progress',
				'src/lib/native-shell/native-host-event-bridge.ts clear-progress',
				'src/lib/native-shell/native-host-event-bridge.ts report-ready',
				'/alpha-readiness/report.json',
				'/alpha-readiness/report.html',
				'/alpha-readiness/report.md',
				'/alpha-readiness/report.svg',
				'/alpha-readiness/release-manifest.json',
				'/alpha-readiness/gate-matrix.json'
			],
			commands: ['bun run alpha:report:full', 'bun run verify:alpha', 'bun run alpha:gate'],
			statusMapping: [
				{
					adapterState: 'collecting-evidence',
					hostCue: 'ProgressBarStatus.Indeterminate',
					reportCue:
						'alpha:analytics or hosted smoke evidence is still being collected; host can receive native-window-action set-progress'
				},
				{
					adapterState: 'generating-report-bundle',
					hostCue: 'ProgressBarStatus.Normal',
					reportCue:
						'progress: 18 through deterministic report artifact generation; host can receive native-window-action set-progress'
				},
				{
					adapterState: 'report-ready',
					hostCue: 'ProgressBarStatus.None',
					reportCue:
						'/alpha-readiness/report.json and report/alpha-readiness.full.json are ready for download; host can receive native-window-action report-ready and clear-progress'
				}
			],
			boundary:
				'The PHP adapter does not own taskbar APIs. It exposes progress/report handoff metadata and deterministic artifacts that a desktop host can bind to native progress UI.'
		},
		hostEvents: [
			{
				event: 'native-window-action',
				source:
					'src/lib/components/native-shell/NativeTitlebar.svelte and src/lib/native-shell/native-host-event-bridge.ts',
				bridge: 'src/lib/native-shell/native-host-event-bridge.ts',
				actions: [
					'start-dragging',
					'toggle-maximize',
					'set-window-effect',
					'set-progress',
					'clear-progress',
					'report-ready'
				],
				detailShape: {
					action:
						'start-dragging | toggle-maximize | set-window-effect | set-progress | clear-progress | report-ready',
					source: 'NativeTitlebar | AlphaReadinessReport | optional desktop host',
					dragStartThresholdPx: 'number',
					windowEffect: 'mica | acrylic | none',
					progressStatus: 'indeterminate | normal | none',
					progress: '0..100',
					reportHref: 'string',
					reportKind: 'json | html | markdown | svg | csv | bundle'
				},
				purpose:
					'Browser-safe host event seam that mirrors the UltraGear pointer-threshold drag/maximize, Mica effect, taskbar progress, and structured report handoff behavior without importing Tauri APIs.'
			}
		],
		hostRuntimeBridge: {
			source: 'src/lib/native-shell/native-host-event-bridge.ts',
			mountedBy: 'src/lib/components/native-shell/NativeWindowShell.svelte',
			globalController: 'window.__SVELTEKIT_PHP_NATIVE_HOST__',
			globalHistory: 'window.__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__',
			handlers: [
				'startDragging',
				'toggleMaximize',
				'setWindowEffect',
				'setProgress',
				'clearProgress',
				'reportReady'
			],
			supportedActions: [
				'start-dragging',
				'toggle-maximize',
				'set-window-effect',
				'set-progress',
				'clear-progress',
				'report-ready'
			],
			resultModes: ['native-host', 'browser-fallback', 'unsupported'],
			purpose:
				'Provides an optional desktop-host controller seam plus deterministic browser fallback/history so hosted PHP demos can prove the native boundary without owning native window APIs.'
		},
		hostResponsibilities: [
			{
				platform: 'windows',
				capability: 'Windows 11 Mica material',
				sourceCue:
					'lg-ultragear-bridge src/lib/bridge-ui/tokens/theme.css --window-bg-mica and BridgeShell.svelte data-window-effect="mica"',
				adapterEvidence: ['/alpha-readiness', '/alpha-readiness/bridge-reuse.json'],
				status: 'host-owned'
			},
			{
				platform: 'windows',
				capability: 'Caption controls and pointer-threshold drag',
				sourceCue:
					'lg-ultragear-bridge src/lib/bridge-ui/shell/BridgeTopbar.svelte DRAG_START_THRESHOLD_PX, pointer handlers, and drag block list',
				adapterEvidence: ['/alpha-readiness', '/alpha-readiness/native-host-contract.json'],
				status: 'host-owned'
			},
			{
				platform: 'macos',
				capability: 'macOS traffic-light rhythm and draggable titlebar',
				sourceCue:
					'lg-ultragear-bridge src/lib/bridge-ui/shell/BridgeTopbar.svelte pointer threshold and NativeTitlebar traffic-light seams',
				adapterEvidence: ['/alpha-readiness', '/alpha-readiness/native-host-contract.json'],
				status: 'host-owned'
			},
			{
				platform: 'desktop-host',
				capability: 'Progress/report handoff',
				sourceCue:
					'lg-ultragear-bridge setProgressBar and ValidationView structured report download mapped through setProgress, clearProgress, and reportReady host handlers',
				adapterEvidence: [
					'/alpha-readiness/native-host-contract.json',
					'/alpha-readiness/bridge-reuse.json',
					'/alpha-readiness/report.json',
					'/alpha-readiness/report.html',
					'/alpha-readiness/review-index.md'
				],
				status: 'adapter-evidence-provided'
			},
			{
				platform: 'desktop-host',
				capability: 'Host event controller and fallback history',
				sourceCue:
					'lg-ultragear-bridge BridgeTopbar.svelte pointer-threshold commands plus src/app.ts progress/effect cues mapped to window.__SVELTEKIT_PHP_NATIVE_HOST__ startDragging/toggleMaximize/setWindowEffect/setProgress/clearProgress/reportReady handlers',
				adapterEvidence: [
					'/alpha-readiness/native-host-contract.json',
					'/alpha-readiness/bridge-reuse.json'
				],
				status: 'optional-host-controller'
			}
		],
		reportEvidence: [
			'/alpha-readiness/report.html',
			'/alpha-readiness/report.md',
			'/alpha-readiness/report.svg',
			'/alpha-readiness/community-source-map.svg',
			'/alpha-readiness/review-index.md',
			'/alpha-readiness/native-host-contract.json'
		],
		releaseGate:
			'The native-host contract is alpha-ready when the route and generated report artifact are present, but stable 1.0.0 still requires hosted PHP smoke with ALPHA_SMOKE_BASE_URL and bun run alpha:gate:hosted.'
	};
}
