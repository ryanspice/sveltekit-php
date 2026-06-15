# SvelteKit PHP 1.0.0-alpha release checklist

This checklist defines the project-specific `1.0.0-alpha` bar. In this repo, `1.0.0-alpha` is the required pre-stable release track and is treated as above any RC label for project planning. This is a project policy, not generic SemVer prerelease ordering.

## Required evidence markers

- `alpha-over-rc-release-policy`
- `native-host-binding-guide`
- `desktop-shell-ui-command-mapping`
- `windows-11-mica-browser-safe-shell`
- `macos-style-native-titlebar-rhythm`
- `alpha-readiness-report-graphics`
- `community-keyword-search-graph`
- `community-analytics-freshness-contract`
- `community-analytics-csv-linkage`
- `router-path-safety-artifact-sync`
- `deploy-env-preflight-safety`
- `hosted-php-smoke-proof`

## Local alpha gate

Run these before calling a local build alpha-reviewable:

```powershell
bun run alpha:report:full
bun run verify:alpha
bun run verify:release-prep
bun run alpha:gate
```

The local gate must regenerate reports, verify release-prep safety, rebuild the adapter, run strict artifact sync, run unit/runtime checks, and run the consumer smoke.

## Hosted alpha gate

Hosted proof is required before this can claim deployed PHP behavior:

```powershell
$env:ALPHA_SMOKE_BASE_URL = "https://example.com"
bun run alpha:gate:hosted
```

`ALPHA_SMOKE_BASE_URL` must be an HTTP(S) origin/path without credentials or query tokens. Hosted smoke is not pass evidence until it targets a real deployed PHP host.

## Native shell evidence

The alpha bundle must keep the optional native-host boundary explicit:

- Reuse cue package: `@scriptgpt/desktop-shell-ui`
- Source cue: `packages/desktop-shell-ui/src/index.ts`
- Widget cue: `packages/ultragear-widget-ui/src/app.ts`
- Host global: `window.__SVELTEKIT_PHP_NATIVE_HOST__`
- Installer marker: `installSvelteKitPhpNativeHost`
- Mapping marker: `getDesktopShellUiCommandMapping`

Required action-to-helper mapping:

- `start-dragging` -> `win.startDragging()`
- `toggle-maximize` -> `toggleWindowMaximize(win)`
- `set-window-effect` -> `enableMicaWindowChrome(win)`
- `set-progress` -> `syncTaskbarProgress(win, { progressStatus, progress })`
- `clear-progress` -> `syncTaskbarProgress(win, { progressStatus: 'none' })`
- `report-ready` -> `host.reportReady(...)`

Taskbar/save-status evidence markers must remain visible in the release bundle:

- `toDesktopShellUiTaskbarProgressState`
- `TaskbarProgressState`
- `saveInFlight`
- `hasQueuedSave`

The PHP adapter must remain browser/PHP-host safe. Tauri APIs belong only in an optional native wrapper.

## Community analytics evidence

The report bundle must keep JSON, Markdown, SVG, and CSV outputs aligned:

- `sourceToKeywordEdge`
- `analyticsLinkageMarker`
- `weightedDemandScore`
- `freshnessMaxAgeHours`
- `trustBoundary`
- `manualReviewRequired`
- `weighted_demand_score`
- `source_to_keyword_edges`
- `source_to_keyword_edge`

Community counts are directional public-source signals, not telemetry and not release claims by themselves.

## Runtime and artifact safety

The alpha bundle must prove:

- root `router.php` delegates to generated runtime routing,
- generated routers reject traversal, encoded separators, control/null bytes, and protected paths,
- checked-in `adapter/index.js` is synchronized with source,
- deploy and hosted smoke commands fail on empty, placeholder, or unsafe environment values.

## Stable blocker

Stable `1.0.0` remains blocked until hosted PHP smoke passes against a real deployment and all required alpha evidence markers are regenerated and verified from current source.
