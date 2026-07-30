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
			'packages/desktop-shell-ui/src/index.ts enableMicaWindowChrome, syncTaskbarProgress, toggleWindowMaximize, bindColorSchemeWatcher, and prefersDarkMode',
			'src/app.ts applyWindowChrome and syncWindowProgress',
			'src-tauri/capabilities/default.json core:window:allow-set-effects host-owned material permission',
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
				'src-tauri/Cargo.toml',
				'src-tauri/capabilities/default.json',
				'src-tauri/src/lib.rs',
				'packages/ultragear-widget-ui/src/app.ts',
				'src/app.ts',
				'src/lib/bridge-ui/shell/BridgeShell.svelte',
				'src/lib/bridge-ui/shell/BridgeTopbar.svelte',
				'src/lib/bridge-ui/tokens/theme.css',
				'src/lib/bridge-ui/pages/ValidationView.svelte'
			],
			hostPermissionCues: [
				{
					sourceFile: 'src-tauri/capabilities/default.json',
					permission: 'core:window:allow-set-effects',
					adapterActions: ['set-window-effect'],
					desktopShellUiHelpers: ['enableMicaWindowChrome'],
					proves:
						'A real Windows wrapper can call win.setEffects({ effects: [Effect.Mica] }) instead of only rendering a browser-safe Mica fallback.'
				},
				{
					sourceFile: 'src-tauri/capabilities/default.json',
					permission: 'core:window:allow-set-progress-bar',
					adapterActions: ['set-progress', 'clear-progress'],
					desktopShellUiHelpers: ['syncTaskbarProgress'],
					proves:
						'A real wrapper can bind alpha report/evidence progress to taskbar progress states.'
				},
				{
					sourceFile: 'src-tauri/capabilities/default.json',
					permission: 'core:window:allow-start-dragging',
					adapterActions: ['start-dragging'],
					desktopShellUiHelpers: ['win.startDragging'],
					proves:
						'The pointer-threshold titlebar seam can become a real native drag action in a host wrapper.'
				},
				{
					sourceFile: 'src-tauri/capabilities/default.json',
					permission: 'core:window:allow-is-maximized + core:window:allow-maximize + core:window:allow-unmaximize + core:window:allow-toggle-maximize',
					adapterActions: ['toggle-maximize'],
					desktopShellUiHelpers: ['toggleWindowMaximize'],
					proves:
						'The Windows caption maximize/restore seam can become a real native window-state action.'
				},
				{
					sourceFile: 'src-tauri/capabilities/default.json',
					permission: 'core:window:allow-theme + core:window:allow-set-focus',
					adapterActions: ['set-window-effect', 'report-ready'],
					desktopShellUiHelpers: ['bindColorSchemeWatcher', 'prefersDarkMode'],
					proves:
						'A real wrapper can keep OS appearance/focus transitions aligned with the browser-safe shell state.'
				}
			],
			windowsMicaCues: [
				'enableMicaWindowChrome',
				'applyWindowChrome',
				'Effect.Mica',
				'win.setEffects',
				'micaSupported',
				'ShellFeatureProbe.mica_supported',
				'current_shell_features()',
				'cfg!(target_os = "windows")',
				':root[data-window-effect="mica"]',
				':root[data-window-effect="mica"][data-window-focused="false"]',
				'--window-bg-mica',
				'--window-bg-inactive',
				'--window-wash-inactive'
			],
			macosChromeCues: [
				'macos-traffic-light-row',
				'macos-vibrancy-host-policy',
				'macos-vibrancy-visual-row',
				'macos-material-host-policy',
				'source-observed-macos-host-scaffold',
				'macos-native-vibrancy-unverified',
				'src-tauri/Cargo.toml cfg(any(target_os = "macos", windows, target_os = "linux"))',
				'MacosLauncher::LaunchAgent',
				'mica_supported: cfg!(target_os = "windows")',
				'data-macos-chrome',
				'core:window:allow-set-effects',
				'data-native-platform',
				'data-window-control-group',
				'data-window-control',
				'.caption-button'
			],
			systemThemeCues: [
				'prefersDarkMode',
				'bindColorSchemeWatcher',
				'window.matchMedia("(prefers-color-scheme: dark)")',
				'prefers-color-scheme: dark'
			],
			shellMaterialCues: [
				'app-window',
				'app-window.maximized',
				':root[data-window-effect="mica"][data-window-focused="true"]',
				':root[data-window-effect="mica"][data-window-focused="false"]',
				'theme-ultragear',
				'data-macos-chrome',
				'macos-vibrancy-host-policy',
				'--surface-chrome',
				'--window-bg-inactive',
				'max-width: 1180px',
				'max-width: 860px'
			],
			windowActionCues: [
				'toggleWindowMaximize',
				'DRAG_START_THRESHOLD_PX',
				'dragBlockSelector',
				'[data-no-window-drag]',
				'setPointerCapture',
				'lostpointercapture',
				'window blur drag cancellation',
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
				'/alpha-readiness/native-host-guide.md',
				'/alpha-readiness/bridge-reuse.json',
				'/alpha-readiness/release-manifest.json'
			],
			proofUse:
				'Names the exact LG UltraGear source files and cue families reused by the alpha adapter evidence for Windows Mica styling, macOS-style chrome rhythm, source-observed macOS material host policy, unverified native macOS vibrancy, system color-scheme handling, host-owned window actions, and report/progress handoff.'
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
					source: 'packages/ultragear-widget-ui/src/app.ts',
					cues: [
					'features.micaSupported',
					'windowChromeState',
					'mica-active',
					'mica-inactive',
					'plain',
					'webview.setBackgroundColor([0, 0, 0, 0])',
						'enableMicaWindowChrome(win)',
					'windowMicaActive',
					'syncTaskbarProgress(win, { saveInFlight, refreshInFlight, hasQueuedSave })',
					'toggleDesktopWindowMaximize(win)',
					'win.startDragging()',
					'data-window-drag',
					'caption-button',
					'data-action="maximize"',
					'mica-wash',
					'titlebar'
				],
				adopted:
					'The alpha evidence now tracks the packaged UltraGear widget implementation, not only the older root app.ts surface, so reviewer searches can verify current helper usage and DOM seams.'
			},
			{
				source: 'src-tauri/src/lib.rs',
				cues: [
					'ShellFeatureProbe.mica_supported',
					'current_shell_features()',
					'cfg!(target_os = "windows")',
					'MacosLauncher::LaunchAgent'
				],
				adopted:
					'The compatibility matrix now records the real UltraGear shell feature probe that decides whether Mica is supported, without claiming PHP runtime access to that native probe.'
			},
			{
				source: 'src-tauri/Cargo.toml',
				cues: [
					'cfg(any(target_os = "macos", windows, target_os = "linux"))',
					'tauri-plugin-autostart',
					'tauri-plugin-single-instance'
				],
				adopted:
					'The macOS material lane is recorded as source-observed desktop host scaffolding, not as proof that the PHP adapter can render real macOS vibrancy.'
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
					'app-window',
					'theme-ultragear',
					':root[data-window-effect="mica"]',
					':root[data-window-effect="mica"][data-window-focused="false"]',
					'app-window.maximized',
					'--window-bg-mica',
					'--window-bg-inactive',
					'--window-wash-inactive',
					'--surface-chrome',
					'max-width: 1180px',
					'max-width: 860px'
				],
				adopted:
					'NativeWindowShell mirrors the app-window material, inactive-focus, maximized, UltraGear theme, and responsive shell states as browser-safe CSS tokens.'
			},
			{
				source: 'src/lib/bridge-ui/shell/BridgeTopbar.svelte',
				cues: [
					'DRAG_START_THRESHOLD_PX',
					'[data-no-window-drag]',
					'.caption-button',
					'pointerdown',
					'onpointermove',
					'setPointerCapture',
					'lostpointercapture',
					'window blur drag cancellation',
					'start-dragging',
					'maximize'
				],
				adopted:
					'NativeTitlebar preserves the drag/no-drag boundary, movement threshold, double-click maximize, and caption-control rhythm for future native hosts.'
			},
			{
				source: 'src-tauri/capabilities/default.json',
				cues: [
					'core:window:allow-set-effects',
					'core:window:allow-theme',
					'core:window:allow-set-focus'
				],
				adopted:
					'The alpha native-host contract treats Windows Mica and macOS vibrancy/material as real-host window-effect policy instead of PHP adapter runtime behavior.'
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
					sourceFile: 'packages/ultragear-widget-ui/src/app.ts',
					sourceCues: [
						'features.micaSupported',
						'windowChromeState',
						'mica-active',
						'mica-inactive',
						'plain',
						'webview.setBackgroundColor([0, 0, 0, 0])',
						'enableMicaWindowChrome(win)',
						'windowMicaActive',
						'syncTaskbarProgress(win, { saveInFlight, refreshInFlight, hasQueuedSave })',
						'toggleDesktopWindowMaximize(win)',
						'win.startDragging()',
						'data-window-drag',
						'caption-button',
						'data-action="maximize"',
						'mica-wash',
						'titlebar'
					],
					localFiles: [
						'src/lib/components/native-shell/NativeWindowShell.svelte',
						'src/lib/components/native-shell/NativeTitlebar.svelte',
						'src/lib/components/native-shell/NativeHostBridgeStatus.svelte',
						'src/lib/native-shell/native-host-event-bridge.ts'
					],
					localEvidence: [
						'data-desktop-shell-helper-functions',
						'data-native-host-handoff-controls',
						'data-window-effect="mica"',
						'data-window-drag',
						'data-drag-block-selector',
						'native-window-action',
						'set-window-effect',
						'set-progress',
						'clear-progress',
						'report-ready'
					],
					boundary:
						'The current packaged UltraGear widget proves helper wiring and titlebar seams; the adapter exposes equivalent markers/events but leaves real window effects, drag, and progress to an optional host.'
				},
				{
					sourceFile: 'src/lib/bridge-ui/shell/BridgeShell.svelte',
					sourceCues: [
						'app-window',
						'theme-ultragear',
						'app-window.maximized',
						':root[data-window-effect="mica"]',
						':root[data-window-effect="mica"][data-window-focused="false"]',
						'--window-bg-mica',
						'--window-bg-inactive',
						'--window-wash-inactive',
						'--surface-chrome',
						'max-width: 1180px',
						'max-width: 860px'
					],
					localFiles: [
						'src/lib/components/native-shell/NativeWindowShell.svelte',
						'src/lib/alpha-readiness-svg.ts'
					],
					localEvidence: [
						'window-frame--maximized',
						'data-window-material',
						'data-window-effect="mica"',
						'data-window-focused',
						'data-window-effect',
						'Native chrome visual contract'
					],
					boundary:
						'The adapter mirrors material, focus, and maximized states with CSS tokens while avoiding host-window APIs.'
				},
				{
					sourceFile: 'src-tauri/capabilities/default.json',
					sourceCues: [
						'core:window:allow-set-effects',
						'core:window:allow-theme',
						'core:window:allow-set-focus'
					],
					localFiles: [
						'src/lib/alpha-native-host-contract.ts',
						'src/lib/alpha-native-host-guide.ts',
						'src/lib/alpha-bridge-reuse.ts'
					],
					localEvidence: [
						'macos-vibrancy-host-policy',
						'macos-vibrancy-visual-row',
						'data-macos-chrome',
						'bindColorSchemeWatcher',
						'prefers-color-scheme: dark'
					],
					boundary:
						'The PHP adapter can document and emit material intent, but real macOS vibrancy/effects stay in the optional native wrapper.'
				},
				{
					sourceFile: 'src-tauri/Cargo.toml + src-tauri/src/lib.rs',
					sourceCues: [
						'cfg(any(target_os = "macos", windows, target_os = "linux"))',
						'MacosLauncher::LaunchAgent',
						'mica_supported: cfg!(target_os = "windows")'
					],
					localFiles: [
						'src/lib/alpha-native-host-contract.ts',
						'src/lib/alpha-bridge-reuse.ts',
						'src/lib/alpha-release-manifest.ts'
					],
					localEvidence: [
						'macos-material-host-policy',
						'source-observed-macos-host-scaffold',
						'macos-native-vibrancy-unverified',
						'macos-vibrancy-host-policy',
						'macos-vibrancy-visual-row'
					],
					boundary:
						'The bridge source has macOS host/plugin scaffolding but the explicit Mica feature probe is Windows-only; alpha can show macOS-style chrome and host policy, while real vibrancy remains a wrapper smoke requirement.'
				},
				{
					sourceFile: 'src/lib/bridge-ui/shell/BridgeTopbar.svelte',
					sourceCues: [
						'DRAG_START_THRESHOLD_PX',
						'dragBlockSelector',
						'[data-no-window-drag]',
						'.caption-button',
						'onpointerdown',
						'onpointermove',
						'setPointerCapture',
						'lostpointercapture',
						'window blur drag cancellation',
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
						'src-tauri/src/lib.rs ShellFeatureProbe.mica_supported',
						'src-tauri/src/lib.rs current_shell_features()',
						'src-tauri/src/lib.rs mica_supported: cfg!(target_os = "windows")'
					],
					adapterEvidence: [
						'data-window-effect="mica"',
						'data-window-material="windows-11-mica"',
						'set-window-effect',
						'data-native-host-bridge-status'
					],
					boundary:
						'Browser-safe Mica styling is alpha evidence; real Effect.Mica application requires a native wrapper.'
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
						'The adapter emits report/progress semantics; native taskbar binding belongs to the optional desktop host.'
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
						'The PHP-hosted shell proves the gesture/event seam; native drag and maximize require a registered host controller.'
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
						'macos-material-host-policy',
						'source-observed-macos-host-scaffold',
						'macos-native-vibrancy-unverified',
						'data-macos-chrome',
						'data-native-platform'
					],
					boundary:
						'The bridge source proves macOS host/plugin scaffolding and shared window-effects permission; real native material remains host-owned and unverified until wrapper smoke.'
				}
			]
		},
		nativeVisualMatrix: {
			marker: 'native-visual-matrix',
			rows: [
				'windows-mica-visual-row',
				'macos-traffic-light-row',
				'macos-vibrancy-visual-row',
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
				'macos-vibrancy-host-policy',
				'--window-wash-inactive'
			],
			proofUse:
				'Keeps Windows Mica, macOS traffic-light cadence, source-observed macOS material host policy, unverified native macOS vibrancy, Windows caption controls, UltraGear theme tokens, and browser fallback status tied to concrete adapter markers and report surfaces.'
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
					'macOS vibrancy host policy',
					'data-window-effect',
					'data-native-platform',
					'data-window-control',
					'native-window-action',
					'progressReportHandoff',
					'macos-vibrancy-visual-row',
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
			'The adapter route provides browser-safe visual/reporting contracts for Windows 11 Mica, macOS-style chrome rhythm, and source-observed macOS material host policy.',
			'Real macOS vibrancy/material effects remain host-owned until a wrapper proves native application without browser fallback.'
		],
		chromeStateMarkers: [
			'data-window-chrome-state',
			'data-window-chrome-state="mica-active"',
			'transparent-webview-material-boundary',
			'data-transparent-webview-material-boundary="host-owned"'
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

export const alphaBridgeChromeStateReuseEvidence = {
	borrowedCues: [
		'windowChromeState',
		'mica-active',
		'mica-inactive',
		'plain',
		'webview.setBackgroundColor([0, 0, 0, 0])',
	],
	adapterEvidence: [
		'src/lib/alpha-readiness-html.ts data-window-chrome-state',
		'src/lib/alpha-readiness-html.ts data-window-chrome-state="mica-active"',
		'src/lib/alpha-readiness-html.ts data-transparent-webview-material-boundary',
		'src/lib/alpha-readiness-html.ts data-transparent-webview-material-boundary="host-owned"',
		'src/lib/alpha-readiness-svg.ts data-window-chrome-state',
		'src/lib/alpha-readiness-svg.ts transparent-webview-material-boundary',
	],
	boundary:
		'Chrome-state reuse is a compatibility signal only; PHP adapter output cannot claim OS-native material effects without the desktop host proving the transparent webview and window effect path.',
} as const;
