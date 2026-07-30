import type { AlphaReadinessReport } from './alpha-readiness';
import {
	buildNativeHostWrapperProbe,
	desktopShellUiBinding as nativeHostDesktopShellUiBinding
} from './native-shell/native-host-event-bridge';

const hostHandlerNotes = {
	'start-dragging':
		'Mirrors the UltraGear widget start-dragging action while preserving drag-block selector guards in the browser shell.',
	'toggle-maximize':
		'Uses the shared maximize/unmaximize helper rather than duplicating window state logic.',
	'set-window-effect':
		'Call when detail.windowEffect is mica; unsupported platforms can keep the browser-safe CSS fallback.',
	'set-progress':
		'Translate adapter progressStatus into TaskbarProgressState { saveInFlight, refreshInFlight, hasQueuedSave } before calling the desktop-shell-ui helper.',
	'clear-progress':
		'Clears queued/in-flight taskbar state, which maps to ProgressBarStatus.None.',
	'report-ready':
		'Keeps report URLs and generated alpha evidence artifacts host-owned without adding native APIs to the PHP adapter.'
} satisfies Record<string, string>;

export function buildAlphaNativeHostContract(report: AlphaReadinessReport) {
	const nativeHostWrapperProbe = buildNativeHostWrapperProbe();

	return {
		target: report.target,
		issued: report.issued,
		bridgeSource: report.bridgeSource,
		purpose:
			'Define the native-host integration seam for Windows 11 Mica, macOS chrome rhythm/vibrancy policy, caption controls, report exports, and progress/evidence handoff without importing Tauri APIs into the PHP adapter runtime.',
		adapterBoundary: {
			runtime: 'browser-and-php-host-safe',
			tauriImportsAllowed: false,
			nativeWindowCallsAllowed: false,
			reason:
				'The adapter package must remain deployable on standard PHP hosts. Native window behavior belongs in an optional desktop host wrapper.'
		},
		realHostPermissionChecklist: {
			marker: 'lg-ultragear-host-permission-checklist',
			sourceRoot: 'B:/Dev/GPTLIGHTINGSTRENGTHTEST/lg-ultragear-bridge',
			sourceFile: 'src-tauri/capabilities/default.json',
			trustLevel: 'real-host-permission-cue-required',
			requiredPermissions: [
				{
					permission: 'core:window:allow-set-effects',
					adapterActions: ['set-window-effect'],
					desktopShellUiHelpers: ['enableMicaWindowChrome'],
					proves:
						'Windows 11 Mica and host-owned material effects can be applied through the wrapper window-effects capability.'
				},
				{
					permission: 'core:window:allow-set-progress-bar',
					adapterActions: ['set-progress', 'clear-progress'],
					desktopShellUiHelpers: ['syncTaskbarProgress'],
					proves:
						'Alpha evidence/report progress can be bound to native taskbar progress states.'
				},
				{
					permission: 'core:window:allow-start-dragging',
					adapterActions: ['start-dragging'],
					desktopShellUiHelpers: ['win.startDragging'],
					proves: 'The titlebar pointer-threshold drag seam can start native window dragging.'
				},
				{
					permission: 'core:window:allow-is-maximized + core:window:allow-maximize + core:window:allow-unmaximize + core:window:allow-toggle-maximize',
					adapterActions: ['toggle-maximize'],
					desktopShellUiHelpers: ['toggleWindowMaximize'],
					proves: 'Caption maximize/restore controls can change real host window state.'
				},
				{
					permission: 'core:window:allow-theme + core:window:allow-set-focus',
					adapterActions: ['set-window-effect', 'report-ready'],
					desktopShellUiHelpers: ['bindColorSchemeWatcher', 'prefersDarkMode'],
					proves:
						'The wrapper can keep theme and focus transitions aligned with the browser-safe shell.'
				}
			],
			adapterBoundary:
				'These permissions are required only in a real Windows/macOS wrapper. They must not be imported or required by the PHP adapter runtime.',
			reviewerRule:
				'Do not replace realHostVerified:false with real OS-native proof unless the wrapper exposes equivalent permissions/capabilities and replays native-host-wrapper-event-replay successfully.',
			stableBlocker:
				'Stable 1.0.0 native claims require a real host run that proves these permission cues, not only CSS/DOM visual markers.'
		},
		desktopShellUiBinding: {
			marker: 'desktopShellUiBinding',
			packageName: '@scriptgpt/desktop-shell-ui',
			sourcePackage: 'packages/desktop-shell-ui/src/index.ts',
			upstreamWidgetSource: 'packages/ultragear-widget-ui/src/app.ts',
			trustLevel: 'optional-host-implementation-reference',
			currentImplementationCues: [
				'packages/ultragear-widget-ui/src/app.ts features.micaSupported',
				'packages/ultragear-widget-ui/src/app.ts enableMicaWindowChrome(win)',
				'packages/ultragear-widget-ui/src/app.ts syncTaskbarProgress(win, { saveInFlight, refreshInFlight, hasQueuedSave })',
				'packages/ultragear-widget-ui/src/app.ts toggleDesktopWindowMaximize(win)',
				'packages/ultragear-widget-ui/src/app.ts win.startDragging()',
				'packages/ultragear-widget-ui/src/app.ts data-window-drag',
				'packages/ultragear-widget-ui/src/app.ts data-action="maximize"',
				'packages/ultragear-widget-ui/src/app.ts mica-wash',
				'src-tauri/src/lib.rs ShellFeatureProbe.mica_supported',
				'src-tauri/src/lib.rs current_shell_features()',
				'src-tauri/src/lib.rs mica_supported: cfg!(target_os = "windows")'
			],
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
				handlers: nativeHostDesktopShellUiBinding.handlers.map((mapping) => ({
					handler: mapping.handler,
					action: mapping.action,
					requiredHostPermission: mapping.requiredHostPermission,
					ultraGearImplementation: mapping.upstreamCall,
					nativeHostBridgeMapping: `getDesktopShellUiCommandMapping('${mapping.action}') -> ${mapping.helper}`,
					detailFields: mapping.detailFields,
					notes: hostHandlerNotes[mapping.action]
				}))
			},
			systemAppearanceBinding: {
				helpers: ['prefersDarkMode', 'bindColorSchemeWatcher'],
				browserApi: 'window.matchMedia("(prefers-color-scheme: dark)")',
				hostUse:
					'Optional wrappers can mirror OS appearance changes into browser-safe shell state without exposing native APIs to the PHP adapter runtime.',
				adapterBoundary:
					'The adapter reports and DOM markers can expose the current visual mode, but native appearance integration remains host-owned.'
			},
			proofUse:
				'Gives a desktop wrapper a concrete LG UltraGear helper-package binding path for Windows 11 Mica, taskbar progress, maximize, and color-scheme handling while preserving the adapter runtime boundary.'
		},
		nativeHostCompatibilityMatrix: {
			marker: 'native-host-compatibility-matrix',
			sourceRoot: 'B:/Dev/GPTLIGHTINGSTRENGTHTEST/lg-ultragear-bridge',
			trustLevel: 'source-observed-host-compatibility-contract',
			rows: [
				{
					id: 'windows-mica-effects',
					capability: 'windows-mica-effects',
					sourceEvidence: [
						'packages/desktop-shell-ui/src/index.ts enableMicaWindowChrome',
						'packages/ultragear-widget-ui/src/app.ts enableMicaWindowChrome(win)',
						'packages/ultragear-widget-ui/src/app.ts features.micaSupported',
						'packages/ultragear-widget-ui/src/app.ts webview.setBackgroundColor([0, 0, 0, 0])',
						'packages/ultragear-widget-ui/src/app.ts windowChromeState',
						'packages/ultragear-widget-ui/src/app.ts mica-active',
						'packages/ultragear-widget-ui/src/app.ts mica-inactive',
						'packages/ultragear-widget-ui/src/app.ts plain',
						'src-tauri/src/lib.rs ShellFeatureProbe.mica_supported',
						'src-tauri/src/lib.rs current_shell_features()',
						'src-tauri/src/lib.rs mica_supported: cfg!(target_os = "windows")'
					],
					adapterEvidence: [
						'data-window-effect="mica"',
						'data-window-material="windows-11-mica"',
						'data-window-chrome-state',
						'data-window-chrome-state="mica-active"',
						'transparent-webview-material-boundary',
						'data-transparent-webview-material-boundary="host-owned"',
						'set-window-effect',
						'data-native-host-bridge-status'
					],
					boundary:
						'The adapter renders browser-safe Mica evidence. Real Windows Mica requires a host wrapper that can call Effect.Mica/setEffects.'
				},
				{
					id: 'taskbar-progress-reporting',
					capability: 'taskbar-progress-reporting',
					sourceEvidence: [
						'packages/desktop-shell-ui/src/index.ts syncTaskbarProgress',
						'packages/ultragear-widget-ui/src/app.ts syncTaskbarProgress(win, { saveInFlight, refreshInFlight, hasQueuedSave })',
						'ProgressBarStatus.Indeterminate',
						'ProgressBarStatus.Normal',
						'ProgressBarStatus.None'
					],
					adapterEvidence: [
						'set-progress',
						'clear-progress',
						'report-ready',
						'progressReportHandoff',
						'report/alpha-readiness.full.json'
					],
					boundary:
						'The adapter exposes report progress semantics. Native taskbar progress remains optional-host behavior.'
				},
				{
					id: 'native-titlebar-drag-maximize',
					capability: 'native-titlebar-drag-maximize',
					sourceEvidence: [
						'packages/ultragear-widget-ui/src/app.ts win.startDragging()',
						'packages/ultragear-widget-ui/src/app.ts toggleDesktopWindowMaximize(win)',
						'packages/ultragear-widget-ui/src/app.ts data-window-drag',
						'packages/ultragear-widget-ui/src/app.ts data-action="maximize"'
					],
					adapterEvidence: [
						'data-window-drag',
						'data-drag-start-threshold-px',
						'data-drag-block-selector',
						'native-window-action',
						'start-dragging',
						'toggle-maximize'
					],
					boundary:
						'The adapter proves the gesture/event seam in browser-safe HTML; the host controller owns real drag and maximize calls.'
				},
				{
					id: 'macos-material-host-policy',
					capability: 'macos-material-host-policy',
					sourceEvidence: [
						'src-tauri/Cargo.toml cfg(any(target_os = "macos", windows, target_os = "linux")) desktop plugin dependency lane',
						'src-tauri/src/lib.rs MacosLauncher::LaunchAgent',
						'src-tauri/capabilities/default.json core:window:allow-set-effects',
						'src-tauri/src/lib.rs mica_supported: cfg!(target_os = "windows")'
					],
					adapterEvidence: [
						'macos-vibrancy-host-policy',
						'macos-material-host-policy',
						'source-observed-macos-host-scaffold',
						'macos-native-vibrancy-unverified',
						'data-macos-chrome',
						'data-native-platform',
						'bindColorSchemeWatcher'
					],
					boundary:
						'The source proves cross-platform host/plugin scaffolding and a shared window-effects permission, while the real Mica feature probe is Windows-only. macOS vibrancy remains unverified until a macOS wrapper applies native material without browser fallback.'
				}
			],
			stableRule:
				'Stable 1.0.0 can cite this as source parity only; OS-native claims still require real Windows/macOS host smoke evidence.'
		},
		macosMaterialPolicy: {
			marker: 'macos-vibrancy-host-policy',
			sourceCue:
				'LG UltraGear/Tauri desktop plugin scaffolding, core:window:allow-set-effects permission, transparent webview material boundaries, and system color-scheme watching.',
			sourceEvidence: [
				'src-tauri/Cargo.toml cfg(any(target_os = "macos", windows, target_os = "linux"))',
				'src-tauri/src/lib.rs MacosLauncher::LaunchAgent',
				'src-tauri/capabilities/default.json core:window:allow-set-effects',
				'src-tauri/src/lib.rs mica_supported: cfg!(target_os = "windows")'
			],
			sourceObservedScaffoldMarker: 'source-observed-macos-host-scaffold',
			unverifiedNativeClaimMarker: 'macos-native-vibrancy-unverified',
			hostPermission: 'core:window:allow-set-effects',
			trustLevel: 'host-owned-native-material-policy',
			adapterMarkers: [
				'macos-material-host-policy',
				'source-observed-macos-host-scaffold',
				'macos-native-vibrancy-unverified',
				'data-native-platform',
				'data-macos-chrome',
				'data-window-material',
				'macos-traffic-light-row',
				'macos-vibrancy-visual-row',
				'bindColorSchemeWatcher',
				'prefers-color-scheme: dark'
			],
			rendererBoundary:
				'The PHP adapter renders traffic-light rhythm and browser-safe material tokens only; real macOS vibrancy/transparency must be supplied by an optional desktop host wrapper.',
			stableBlocker:
				'Stable native macOS material claims require a real macOS wrapper smoke run that proves native material application without browser fallback.'
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
					'Keeps enableMicaWindowChrome, syncTaskbarProgress, toggleWindowMaximize, bindColorSchemeWatcher, and prefersDarkMode discoverable on the live native shell surface.'
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
				marker: 'data-macos-chrome',
				source: 'src/lib/components/native-shell/NativeWindowShell.svelte',
				purpose:
					'Stable browser-safe marker for macOS traffic-light rhythm while real vibrancy/material integration remains host-owned.'
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
				'macOS vibrancy host policy',
				'macos-material-host-policy',
				'source-observed-macos-host-scaffold',
				'macos-native-vibrancy-unverified',
				'data-window-effect',
				'data-native-platform',
				'data-window-control',
				'native-window-action',
				'macos-vibrancy-visual-row',
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
					id: 'macos-vibrancy-visual-row',
					platform: 'macos',
					visualCue: 'macOS vibrancy/material host policy',
					ultraGearCue:
						'src-tauri desktop plugin lane, MacosLauncher::LaunchAgent, core:window:allow-set-effects permission, transparent webview material boundary, Windows-only mica_supported probe, and system color-scheme watcher',
					adapterMarkers: [
						'data-macos-chrome',
						'data-native-platform',
						'data-window-material',
						'macos-vibrancy-host-policy',
						'macos-material-host-policy',
						'source-observed-macos-host-scaffold',
						'macos-native-vibrancy-unverified',
						'bindColorSchemeWatcher',
						'prefers-color-scheme: dark'
					],
					visibleSurfaces: [
						'/alpha-readiness',
						'/alpha-readiness/native-host-contract.json',
						'/alpha-readiness/native-host-guide.md'
					],
					hostBoundary:
						'The PHP adapter does not claim real macOS vibrancy; an optional macOS wrapper must apply native material/effects and replay the wrapper smoke without fallback.'
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
				'bindColorSchemeWatcher',
				'TaskbarProgressState',
				'applyWindowChrome',
				'Effect.Mica',
				'win.setEffects',
				'core:window:allow-set-effects',
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
				'data-macos-chrome',
				'macos-vibrancy-host-policy',
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
		nativeHostWrapperProbe: {
			marker: 'native-host-wrapper-probe',
			source: 'src/lib/native-shell/native-host-event-bridge.ts',
			trustLevel: 'deterministic-host-wrapper-handoff',
			requiredActions: nativeHostWrapperProbe.map((step) => step.action),
			requiredHelpers: Array.from(new Set(nativeHostWrapperProbe.map((step) => step.desktopShellUiHelper))),
			steps: nativeHostWrapperProbe,
			proofUse:
				'Gives optional Windows/macOS wrappers a deterministic probe sequence for Mica, drag, maximize, progress, clear-progress, and report-ready bindings using the same LG UltraGear helper mapping as the live alpha surface.'
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
				platform: 'macos',
				capability: 'macOS vibrancy/material host policy',
				sourceCue:
					'lg-ultragear-bridge core:window:allow-set-effects permission and system appearance watcher cues; real native material remains wrapper-owned.',
				adapterEvidence: [
					'/alpha-readiness/native-host-contract.json',
					'/alpha-readiness/native-host-guide.md',
					'/alpha-readiness/bridge-reuse.json'
				],
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

export const alphaNativeHostChromeStateBoundaryEvidence = {
	status: 'source-observed-host-owned-boundary',
	sourceCues: [
		'packages/ultragear-widget-ui/src/app.ts webview.setBackgroundColor([0, 0, 0, 0])',
		'packages/ultragear-widget-ui/src/app.ts root.dataset.windowChromeState',
		'packages/ultragear-widget-ui/src/app.ts windowChromeState mica-active | mica-inactive | plain',
	],
	adapterMarkers: [
		'data-window-chrome-state="mica-active"',
		'data-transparent-webview-material-boundary="host-owned"',
		'transparent-webview-material-boundary',
	],
	policy:
		'The adapter can emit SSR/report markers for native material readiness, but real Mica/acrylic/vibrancy behavior stays owned by the desktop host and must be proven in a live host smoke.',
} as const;
