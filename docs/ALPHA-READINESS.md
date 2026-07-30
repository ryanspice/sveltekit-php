# SvelteKit PHP 1.0.2-alpha readiness track

This document defines the current alpha-facing product surface for the adapter.

## Current position

The package metadata is now set to `1.0.2-alpha.0`. Keep it there only while `bun run alpha:gate` remains green from the current checkout and before any publish/tag action.

SemVer orders `alpha` before `rc`. In this repo, the alpha track is being used as the broader product-hardening milestone: runtime correctness plus operator-facing reporting, native-styled presentation, and community signal mapping.

## Bridge reuse boundary

The referenced implementation source is:

`B:\Dev\GPTLIGHTINGSTRENGTHTEST\lg-ultragear-bridge`

Reusable patterns adopted in this repo:

- `src/app.ts`: Mica/material intent through `applyWindowChrome`, `Effect.Mica`, `win.setEffects`, `syncWindowProgress`, `win.setProgressBar`, and `ProgressBarStatus` task/progress vocabulary.
- `src/lib/bridge-ui/shell/BridgeShell.svelte`: desktop-window containment, rounded frame behavior, and material wash layering.
- `src/lib/bridge-ui/shell/BridgeTopbar.svelte`: native titlebar rhythm and drag-safe interaction model.
- `src/lib/bridge-ui/pages/ValidationView.svelte`: structured JSON report preview/download pattern and readiness checklist framing.

Adapter-side reusable shell components:

- `src/lib/components/native-shell/NativeWindowShell.svelte`: browser-safe Mica/acrylic frame, material wash, dark-mode fallback, mobile maximized behavior.
- `src/lib/components/native-shell/NativeTitlebar.svelte`: macOS traffic-light rhythm, Windows caption-chip affordances, pointer-threshold drag semantics, double-click maximize semantics, and `data-window-drag` / `data-no-window-drag` boundary markers for future native hosts.
- `src/lib/components/native-shell/NativeHostBridgeStatus.svelte`: live reviewer panel for optional native host registration, browser fallback state, and recent host command history.
- `src/lib/native-shell/native-host-event-bridge.ts`: optional native host controller bridge for `native-window-action` events, with `window.__SVELTEKIT_PHP_NATIVE_HOST__` handlers and `window.__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__` fallback evidence.

Patterns intentionally not imported:

- Tauri APIs.
- Native window calls.
- Hardware/runtime probe commands.
- UltraGear-specific state stores.

This adapter demo must remain browser/PHP-host safe. Native-window behavior belongs in a host app, not inside the adapter runtime.

The development-only adapter entrypoints are guarded separately from the production adapter. `adapter/src/dev-adapter.ts` and `adapter/src/vite-dev-adapter.ts` emit deterministic 503 PHP stubs for local/test usage, reject production or CI usage by default, and require `SK_PHP_ALLOW_DEV_ADAPTER=true` for an explicit smoke-test override.

The production adapter also exposes a non-secret `event.platform.php` object through SvelteKit `emulate().platform`. It is capability-oriented only: adapter version, selected mode, prerender state, configured base path, output options, and runtime flags are visible in dev/build/preview, while environment values, deploy credentials, and build-identity marker payloads stay out of the platform surface.

The bridge reuse report also records source cues from the referenced checkout:

- `Effect.Mica`, `win.setEffects`, `syncWindowProgress`, and `win.setProgressBar` from `src/app.ts`.
- `app-window`, `app-window.maximized`, `:root[data-window-effect="mica"]`, inactive focus styling, `theme-ultragear`, `--surface-chrome`, and the 1180px/860px responsive shell breakpoints from `BridgeShell.svelte`.
- `DRAG_START_THRESHOLD_PX`, `[data-no-window-drag]`, `pointerdown`, `setPointerCapture`, `lostpointercapture`, window-blur cancellation, `start-dragging`, and `maximize` from `BridgeTopbar.svelte`.
- `reportJson`, `reportUrl`, `Download report JSON`, and `Structured report preview` from `ValidationView.svelte`.

Those cues are intentionally translated into browser-safe alpha evidence. They do not import the native bridge runtime into the PHP adapter.

`alpha-bridge-reuse.json` now includes `ultraGearParityContract`, a source-cue-to-adapter-evidence map that ties `src/app.ts` `applyWindowChrome`, `Effect.Mica`, `win.setEffects`, `syncWindowProgress`, `win.setProgressBar`, `ProgressBarStatus`, `BridgeShell.svelte` `app-window`, `app-window.maximized`, inactive Mica focus styling, 1180px/860px responsive breakpoints, `BridgeTopbar.svelte` `DRAG_START_THRESHOLD_PX`, `setPointerCapture`, `lostpointercapture`, `dispatch("start-dragging")`, `dispatch("maximize")`, `Download report JSON`, and `Structured report preview` back to local DOM markers, host-event seams, report graphics, CSVs, manifests, and reviewer handoff endpoints. This keeps UltraGear reuse auditable while preserving the PHP adapter boundary.

`alpha-bridge-reuse.json` and `alpha-native-host-contract.json` now also name the reusable UltraGear helper package at `packages/desktop-shell-ui/src/index.ts` / `@scriptgpt/desktop-shell-ui`. The alpha native-host guide includes an `installSvelteKitPhpNativeHost` recipe that maps `window.__SVELTEKIT_PHP_NATIVE_HOST__` to `enableMicaWindowChrome`, `syncTaskbarProgress`, `toggleWindowMaximize`, `bindColorSchemeWatcher`, `prefersDarkMode`, `window.matchMedia("(prefers-color-scheme: dark)")`, `Effect.Mica`, `ProgressBarStatus.Indeterminate`, `ProgressBarStatus.Normal`, and `ProgressBarStatus.None` while keeping `@tauri-apps/api` and native-window calls out of the PHP adapter runtime.

`native-host-compatibility-matrix` is now a required alpha evidence marker. It records the source-observed compatibility rows for Windows Mica effects, taskbar progress reporting, and native titlebar drag/maximize behavior, using `packages/ultragear-widget-ui/src/app.ts` cues such as `features.micaSupported`, `enableMicaWindowChrome(win)`, `syncTaskbarProgress(win, { saveInFlight, refreshInFlight, hasQueuedSave })`, `toggleDesktopWindowMaximize(win)`, and `win.startDragging()`, plus the `src-tauri/src/lib.rs` cues `ShellFeatureProbe.mica_supported`, `current_shell_features()`, and `cfg!(target_os = "windows")`. This is source-parity evidence only; stable OS-native claims still require a real host wrapper smoke.

`alpha-bridge-reuse.json` also carries `lg-ultragear-native-platform-provenance`, which names the exact UltraGear source files behind Windows Mica (`src/app.ts`, `BridgeShell.svelte`, and `theme.css`), shell material (`app-window`, inactive-focus Mica, `theme-ultragear`, and responsive breakpoints), macOS-style chrome rhythm (`BridgeTopbar.svelte` caption controls), host-owned window actions (`dragBlockSelector`, `setPointerCapture`, and `win.startDragging`), and structured report/progress handoff (`ValidationView.svelte`, `reportJson`, and `reportUrl`).

Adapter-side cue markers are also part of the bridge reuse contract:

- `NativeWindowShell.svelte` exposes `data-native-shell`, `data-native-shell-theme`, `data-native-window-frame`, `data-window-effect`, `data-window-focused`, and `window-frame--maximized`.
- `NativeTitlebar.svelte` exposes `data-native-titlebar`, `data-native-platform`, `data-window-drag`, `data-no-window-drag`, `data-drag-start-threshold-px`, `data-window-control-group`, and `data-window-control`.

These markers are inert in the PHP/browser demo, but they preserve the native-host boundary for a future wrapper.

`NativeTitlebar.svelte` also dispatches a bubbled `native-window-action` custom event with `start-dragging` and `toggle-maximize` actions. This mirrors the UltraGear `BridgeTopbar.svelte` pointer-threshold behavior while keeping the adapter free of Tauri/native-window imports. A future host wrapper can listen for that event and bind it to real window commands.

`NativeWindowShell.svelte` mounts `native-host-event-bridge.ts` on the client. In a desktop wrapper, the host can set `window.__SVELTEKIT_PHP_NATIVE_HOST__ = { startDragging, toggleMaximize, setWindowEffect, setProgress, clearProgress, reportReady }`. In a normal browser/PHP-hosted demo, the bridge records deterministic `browser-fallback` results in `window.__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__` instead of silently dropping the titlebar, Mica effect, progress, or report-ready commands.

`NativeHostBridgeStatus.svelte` exposes that seam on `/alpha-readiness` with `data-native-host-bridge-status`, `data-native-host-handoff-controls`, a controller availability callout, clickable Mica/progress/report handoff controls, and recent command history. The controls emit `set-window-effect`, `set-progress`, `clear-progress`, and `report-ready` as browser-safe `native-window-action` events. This gives reviewers a live signal that the PHP/browser surface is host-ready while still keeping native behavior optional.

The native-host bridge now also exposes a deterministic `native-host-wrapper-probe` sequence from `src/lib/native-shell/native-host-event-bridge.ts`. Optional Windows/macOS wrappers can dispatch the probe details to cover Mica, drag, maximize, indeterminate progress, normal progress, clear-progress, and report-ready handoff while checking the expected `@scriptgpt/desktop-shell-ui` helper mapping and `TaskbarProgressState` translation. This keeps wrapper smoke steps tied to the same UltraGear-derived source helpers as the live alpha page.

`src/lib/alpha-native-host-wrapper-smoke.ts`, `/alpha-readiness/native-host-wrapper-smoke.json`, and `report/alpha-native-host-wrapper-smoke.json` turn that probe into a deterministic wrapper-smoke artifact. The smoke status remains `realHostVerified: false` until an actual native wrapper runs it; this repo only guarantees command mapping, progress-state translation, and no native API imports in the PHP/browser runtime. Use `bun run alpha:native:smoke` when refreshing that handoff artifact.

## Alpha readiness surface

The route `/alpha-readiness` is now the visible report surface for alpha reviewers. It includes:

- Windows 11 Mica-style browser fallback.
- macOS traffic-light window rhythm.
- Live native-host handoff controls for `set-window-effect`, `set-progress`, `clear-progress`, and `report-ready`.
- A no-hydration prerender proof link to `/alpha-readiness/no-hydration`, where `csr-disabled-prerender-contract` and `theme-stable-ssr-html` prove blog/static-theme pages can ship prerendered HTML without client hydration repaint.
- A live required alpha evidence panel with `data-required-alpha-evidence`, `requiredEvidence`, `required-alpha-evidence`, and the proof markers required before `1.0.2-alpha` can be treated as alpha-reviewable.
- A live UltraGear source-parity panel with `data-ultragear-source-parity` and `ultraGearParityContract` markers.
- A live desktop-shell helper binding panel and native shell marker set with `data-desktop-shell-ui-binding`, `desktopShellUiBinding`, `@scriptgpt/desktop-shell-ui`, `installSvelteKitPhpNativeHost`, `enableMicaWindowChrome`, `syncTaskbarProgress`, `toggleWindowMaximize`, `bindColorSchemeWatcher`, `prefersDarkMode`, `data-drag-block-selector`, `caption-button`, and indeterminate `progressStatus` markers.
- A live community keyword-search graph panel with `data-community-keyword-search-graph`, `keywordSearchGraph`, `source-to-keyword-edge`, `analytics-linked-keyword-graph`, `community-analytics-freshness-contract`, `curated-signal-score`, `collected-demand-score`, and `directional-community-signal` markers.
- Runtime, deployment, native UX, and community analytics readiness cards.
- CSS-only score rings and bar graphics.
- Downloadable `sveltekit-php-alpha-readiness-report.json`.
- Runtime standalone HTML report endpoint at `/alpha-readiness/report.html`.
- Runtime Markdown report endpoint at `/alpha-readiness/report.md`.
- Runtime alpha release-notes endpoint at `/alpha-readiness/release-notes.md`.
- Runtime SVG graphic endpoint at `/alpha-readiness/report.svg`.
- Runtime community source-map SVG endpoint at `/alpha-readiness/community-source-map.svg`.
- Runtime release-manifest endpoint at `/alpha-readiness/release-manifest.json`.
- Runtime gate-matrix endpoint at `/alpha-readiness/gate-matrix.json`.
- Runtime evidence-index endpoint at `/alpha-readiness/evidence-index.json`.
- Runtime package-contract endpoint at `/alpha-readiness/package-contract.json`.
- Runtime native-host contract endpoint at `/alpha-readiness/native-host-contract.json`.
- Runtime native-host binding guide endpoint at `/alpha-readiness/native-host-guide.md`.
- Runtime hosted-smoke checklist endpoint at `/alpha-readiness/hosted-smoke-checklist.json`.
- Runtime UltraGear bridge-reuse endpoint at `/alpha-readiness/bridge-reuse.json`.
- Runtime alpha reviewer-index endpoint at `/alpha-readiness/review-index.md`.
- Runtime community-signal JSON endpoint at `/alpha-readiness/community-signals.json`.
- Runtime community analytics Markdown endpoint at `/alpha-readiness/community-analytics.md`.
- Runtime community research-pack endpoint at `/alpha-readiness/community-research-pack.json`.
- Runtime CSV endpoints at `/alpha-readiness/readiness.csv`, `/alpha-readiness/community-signals.csv`, and `/alpha-readiness/community-sources.csv`.
- Search links into open-source communities and package ecosystems.
- A live community evidence ledger that shows provider coverage, evidence-kind coverage, collection-risk coverage, and the first prioritized open-source collection sources from the shared research pack.

The same canonical data model is exported at `/alpha-readiness/report.json`, the no-hydration prerender fixture is exposed at `/alpha-readiness/no-hydration`, the standalone HTML report is exposed at `/alpha-readiness/report.html`, the Markdown report is exposed at `/alpha-readiness/report.md`, alpha release notes are exposed at `/alpha-readiness/release-notes.md`, the portable release-card graphic is exposed at `/alpha-readiness/report.svg`, the community source-map graphic is exposed at `/alpha-readiness/community-source-map.svg`, the release manifest is exposed at `/alpha-readiness/release-manifest.json`, the gate matrix is exposed at `/alpha-readiness/gate-matrix.json`, the endpoint/artifact evidence index is exposed at `/alpha-readiness/evidence-index.json`, the package contract is exposed at `/alpha-readiness/package-contract.json`, the native-host contract is exposed at `/alpha-readiness/native-host-contract.json`, the native-host binding guide is exposed at `/alpha-readiness/native-host-guide.md`, the deterministic native wrapper smoke contract is exposed at `/alpha-readiness/native-host-wrapper-smoke.json`, the hosted-smoke checklist is exposed at `/alpha-readiness/hosted-smoke-checklist.json`, the UltraGear reuse map is exposed at `/alpha-readiness/bridge-reuse.json`, the alpha reviewer index is exposed at `/alpha-readiness/review-index.md`, the keyword/search-link map is exposed at `/alpha-readiness/community-signals.json`, the community analytics handoff is exposed at `/alpha-readiness/community-analytics.md`, the research handoff pack is exposed at `/alpha-readiness/community-research-pack.json`, and spreadsheet-friendly CSV endpoints are exposed at `/alpha-readiness/readiness.csv`, `/alpha-readiness/community-signals.csv`, and `/alpha-readiness/community-sources.csv`. The canonical report JSON now carries `releasePolicy.requiredEvidence`, including `csr-disabled-prerender-contract`, so the required alpha proof boundary starts at `/alpha-readiness/report.json` and flows into the manifest, evidence index, package contract, live page, reports, graphics, hosted smoke checklist, and remote smoke. The page and endpoints use shared modules under `src/lib`, so visible report cards, no-hydration fixture proof, HTML, Markdown, release notes, graphics, manifest data, gate evidence, evidence-index data, package contract data, native-host boundary data, native-host binding guide data, native-wrapper smoke data, hosted-smoke checklist data, bridge-reuse evidence, review-index handoff, community signals, community analytics handoffs, research-pack data, CSV rows, and JSON output stay aligned.

For release notes, PR review, or offline handoff, generate local report artifacts:

```bash
bun run alpha:report:full
bun run verify:alpha
```

This writes:

- `report/alpha-community-analytics.json`
- `report/alpha-community-analytics.md`
- `report/alpha-remote-smoke.json` when `bun run alpha:remote:smoke` has run
- `report/alpha-readiness.json`
- `report/alpha-readiness.full.json`
- `report/alpha-readiness.md`
- `report/alpha-readiness.html`
- `report/alpha-readiness.svg`
- `report/alpha-community-source-map.svg`
- `report/alpha-release-notes.md`
- `report/alpha-gate-matrix.json`
- `report/alpha-evidence-index.json`
- `report/alpha-package-contract.json`
- `report/alpha-native-host-contract.json`
- `report/alpha-native-host-guide.md`
- `report/alpha-hosted-smoke-checklist.json`
- `report/alpha-readiness.csv`
- `report/alpha-bridge-reuse.json`
- `report/alpha-review-index.md`
- `report/alpha-community-signals.csv`
- `report/alpha-community-sources.csv`
- `report/alpha-community-research-pack.json`
- `report/alpha-release-manifest.json`

The community analytics collector queries supported public JSON endpoints for GitHub, npm, Packagist, Stack Overflow, and Reddit. Each collected source records `sourceHost`, `mode`, `endpoint`, `evidenceKind`, `collectionRisk`, `collectionPriority`, `proofUse`, `reviewerAction`, and `collectorNote` so the generated JSON can be compared against the runtime research pack. Sources without a stable public JSON endpoint remain manual research links. Public APIs can rate-limit or omit data, so the output is directional alpha evidence rather than product telemetry.

The analytics freshness contract is explicit: `community-analytics-freshness-contract` treats collected community analytics as `directional-community-signal` evidence with `maxAgeHours: 168`. Refresh with `bun run alpha:analytics` or the full `bun run alpha:report:full` pipeline, then compare `report/alpha-community-analytics.json`, `report/alpha-community-analytics.md`, `/alpha-readiness/community-analytics.md`, and `/alpha-readiness/community-research-pack.json` before using the numbers in an alpha review.

`alpha-community-analytics.md` and `/alpha-readiness/community-analytics.md` provide a Markdown handoff for collection commands, source coverage plan, keyword intent, curated score, collected demand score when available, source status, source host, open-source research links, exact public API endpoint URLs for supported sources, proof use, reviewer action, and source-specific collector notes. The runtime endpoint does not call public APIs; it stays deterministic and documents the local/CI collection path.

Local `alpha:report:full` runs `alpha:remote:placeholder` before export. That writes a skipped `report/alpha-remote-smoke.json` unless a later hosted smoke overwrites it, making the hosted evidence lane explicit in every generated report.

The HTML, Markdown, and SVG readiness exports embed `alpha-community-analytics.json` when it exists. The hosted `/alpha-readiness/report.html` and `/alpha-readiness/report.md` endpoints use the same shared renderers with runtime-safe canonical readiness data. The HTML export keeps the same native-shell/Mica-inspired report language and includes CSS-only charts plus community research links. The HTML, Markdown, release-notes, and SVG exports also surface the evidence trust model so reviewers can distinguish deterministic source-generated artifacts, directional community signals, deterministic runtime endpoints, and hosted-smoke proof that requires `ALPHA_SMOKE_BASE_URL`. The HTML and Markdown reports now include the native-host bridge status contract, `UltraGear source parity`, `data-ultragear-source-parity`, `ultraGearParityContract`, `Reusable UltraGear desktop shell binding`, `data-desktop-shell-ui-binding`, `@scriptgpt/desktop-shell-ui`, `desktopShellUiBinding`, `enableMicaWindowChrome`, `syncTaskbarProgress`, `toggleWindowMaximize`, `bindColorSchemeWatcher`, `prefersDarkMode`, `Community keyword search graph`, `data-community-keyword-search-graph`, `keywordSearchGraph`, `source-to-keyword-edge`, and the community evidence coverage ledger, while the SVG graphic includes compact native-host, helper-package binding, community-ledger, and proof-ledger markers for PR/release-note previews. The SVG export is a portable release-card graphic with readiness bars, community signal bubbles, trust-model label, native-host bridge marker, `@scriptgpt/desktop-shell-ui` helper provenance, community-ledger marker, `proofLedger` blocker metadata, and hosted-smoke status for PRs, release notes, and handoffs. `alpha-community-source-map.svg` and `/alpha-readiness/community-source-map.svg` add a second portable graphic that maps each keyword to supported public API lanes, manual research links, source-to-keyword edges, evidence kind, and collection risk. The HTML and Markdown reports link this source-map graphic directly so reviewers can audit the open-source analytics lanes without opening raw CSV first.

The SVG release-card graphic also carries `data-required-alpha-evidence`, `requiredEvidence`, and `required-alpha-evidence` markers so PR screenshots and release-note previews preserve the same alpha proof boundary as package metadata, the package contract, release manifest, evidence index, hosted smoke checklist, and remote smoke.

`report/alpha-release-manifest.json` and `/alpha-readiness/release-manifest.json` inventory the release evidence bundle: generated artifacts, runtime endpoints, local/hosted gate commands, community analytics status, hosted smoke status, current limitations, and the trust model for each evidence class. Use it as the machine-readable handoff index for CI uploads, release notes, or PR evidence.

The manifest also carries `nativePlatformProvenance` with `lg-ultragear-native-platform-provenance`, keeping the Mica/effects cues (`Effect.Mica`, `win.setEffects`, `app-window.maximized`, `--window-bg-mica`, `--window-bg-inactive`, and `--window-wash-inactive`), macOS-style control cues (`data-native-platform` and `data-window-control-group`), drag/window action cues (`dragBlockSelector`, `setPointerCapture`, `lostpointercapture`, and `win.startDragging`), and report/progress handoff cues (`win.setProgressBar`, `reportJson`, and `reportUrl`) visible in the release evidence bundle.

Package metadata mirrors the same policy: `package.json` uses `version: 1.0.2-alpha.0`, `publishConfig.tag: alpha`, and `sveltekitPhpReleasePolicy` with `alpha-over-rc-release-policy`, `rank: above-rc`, disallowed `latest`, `rc`, and `stable` dist-tags, plus `requiredEvidence` for native host binding guide, `csr-disabled-prerender-contract`, native host wrapper smoke, Windows 11 Mica browser-safe shell, macOS-style titlebar rhythm, report graphics, community keyword graph, analytics freshness contract, adapter platform emulation, and hosted PHP smoke proof. `alpha-package-contract.json` exposes that package policy so release-prep and hosted smoke can reject accidental `latest`/RC/stable drift or missing alpha evidence requirements before any publish.

The manifest also carries `releasePolicy` with `alpha-over-rc-release-policy`, `channel: alpha`, `track: 1.0.2-alpha`, `rank: above-rc`, explicit `rc` / `stable` / `latest` disallowed channels, and the same `requiredEvidence` list. This keeps the release target aligned with `1.0.2-alpha.0` and prevents alpha evidence from being treated as an RC or stable `latest` handoff before the native host guide, no-hydration prerender proof, native wrapper smoke, native-styled graphics, community freshness contract, and hosted PHP smoke evidence exist.

The manifest and full reports also carry `proofLedger`. It marks which evidence is already alpha-reviewable (`alpha-over-rc-release-policy`, `native-visual-matrix`, `analytics-linked-keyword-graph`) and which evidence is still a blocker before stable (`alpha-runtime-gate-ledger`, `hosted-php-smoke-proof-required`). This is the review boundary between "ready to evaluate as alpha" and "not yet proven as stable 1.0.2".

The manifest also includes `evidenceSurfaces` for the live `/alpha-readiness` reviewer surface. `nativeChromeVisualContract` records `data-native-shell-theme`, `data-window-effect`, `data-window-effect="mica"`, `data-native-platform`, `data-window-control`, `Windows 11 Mica`, `macOS traffic lights`, `native-window-action`, `set-window-effect`, and `data-native-host-handoff-controls`; `ultraGearSourceParity` records `ultraGearParityContract`, `applyWindowChrome`, `syncWindowProgress`, `DRAG_START_THRESHOLD_PX`, `dispatch("start-dragging")`, and `Structured report preview`; `nativeHostBridgeStatus` records `data-native-host-bridge-status`, `data-native-host-handoff-controls`, `window.__SVELTEKIT_PHP_NATIVE_HOST__`, `window.__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__`, `browser-fallback`, `set-window-effect`, `set-progress`, `clear-progress`, `report-ready`, `setWindowEffect`, `setProgress`, `clearProgress`, and `reportReady`; `nativeHostBindingGuide` records `/alpha-readiness/native-host-guide.md`, `native host binding guide`, the optional controller handlers, and the LG UltraGear Mica/progress/report cues a desktop wrapper should bind; `nativeHostWrapperSmoke` records `/alpha-readiness/native-host-wrapper-smoke.json`, `native-host-wrapper-smoke`, `deterministic-host-wrapper-handoff`, `realHostVerified`, `noNativeApiBoundary`, `TaskbarProgressState`, and `window.__SVELTEKIT_PHP_NATIVE_HOST__`; `communityEvidenceLedger` records `Community evidence coverage ledger`, provider coverage, evidence-kind coverage, collection-risk coverage, and the prioritized open-source analytics source ledger; `communityKeywordSearchGraph` records the keyword-to-source graph linking `keywordSearchGraph`, `keyword-search-graph`, `analytics-linked-keyword-graph`, `source-to-keyword-edge`, supported API lanes, manual research lanes, curated signal scores, collected demand-score handoff fields, directional community-signal trust metadata, source hosts, and public endpoint markers.

The `realHostPermissionChecklist` surface records `lg-ultragear-host-permission-checklist`, `src-tauri/capabilities/default.json`, `hostPermissionCues`, `requiredHostPermission`, and the Tauri `core:window:*` permissions required before real OS-native Mica/taskbar/drag/maximize claims can be promoted.

The evidence index also carries `requiredEvidence` and a `required-alpha-evidence` live surface for `native-host-binding-guide`, `real-host-permission-checklist`, `native-host-compatibility-matrix`, `csr-disabled-prerender-contract`, `native-host-wrapper-smoke`, `windows-11-mica-browser-safe-shell`, `macos-style-native-titlebar-rhythm`, `alpha-readiness-report-graphics`, `community-keyword-search-graph`, `community-analytics-freshness-contract`, `adapter-platform-emulation`, and `hosted-php-smoke-proof`. It also carries `liveEvidenceSurfaces` for `adapter-platform-emulation`, `no-hydration-prerender-fixture`, `native-host-bridge-status`, `real-host-permission-checklist`, `native-host-compatibility-matrix`, `native-host-wrapper-smoke`, `ultragear-source-parity`, `community-evidence-coverage-ledger`, and `community-keyword-search-graph`, mirroring the release manifest `evidenceSurfaces` so CI/reviewer tooling can prove the adapter platform surface, no-hydration prerender contract, live native-host, real host permission boundary, source-observed native host compatibility matrix, deterministic wrapper smoke boundary, UltraGear source-parity, community-ledger, and keyword-to-source graph surfaces from machine-readable metadata.

The manifest trust model separates:

- `deterministic-local-artifact`: generated from source-controlled alpha modules by `bun run alpha:report:full`.
- `directional-community-signal`: collected from public open-source/community JSON endpoints by `bun run alpha:analytics`; counts are rate-limited and incomplete.
- `requires-alpha-smoke-base-url-for-pass-evidence`: proves hosted behavior only after `ALPHA_SMOKE_BASE_URL` points at a real PHP deployment and hosted smoke runs.
- `deterministic-runtime-evidence`: served by runtime endpoints without live community API calls.

`alpha-bridge-reuse.json` and `/alpha-readiness/bridge-reuse.json` inventory how the referenced UltraGear implementation is reused: source patterns, adapter-side implementation files, referenced bridge components, and boundaries that keep Tauri/native-window APIs out of the PHP adapter runtime.

The bridge reuse inventory also includes `src/lib/native-shell/native-host-event-bridge.ts`, `__SVELTEKIT_PHP_NATIVE_HOST__`, `__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__`, `startDragging`, `toggleMaximize`, `setWindowEffect`, `setProgress`, `clearProgress`, `reportReady`, `set-window-effect`, `set-progress`, `clear-progress`, `report-ready`, and `browser-fallback` cues so reviewers can verify that native titlebar, Mica effect, progress, and report-ready events have a concrete host seam and a safe browser fallback.

`alpha-review-index.md` and `/alpha-readiness/review-index.md` are the human reviewer shortcut for the alpha end state. They map native styling, full reports, graphics, keyword searches, community analytics, and hosted PHP proof to concrete runtime links, generated artifacts, and required commands.

`alpha-release-notes.md` and `/alpha-readiness/release-notes.md` provide the short human-facing release handoff: release call, ready/watch/blocked areas, runtime evidence endpoints, required gate commands, and known limitations.

`alpha-gate-matrix.json` and `/alpha-readiness/gate-matrix.json` map local and hosted release commands to the evidence they prove, the proof stage they belong to, the artifacts they should produce, and the remaining hosted proof blocker. The gate matrix now carries `requiredEvidence`, a `required-alpha-evidence` gate, a `no-hydration-prerender-fixture` hosted gate, and `release-policy-evidence-boundary` proof stage so the native host guide, no-hydration prerender contract, native wrapper smoke, Windows 11 Mica browser-safe shell, macOS-style titlebar rhythm, report graphics, community keyword graph, analytics freshness contract, adapter platform emulation, and hosted PHP smoke proof requirements are release-gate evidence rather than just documentation. This is the machine-readable checklist for deciding whether the alpha bundle is release-ready.

The gate matrix includes `live-evidence-surfaces` to keep these markers synchronized across the live page, manifest, evidence index, hosted smoke checklist, release notes, and reviewer index.

The `report-bundle` and `live-evidence-surfaces` gates also require the desktop-shell helper binding markers: `data-desktop-shell-ui-binding`, `desktopShellUiBinding`, `@scriptgpt/desktop-shell-ui`, `installSvelteKitPhpNativeHost`, `enableMicaWindowChrome`, `syncTaskbarProgress`, `toggleWindowMaximize`, `bindColorSchemeWatcher`, `prefersDarkMode`, `data-drag-block-selector`, `caption-button`, `progressStatus`, and `indeterminate`. They also require the community analytics linkage markers `sourceToKeywordEdge`, `analyticsLinkageMarker`, `weightedDemandScore`, `freshnessMaxAgeHours`, `trustBoundary`, and `manualReviewRequired`. This keeps the UltraGear helper-package path, browser-safe OS color-scheme handling, blur-safe titlebar drag boundary, caption-button action seam, taskbar busy-progress cue, and open-source keyword-to-source analytics contract visible in the same machine-readable gate evidence that reviewers use for report artifacts and hosted runtime surfaces.

The generated PHP router templates now share the same `router_safe_path`, `router_mime_type`, and `router_send_file` helpers across `php-static` and `js-ssr` modes. The root `router.php` remains a thin built-in-server compatibility entrypoint that delegates to generated `build/router.php`, so local manual serving uses the same path-safety and base-path behavior as adapter output.

`tests/unit/router-parity.test.ts` protects this boundary by asserting that root `router.php` only delegates to the generated router inside the document root, that both generated router modes include the shared hardening helpers, and that mode-specific static file serving stays behind `router_safe_path`.

`tests/unit/php-handlers.test.ts` protects route-handler compatibility by checking canonical handlers, legacy `sk_*_page_server_*` / `sk_*_layout_server_*` handlers, legacy endpoint method handlers, fail-fast unsupported handler names, and every checked-in PHP route handler under `src/routes`.

`alpha-evidence-index.json` and `/alpha-readiness/evidence-index.json` list every hosted evidence endpoint with media type, purpose, and matching generated artifact where applicable. Use it as the lookup table for CI artifact uploads, PR review links, and hosted smoke expectations.

`alpha-package-contract.json` and `/alpha-readiness/package-contract.json` document the alpha npm package surface: `sveltekit-php/adapter`, expected packed files, consumer-smoke command, release-prep command, strict artifact-sync command, deploy-precheck command, native host binding guide proof, native wrapper smoke proof, and the boundary that report endpoints are release evidence rather than package exports. It also records that strict artifact sync is release safety evidence rather than a publish operation, that deploy precheck validates environment shape without connecting, uploading, or deploying, that `/alpha-readiness/native-host-guide.md` is wrapper guidance rather than a new npm API, and that `/alpha-readiness/native-host-wrapper-smoke.json` is deterministic handoff evidence with `realHostVerified: false` and `noNativeApiBoundary` until a real Windows/macOS wrapper supplies OS-native proof.

`alpha-native-host-contract.json` and `/alpha-readiness/native-host-contract.json` document the native wrapper seam: required DOM markers, the visual snapshot contract for `/alpha-readiness` and `/alpha-readiness/report.svg`, `native-window-action` host events, the `window.__SVELTEKIT_PHP_NATIVE_HOST__` controller contract, the `window.__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__` fallback history, Windows 11 Mica/macOS titlebar responsibilities, live `data-native-host-handoff-controls`, report-handoff hooks, and the no-Tauri/no-native-window-call boundary for the PHP adapter runtime.

The native host contract also exposes `nativeVisualMatrix` with `native-visual-matrix`, `windows-mica-visual-row`, `macos-traffic-light-row`, `windows-caption-control-row`, `ultragear-theme-row`, and `browser-fallback-visual-row` markers. The live `/alpha-readiness` page mirrors that as `data-native-visual-matrix`, so Windows Mica, macOS traffic-light controls, Windows caption controls, UltraGear theme reuse, and browser fallback styling remain reviewable without claiming the PHP adapter itself owns native-window APIs.

`alpha-hosted-smoke-checklist.json` and `/alpha-readiness/hosted-smoke-checklist.json` document the external proof path: required smoke environment variables, local/hosted commands, covered endpoints, traversal probes, proof artifact, helper-package native-shell markers, and the rule for converting hosted deployment evidence from skipped to passed.

The hosted checklist also records content expectations for the evidence endpoints. Hosted smoke should not only fetch the URLs; it should confirm that the deployed native-host contract includes `native-window-action`, `start-dragging`, `toggle-maximize`, `__SVELTEKIT_PHP_NATIVE_HOST__`, `__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__`, `browser-fallback`, `theme-ultragear`, `data-window-control`, `visualSnapshotContract`, `nativeVisualMatrix`, `native-visual-matrix`, `windows-mica-visual-row`, and `macos-traffic-light-row`; the bridge-reuse inventory includes `pointerdown`, `native-window-action`, `native-host-event-bridge.ts`, `__SVELTEKIT_PHP_NATIVE_HOST__`, `ultraGearParityContract`, `applyWindowChrome`, `syncWindowProgress`, `DRAG_START_THRESHOLD_PX`, `nativeVisualMatrix`, and `Structured report preview`; the community source-map graphic includes `keyword-search-graph`, `analytics-linked-keyword-graph`, `source-to-keyword-edge`, `supported-api-lanes`, `manual-research-lanes`, `curated-signal-score`, `collected-demand-score`, and `directional-community-signal`; the community analytics Markdown includes source coverage, evidence-kind, collection-risk, reviewer-action, and collector-note language; the research pack includes provider/evidence/risk coverage, `collectionPlan`, and `keywordSearchGraph`; the sources CSV includes `evidence_kind`, `collection_risk`, `reviewer_action`, and `collector_note`; the release manifest includes `trustModel`, `proofStage`, `evidenceSurfaces`, `nativeChromeVisualContract`, `nativeVisualMatrix`, `ultraGearSourceParity`, `nativeHostBridgeStatus`, `communityKeywordSearchGraph`, `communityEvidenceLedger`, and directional community-signal trust metadata; the gate matrix includes `live-evidence-surfaces`, `live-runtime-surface-proof`, and artifact-sync gate language; the evidence index includes `liveEvidenceSurfaces`, `native-host-bridge-status`, `native-visual-matrix`, `ultragear-source-parity`, `community-evidence-coverage-ledger`, and `community-keyword-search-graph`; and the package contract includes `alpha:consumer:smoke`, `verify:artifacts`, `precheck:deploy`, `source-to-generated-bundle-check`, and `environment-preflight-check`.

Hosted content expectations now require the native platform provenance markers directly: `lg-ultragear-native-platform-provenance`, `Effect.Mica`, `win.setEffects`, `--window-bg-mica`, `--window-wash-inactive`, `data-native-platform`, `data-window-control-group`, `dragBlockSelector`, `data-drag-block-selector`, `caption-button`, `win.startDragging`, `win.setProgressBar`, `progressStatus`, `indeterminate`, `reportJson`, and `reportUrl`. Community analytics expectations also require `sourceToKeywordEdge`, `analyticsLinkageMarker`, `weightedDemandScore`, `freshnessMaxAgeHours`, `trustBoundary`, `manualReviewRequired`, `alpha-community-source-evidence-checklist`, `source-health-classification`, `releaseUse`, and `blockedOutcomePolicy` so keyword searches, source descriptors, freshness windows, directional trust boundaries, source-health classes, reviewer checklists, blocked-source policies, and collected demand scores stay linked. This prevents the UltraGear parity evidence and analytics evidence from drifting back to generic source names without the concrete Windows 11 Mica, macOS chrome, host-window action, taskbar busy-progress, report/progress, and open-source research cues.

The CSV exports are spreadsheet-friendly handoff files: `alpha-readiness.csv` and `/alpha-readiness/readiness.csv` list readiness areas with status, score, description, and gap, then append `proof-ledger` rows with `marker` and `evidence` columns for `alpha-over-rc-release-policy`, `native-visual-matrix`, `analytics-linked-keyword-graph`, `alpha-runtime-gate-ledger`, and `hosted-php-smoke-proof-required`, plus `required-evidence` rows for every `requiredEvidence` / `required-alpha-evidence` marker that defines the `1.0.2-alpha` proof boundary; `alpha-community-signals.csv` and `/alpha-readiness/community-signals.csv` list curated keyword metrics, collected demand score when available, `analytics-linked-keyword-graph`, `curated-signal-score`, `collected-demand-score`, `directional-community-signal`, and the open-source/community search links behind each signal; `alpha-community-sources.csv` and `/alpha-readiness/community-sources.csv` list each source with provider, source host, mode, evidence kind, collection risk, collection priority, endpoint, research link, proof use, reviewer action, and collector note.

`alpha-community-research-pack.json` and `/alpha-readiness/community-research-pack.json` group the keyword searches by source mode: supported public JSON APIs versus manual research links. Every source includes `sourceHost`, provider, evidence kind, collection risk, collection priority, proof use, reviewer action, and collector note; supported sources include the exact public API endpoint that `bun run alpha:analytics` will query, while manual sources keep their browser research link and `endpoint: null`. The pack also includes `keywordSearchGraph` with nodes for each alpha keyword and edges to every supported API endpoint or manual research link, tying the graphic, CSV, Markdown analytics handoff, source descriptors, curated signal scores, collected demand-score fields, the `community-analytics-freshness-contract`, and `directional-community-signal` trust model together. Its `community-analytics-graphic-linkage-contract` names the review path across `/alpha-readiness/community-source-map.svg`, `/alpha-readiness/community-analytics.md`, `/alpha-readiness/community-signals.csv`, and `/alpha-readiness/community-sources.csv`, so reviewers can prove the graphic, keyword searches, collected analytics, freshness boundary, and spreadsheet handoffs are linked. This gives reviewers a repeatable checklist for open-source demand/support research without pretending every community source is automatically collectible.

The research pack also includes a reviewer workflow: inspect the source-map graphic first, use `keywordSearchGraph` and `analytics-linked-keyword-graph` markers to trace each keyword to endpoints, manual links, curated signal scores, and collected demand-score handoff fields, check the `analyticsFreshnessContract` / `community-analytics-freshness-contract` metadata before trusting collected counts, run `alpha:analytics` only when fresh public-source counts are needed, compare curated scores against collected demand scores, and manually inspect Apache/Nginx/shared-host research links for routing fallback claims.

`bun run verify:alpha` fails if the source files, generated artifacts, native-shell bridge map, live `/alpha-readiness` parity/progress handoff/keyword graph/native visual matrix/proof ledger markers, generated analytics, package scripts, trust-model metadata, proof-stage metadata, community source descriptors, or reviewer-facing evidence indexes needed for the alpha reporting track are missing. The live page and `report.svg` must expose `data-progress-report-handoff`, `progressReportHandoff`, `statusMapping`, `ProgressBarStatus.Indeterminate`, `ProgressBarStatus.None`, `report-ready`, `data-native-visual-matrix`, `native-visual-matrix`, `windows-mica-visual-row`, `macos-traffic-light-row`, `data-alpha-proof-ledger`, `proofLedger`, `alpha-runtime-gate-ledger`, and `hosted-php-smoke-proof-required` so UltraGear `src/app.ts` `syncWindowProgress`, `win.setProgressBar`, `applyWindowChrome`, `Effect.Mica`, and `ValidationView.svelte` report-export cues remain visible as host-owned native/progress semantics plus deterministic adapter report artifacts. The manifest records this as `progressReportHandoff`, `nativeVisualMatrix`, and `progressReportGraphic` evidence, while the evidence index mirrors it as `progress-report-handoff`, `native-visual-matrix`, and `progress-report-graphic`. The JSON contracts map `collecting-evidence` to `ProgressBarStatus.Indeterminate`, `generating-report-bundle` to `ProgressBarStatus.Normal`, and `report-ready` to `ProgressBarStatus.None` with `/alpha-readiness/report.json` and `report/alpha-readiness.full.json` as the download handoff.

For the broader package alpha gate, run:

```bash
bun run alpha:gate
```

This runs the report pipeline, `verify:alpha`, `verify:release-prep`, adapter build, unit tests, PHP smoke, Svelte/TypeScript check, strict artifact-sync verification, PHP/static route verification, JS-SSR route verification, browser E2E for `php-static` and `js-ssr-root`, `alpha:consumer:smoke`, and `alpha:native:smoke`.
The alpha gate runs `bun run verify:artifacts -- --strict`, so checked-in generated adapter output must match a fresh temporary build before the gate can pass.

`bun run verify:artifacts` builds `adapter/src/index.ts` into a temporary file and compares that output to the checked-in `adapter/index.js`. This catches the important alpha drift case where source files changed but the versioned adapter bundle was not regenerated. Non-strict local runs warn on drift; CI or `--strict` fails.

`bun run precheck:deploy` loads private local environment values and fails before deploy automation if required operational values are empty, placeholders, malformed, or unsafe. It requires concrete `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_REMOTE`, and `DEPLOY_LOCAL`; validates `DEPLOY_PORT` when present; rejects parent-relative deploy-local and optional `DEPLOY_IDENTITY_FILE` paths; and rejects `ALPHA_SMOKE_BASE_URL` values with credentials or query tokens. The deploy helper also defaults to a generic profile name and does not turn missing CLI/env values into the string `undefined`.

`tests/unit/deploy-precheck.test.ts` protects the deploy safety contract by covering placeholder values, the literal `undefined`, missing required values, invalid ports, parent-relative `DEPLOY_LOCAL`, and credentialed or query-bearing `ALPHA_SMOKE_BASE_URL` values.

`tests/unit/native-host-event-bridge.test.ts` protects the optional native host bridge by covering `set-window-effect`, `set-progress`, `clear-progress`, `report-ready`, browser fallback history, malformed action details, and bounded command history. This keeps the Windows Mica/progress/report handoff contract testable without requiring a desktop wrapper.

`bun run verify:release-prep` is the fast safety subset for alpha package metadata, committed env-file placeholders, `.env.example` coverage, deploy-precheck contract coverage, artifact-sync contract coverage, and leftover package tarball cleanup. It reports key counts and check names without printing env values.

The consumer smoke verifies that `npm pack --json` includes only the expected publish contract files, installs the generated tarball into a temporary external app, and imports `sveltekit-php/adapter` from that installed package. It does not publish the package.

For real-host evidence after deployment, set `ALPHA_SMOKE_BASE_URL` and run:

```bash
bun run alpha:remote:smoke
```

For an isolated hosted PHP proof lane that does not touch production document roots, use `/dev/sveltekitphp`:

```powershell
bun run alpha:deploy:dev-host -- --apply --smoke
```

This command builds with `SK_BASE_PATH=/dev/sveltekitphp`, requires `DEPLOY_REMOTE` to end with `/dev/sveltekitphp`, uploads through the guarded deploy helper, runs `bun run alpha:remote:smoke`, regenerates the alpha report, and verifies the alpha evidence bundle. See `docs/ALPHA-HOSTED-DEV-PROOF.md`.

Current live working-ground status: `https://blog.canopydigital.ca/dev/sveltekitphp/` was refreshed on `2026-07-01` with `bun run alpha:deploy:dev-host -- --apply --smoke`. Hosted smoke passed for `1.0.2-alpha.0`, wrote `report/alpha-remote-smoke.json`, regenerated the alpha report, and `bun run verify:alpha` passed. Treat this as current alpha hosted proof for the `/dev/sveltekitphp` working ground, not as a substitute for a fresh hosted gate against the final release deployment target.

The remote smoke checks the deployed home page, `/alpha-readiness`, `/alpha-readiness/no-hydration`, `/alpha-readiness/report.json`, `/alpha-readiness/report.html`, `/alpha-readiness/report.md`, `/alpha-readiness/release-notes.md`, `/alpha-readiness/report.svg`, `/alpha-readiness/community-source-map.svg`, `/alpha-readiness/release-manifest.json`, `/alpha-readiness/gate-matrix.json`, `/alpha-readiness/evidence-index.json`, `/alpha-readiness/package-contract.json`, `/alpha-readiness/native-host-contract.json`, `/alpha-readiness/native-host-guide.md`, `/alpha-readiness/native-host-wrapper-smoke.json`, `/alpha-readiness/hosted-smoke-checklist.json`, `/alpha-readiness/bridge-reuse.json`, `/alpha-readiness/review-index.md`, `/alpha-readiness/community-signals.json`, `/alpha-readiness/community-analytics.md`, `/alpha-readiness/community-research-pack.json`, `/alpha-readiness/readiness.csv`, `/alpha-readiness/community-signals.csv`, `/alpha-readiness/community-sources.csv`, `/form-basic`, the default `/form-basic` POST action echo, expected content types, no-hydration markers, live evidence gate markers, progress handoff markers (`data-progress-report-handoff`, `progressReportHandoff`, `progress-report-handoff`, `ProgressBarStatus.Indeterminate`, `ProgressBarStatus.None`, and `report-ready`), native visual matrix markers (`data-native-visual-matrix`, `native-visual-matrix`, `windows-mica-visual-row`, and `macos-traffic-light-row`), native wrapper smoke markers (`native-host-wrapper-smoke`, `native-host-wrapper-probe`, `deterministic-host-wrapper-handoff`, `noNativeApiBoundary`, `realHostVerified`, and `buildNativeHostWrapperProbe`), live proof-ledger markers (`data-alpha-proof-ledger`, `proofLedger`, `alpha-over-rc-release-policy`, `csr-disabled-prerender-contract`, `alpha-runtime-gate-ledger`, `hosted-php-smoke-proof-required`, `needs-local-gate-proof`, and `needs-hosted-proof`), evidence-index inventory markers, evidence marker text for native host events/trust metadata/community source taxonomy, and traversal-style probes. The no-hydration fixture must include `no-hydration-fixture`, `csr-disabled-prerender-contract`, and `theme-stable-ssr-html`, while forbidding `<script`, `sveltekit:start`, and `data-sveltekit-hydrate` in the served HTML. It is intentionally opt-in because the default alpha gate must stay deterministic without external network targets.
The remote smoke also checks the bridge-reuse and manifest endpoints for `lg-ultragear-native-platform-provenance`, `Effect.Mica`, `win.setEffects`, `app-window.maximized`, inactive-focus Mica markers, `theme-ultragear`, `--window-bg-mica`, `--window-bg-inactive`, `data-window-control-group`, `setPointerCapture`, `lostpointercapture`, `win.startDragging`, `win.setProgressBar`, `reportJson`, and `reportUrl`, so hosted evidence must preserve the native provenance contract rather than only serving the alpha page.

It writes `report/alpha-remote-smoke.json`, and later report exports embed that hosted status into Markdown, HTML, and full JSON handoff artifacts.

For release evidence, prefer the hosted gate:

```bash
ALPHA_SMOKE_BASE_URL=https://example.com/ bun run alpha:gate:hosted
```

This runs the complete local `alpha:gate` first, runs the remote smoke against the deployed PHP host, regenerates alpha reports with `report/alpha-remote-smoke.json`, and verifies the final report contract.

CI uses `.github/workflows/alpha-gate.yml` for the same split:

- Push and pull-request runs execute deterministic local `bun run alpha:gate`.
- Manual `workflow_dispatch` can pass `alpha_smoke_base_url` to run the hosted smoke, regenerate reports, verify the hosted evidence slot, and upload `report/` artifacts.

The community links are explicit research entrypoints, not live telemetry. They are meant to prevent invented analytics while giving reviewers a repeatable path to inspect demand, comparable projects, support burden, and docs gaps.

## Alpha release gate

Before publishing or tagging `1.0.2-alpha.0`, prove:

- Clean install from the detected package manager.
- Adapter build succeeds and generated output is synchronized.
- Unit, PHP, check, and E2E suites pass.
- `php-static` and `js-ssr` fixtures both pass route verification.
- External consumer smoke passes through `bun run alpha:consumer:smoke`.
- `.env` contains no concrete deploy secrets.
- Any previously committed real deploy credentials have been rotated.
- `/alpha-readiness` renders in root and non-root base path configurations.
- Downloaded report JSON matches the visible readiness categories.

## Stable 1.0.2 gate

Stable `1.0.2` needs stronger evidence than alpha:

- Full unfiltered E2E pass.
- Clean clone build from scratch.
- Package smoke through packed artifact install.
- CI artifact drift gate passing in strict mode.
- Public-facing docs that describe supported and unsupported hosting modes.
- At least one real PHP-host deployment smoke through `ALPHA_SMOKE_BASE_URL` after the sanitized environment changes.

## Support lanes for 1.0.2-alpha

- Supported: `php-static` covers prerendered/static HTML, PHP data/action handlers, endpoint dispatch, base-path deployment, root/generated router parity, and no-hydration `csr=false` pages.
- Supported with sidecar: `js-ssr` covers request-time Svelte document SSR, exact streamed/deferred document behavior, and Node-like rendering that `php-static` intentionally does not emulate.
- Validation lane: latest same-major Svelte 5/SvelteKit 2 is smoke-tested; Vite 8 and `@sveltejs/vite-plugin-svelte` 7 are smoke-tested in an isolated fixture without changing dependency floors.
- Unsupported for this 1.x line: SvelteKit remote functions, `.remote.*` route files, WordPress plugin mode, PHP-FPM package mode, ISR, built-in image optimization, and adapter-owned auth/roles until fixtures, docs, and hosted proof exist.
- Future and host-owned: native wrapper evidence is deterministic browser/PHP handoff only; real Windows Mica, macOS vibrancy, taskbar progress, drag, and maximize claims require an external wrapper smoke.
- Proof boundary: `blog.ryanspice.com` is consumer proof for static/no-hydration behavior; `/dev/sveltekitphp` or another hosted PHP fixture plus npm-published consumer proof remains required before RC/stable.

## Known limitations

- The alpha report scores are curated release-readiness indicators, not computed telemetry.
- Community analytics are partial public-source evidence: supported JSON endpoints are collected, Reddit can block unauthenticated requests, and Apache/Nginx remain manual research entrypoints.
- `php-static` does not claim exact SvelteKit/devalue streaming-deferred parity for request-time Svelte documents. Use `js-ssr` for exact streamed Svelte document SSR or deferred chunk behavior; any future PHP-native streaming/deferred claim needs dedicated parity fixtures and hosted proof.
- SvelteKit remote functions are unsupported in `1.0.2-alpha`; `kit.experimental.remoteFunctions` and `.remote.*` route files fail the adapter build until PHP generated-endpoint routing has fixture and hosted proof. See `docs/REMOTE-FUNCTIONS-ALPHA-POLICY.md`.
- WordPress plugin mode, PHP-FPM package mode, ISR, built-in image optimization, and adapter-owned auth/roles are outside the `1.0.2-alpha` support contract.
- Native shell styling is a browser-safe emulation layer, not real Windows Mica or macOS vibrancy.
- The package is not published or tagged by this readiness surface alone.

## Hosted and deploy environment safety

Alpha hosted/deploy commands must fail before runtime work when required environment is empty or placeholder-only. Keep `.env` local and operational only; use `.env.example` for safe defaults, and provide real `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_REMOTE`, `DEPLOY_LOCAL`, optional `DEPLOY_IDENTITY_FILE`, and `ALPHA_SMOKE_BASE_URL` values through the local shell or CI secrets.

`ALPHA_SMOKE_BASE_URL` must be an HTTP(S) origin/path without embedded credentials or query tokens. Hosted smoke report paths must stay within the workspace/report output tree and must not use parent-directory segments.



