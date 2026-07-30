# SvelteKit PHP 1.0.2-alpha release checklist

Candidate: `1.0.2-alpha.0`

This checklist defines the project-specific `1.0.2-alpha` bar. In this repo, `1.0.2-alpha` is the required pre-stable release track and is treated as above any RC label for project planning. This is a project policy, not generic SemVer prerelease ordering.

## Required evidence markers

- `alpha-over-rc-release-policy`
- `native-host-binding-guide`
- `real-host-permission-checklist`
- `native-host-compatibility-matrix`
- `desktop-shell-ui-command-mapping`
- `csr-disabled-prerender-contract`
- `native-host-wrapper-smoke`
- `windows-11-mica-browser-safe-shell`
- `macos-style-native-titlebar-rhythm`
- `alpha-readiness-report-graphics`
- `community-keyword-search-graph`
- `community-analytics-freshness-contract`
- `community-analytics-csv-linkage`
- `result-total-field-contract`
- `top-result-field-contract`
- `sample-review-rule`
- `result_total_field`
- `top_result_fields`
- `sample_review_rule`
- `router-path-safety-artifact-sync`
- `adapter-platform-emulation`
- `latest-sveltekit-compatibility-audit`
- `remote-functions-alpha-policy`
- `deploy-env-preflight-safety`
- `hosted-php-smoke-proof`

## Proof status summary

- `alpha-over-rc-release-policy`: source-level alpha policy evidence is present; RC/latest/stable labels remain blocked.
- `csr-disabled-prerender-contract`: source-level no-hydration fixture evidence is present; hosted proof still must confirm the deployed HTML has no hydration scripts.
- `latest-sveltekit-compatibility-audit`: official Svelte/SvelteKit docs and npm latest package boundaries are recorded; Vite 8 and vite-plugin-svelte 7 remain isolated validation targets, not alpha support-floor claims.
- `remote-functions-alpha-policy`: SvelteKit remote functions are explicitly blocked until generated HTTP endpoint routing has PHP fixture and hosted proof.
- `native-host-wrapper-smoke`: deterministic wrapper replay evidence is present; `realHostVerified` must stay false until a real Windows/macOS wrapper run exists.
- `real-host-permission-checklist`: LG UltraGear/Tauri capability cues are present; real OS-native Mica/taskbar/drag/maximize claims still require wrapper permission proof.
- `native-host-compatibility-matrix`: source-observed UltraGear Windows Mica/taskbar/drag/maximize cues, including `ShellFeatureProbe.mica_supported`, `current_shell_features()`, `windowChromeState`, `webview.setBackgroundColor([0, 0, 0, 0])`, and transparent webview markers `data-window-chrome-state` / `data-transparent-webview-material-boundary`, are mapped to browser-safe host actions; this is not a real OS-native proof substitute.
- `hosted-php-smoke-proof`: alpha hosted proof is present when `report/alpha-remote-smoke.json` has `status=passed`; stable still requires a fresh hosted gate for the release deployment target.
- `root-router-parity-contract`: root `router.php` returns the generated router result so PHP built-in server fallthrough stays aligned; `scripts/verify-root-router-parity.mjs` compares root and generated router behavior across representative routing and path-safety fixtures, and `bun run verify:release-prep` includes this contract.

## Hard proof blockers

These `hardProofBlockers` rows are the `hard-proof-blocker-ledger` and feed `stablePromotionBlockers`. They intentionally separate alpha review evidence from proof required before stable `1.0.2`, real native-host claims, or fresh community claims.

### full-local-alpha-gate

- Marker: `alpha-runtime-gate-ledger`
- Status: `needs-current-run-proof`
- Scope: `local`
- Required command: `bun run alpha:gate`
- Required environment: `none`
- Required artifacts: `report/alpha-readiness.full.json`, `report/alpha-release-manifest.json`, `report/alpha-gate-matrix.json`
- Blocks: `stable-1.0.2`
- Reviewer action: Run the full local alpha gate in the current working tree before treating runtime correctness, artifact sync, and consumer smoke evidence as current.

### hosted-php-smoke-proof

- Marker: `hosted-php-smoke-proof-required`
- Status: `needs-hosted-proof`
- Scope: `hosted`
- Required command: `bun run alpha:gate:hosted`
- Required environment: `ALPHA_SMOKE_BASE_URL`
- Required artifacts: `report/alpha-remote-smoke.json`, `report/alpha-readiness.full.json`
- Blocks: `stable-1.0.2`
- Reviewer action: Run hosted smoke against a real deployed PHP host without URL credentials before claiming hosted PHP behavior is proven.

### packed-consumer-install-import-proof

- Marker: `packed-consumer-install-import-proof`
- Status: `needs-current-run-proof`
- Scope: `local`
- Required command: `bun run alpha:consumer:smoke`
- Required environment: `none`
- Required artifacts: `npm pack --json output`, `temporary external consumer import log`
- Blocks: `stable-1.0.2`
- Reviewer action: Install the packed tarball into a temporary external consumer and import sveltekit-php/adapter before promoting the package.

### npm-publish-auth-proof

- Marker: `npm-publish-auth-proof`
- Status: `needs-maintainer-auth`
- Scope: `registry`
- Required command: `npm whoami`
- Required environment: npm maintainer credentials
- Required artifacts: authenticated `npm whoami` output before `npm publish --tag alpha`
- Blocks: `alpha-publish`, `rc-publish`, `stable-1.0.2`
- Reviewer action: `npm whoami` currently returns `E401`; configure maintainer npm authentication before `npm publish --tag alpha` or `npm run alpha:published:smoke` can produce pass evidence.

### strict-artifact-sync-proof

- Marker: `source-to-generated-bundle-check`
- Status: `needs-current-run-proof`
- Scope: `local`
- Required command: `bun run verify:artifacts -- --strict`
- Required environment: `none`
- Required artifacts: `adapter/src/index.ts`, `adapter/index.js`
- Blocks: `stable-1.0.2`
- Reviewer action: Regenerate adapter/index.js from adapter/src/index.ts and prove checked-in generated output is not stale.

### real-native-wrapper-proof

- Marker: `real-native-host-wrapper-smoke-required`
- Status: `needs-real-host-proof`
- Scope: `native-host`
- Required command: `bun run alpha:native:smoke plus an external Windows/macOS wrapper run`
- Required environment: `none`
- Required artifacts: `report/alpha-native-host-wrapper-smoke.json`, `external native wrapper smoke transcript`
- Blocks: `stable-native-claim`
- Reviewer action: Keep browser/PHP evidence as deterministic handoff only until an actual Windows or macOS host handles every native-window-action without fallback.

### community-analytics-freshness-proof

- Marker: `community-analytics-freshness-contract`
- Status: `needs-freshness-review`
- Scope: `community`
- Required command: `bun run alpha:report:full`
- Required environment: `none`
- Required artifacts: `report/alpha-community-analytics.json`, `report/alpha-community-analytics.md`, `report/alpha-community-sources.csv`
- Blocks: `fresh-community-claim`
- Reviewer action: Refresh public-source analytics within the freshness window or keep community evidence framed as directional and stale-safe.
- Source-field contract: `result-total-field-contract`, `top-result-field-contract`, and `sample-review-rule` must stay visible in the research pack and source map, with `result_total_field`, `top_result_fields`, and `sample_review_rule` present in `report/alpha-community-sources.csv`.

## Local alpha gate

```powershell
bun run alpha:report:full
bun run alpha:native:smoke
bun run verify:alpha
bun run verify:root-router-parity
bun run verify:release-prep
bun run alpha:gate
```

The local gate must regenerate reports, verify release-prep safety, rebuild the adapter, run strict artifact sync, run unit/runtime checks, run the consumer smoke, and run the native wrapper smoke handoff.

## Latest Svelte/SvelteKit compatibility audit

- Audit artifact: `docs/ALPHA-LATEST-SVELTEKIT-AUDIT.md`
- Source docs: SvelteKit adapter, build, page-option, project-type, Svelte 5 migration, and browser-support guidance
- npm latest snapshot: `svelte@5.56.4`, `@sveltejs/kit@2.69.1`, `@sveltejs/vite-plugin-svelte@7.1.4`, and `vite@8.1.3`
- Freshness verifier: `bun run verify:latest-sveltekit-audit` compares this source-controlled snapshot with current `npm view` output
- Same-major smoke: `bun run alpha:latest-same-major:smoke` packs this adapter, installs it into a temporary fixture with npm-latest `svelte@5.x` and `@sveltejs/kit@2.x`, runs `vite build`, and checks generated PHP/static output
- Current alpha support floor: same-major `svelte` and `@sveltejs/kit` compatibility is a local-gate proof lane, not an in-place dependency-floor upgrade
- Validation lane: `vite@8` and `@sveltejs/vite-plugin-svelte@7` require isolated validation before dependency floors move
- Stable blocker: add explicit proof or an unsupported-feature policy for newer SvelteKit server surfaces such as remote functions

## Remote functions alpha policy

- Policy artifact: `docs/REMOTE-FUNCTIONS-ALPHA-POLICY.md`
- Required marker: `remote-functions-alpha-policy`
- Current status: unsupported in PHP runtime alpha output
- Guarded config: `kit.experimental.remoteFunctions` must stay disabled
- Guarded files: `.remote.js`, `.remote.ts`, `.remote.mjs`, `.remote.mts`, `.remote.cjs`, and `.remote.cts`
- Platform signal: `event.platform.php.remoteFunctions.supported` reports `false`
- Verifier: `bun run verify:remote-functions`
- Promotion rule: generated remote-function HTTP endpoints need PHP router fixture proof and hosted PHP smoke proof before support can be claimed

## Release-note support lanes

- Supported: `php-static` covers prerendered/static HTML, PHP data/action handlers, endpoint dispatch, base-path deployment, root/generated router parity, and no-hydration `csr=false` pages.
- Supported with sidecar: `js-ssr` covers request-time Svelte document SSR, exact streamed/deferred document behavior, and Node-like rendering that `php-static` intentionally does not emulate.
- Partial validation lane: latest same-major Svelte 5/SvelteKit 2 is smoke-tested; Vite 8 and `@sveltejs/vite-plugin-svelte` 7 remain isolated validation targets until dependency-floor proof exists.
- Unsupported for this 1.x line: SvelteKit remote functions, `.remote.*` route files, WordPress plugin mode, PHP-FPM package mode, ISR, built-in image optimization, and adapter-owned auth/roles until fixtures, docs, and hosted proof exist.
- Future and host-owned: native wrapper evidence is deterministic browser/PHP handoff only; real Windows Mica, macOS vibrancy, taskbar progress, drag, and maximize claims require an external wrapper smoke.
- Proof boundary: `blog.ryanspice.com` is consumer proof for static/no-hydration behavior; `/dev/sveltekitphp` or another hosted PHP fixture plus npm-published consumer proof remains required before RC/stable.

## Hosted alpha gate

```powershell
$env:ALPHA_SMOKE_BASE_URL = "https://example.com"
bun run alpha:gate:hosted
```

Guarded dev-host proof lane:

```powershell
$env:DEPLOY_REMOTE = "domains/blog.canopydigital.ca/public_html/dev/sveltekitphp"
$env:DEPLOY_IDENTITY_FILE = "$HOME\.ssh\id_ed25519_ryanspice"
$env:ALPHA_SMOKE_BASE_URL = "https://blog.canopydigital.ca/dev/sveltekitphp/"
bun run alpha:deploy:dev-host -- --apply --smoke
```

- `alpha:deploy:dev-host` builds with `SK_BASE_PATH=/dev/sveltekitphp` and `DEPLOY_BASE=/dev/sveltekitphp`.
- The command refuses broad remote paths and requires `DEPLOY_REMOTE` to end with `/dev/sveltekitphp` before upload.
- Use this lane for Canopy dev proof only; production deploys stay outside the alpha hosted proof workflow.

`ALPHA_SMOKE_BASE_URL` must be an HTTP(S) origin/path without credentials or query tokens. Hosted smoke is not pass evidence until it targets a real deployed PHP host.

## Native shell evidence

- Reuse cue package: `@scriptgpt/desktop-shell-ui`
- Source cue: `packages/desktop-shell-ui/src/index.ts`
- Widget cue: `packages/ultragear-widget-ui/src/app.ts`
- Capability cue: `src-tauri/capabilities/default.json`
- Permission checklist marker: `lg-ultragear-host-permission-checklist`
- Runtime checklist field: `realHostPermissionChecklist`
- Host handler permission field: `requiredHostPermission`
- Host global: `window.__SVELTEKIT_PHP_NATIVE_HOST__`
- Wrapper smoke command: `bun run alpha:native:smoke`
- Wrapper smoke endpoint/artifact: `/alpha-readiness/native-host-wrapper-smoke.json` and `report/alpha-native-host-wrapper-smoke.json`
- Wrapper smoke marker: `native-host-wrapper-smoke` (deterministic handoff only; real host smoke stays host-owned)
- Wrapper smoke boundary markers: `deterministic-host-wrapper-handoff`, `native-host-wrapper-event-replay`, `expectedHistoryResult`, `expectedDesktopShellUiHelper`, `noFallbackAllowedForRealHost`, `realHostVerified: false`, and `noNativeApiBoundary`
- System appearance helpers: `prefersDarkMode`, `bindColorSchemeWatcher`, and `window.matchMedia("(prefers-color-scheme: dark)")`
- Installer marker: `installSvelteKitPhpNativeHost`
- Mapping marker: `getDesktopShellUiCommandMapping`
- Progress translation marker: `toDesktopShellUiTaskbarProgressState`

Required action-to-helper mapping:

- `start-dragging` -> `win.startDragging()`; requires `core:window:allow-start-dragging`
- `toggle-maximize` -> `toggleWindowMaximize(win)`; requires `core:window:allow-toggle-maximize`
- `set-window-effect` -> `enableMicaWindowChrome(win)`; requires `core:window:allow-set-effects`
- Chrome-state/transparency boundary markers: `windowChromeState`, `mica-active`, `mica-inactive`, `plain`, `webview.setBackgroundColor([0, 0, 0, 0])`, `data-window-chrome-state`, and `data-transparent-webview-material-boundary` are alpha evidence markers only; real transparent webview and Mica execution remain host-owned.
- system appearance -> `bindColorSchemeWatcher(() => prefersDarkMode())`
- `set-progress` -> `syncTaskbarProgress(win, { saveInFlight: progressStatus === "indeterminate", refreshInFlight: false, hasQueuedSave: progressStatus === "normal" })`; requires `core:window:allow-set-progress-bar`
- `clear-progress` -> `syncTaskbarProgress(win, { saveInFlight: false, refreshInFlight: false, hasQueuedSave: false })`; requires `core:window:allow-set-progress-bar`
- `report-ready` -> `host.reportReady(...)`

Real-host promotion rule: CSS/DOM/native-shell visual markers are not enough. A wrapper must prove the required host permissions above before Mica, taskbar progress, drag, maximize, or focus behavior can be described as real OS-native execution.

The PHP adapter must remain browser/PHP-host safe. Tauri APIs belong only in an optional native wrapper.

## No-hydration prerender evidence

- Fixture route: `/alpha-readiness/no-hydration`
- Route config: `prerender=true` and `csr=false`
- Required markers: `no-hydration-fixture`, `csr-disabled-prerender-contract`, and `theme-stable-ssr-html`
- Forbidden hosted markers: `<script`, `sveltekit:start`, and `data-sveltekit-hydrate`
- Release use: catches blog/static-theme regressions where a prerendered shell renders the right theme first, then client hydration repaints it after load.

## Community analytics evidence

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

- root `router.php` delegates to generated runtime routing with `return require $router_real;`, and `scripts/verify-root-router-parity.mjs` proves root/generated parity across page, data, negotiation, asset, missing-route, traversal, and `_protected` fixtures
- generated routers reject traversal, encoded separators, control/null bytes, and protected paths
- `/alpha-readiness/no-hydration` stays `prerender=true` and `csr=false`, with hosted smoke rejecting client script/hydration markers
- checked-in `adapter/index.js` is synchronized with source
- `event.platform.php` exposes adapter mode/runtime capability flags through SvelteKit `emulate().platform` without secrets
- `docs/ALPHA-LATEST-SVELTEKIT-AUDIT.md` tracks latest Svelte/SvelteKit docs, package boundaries, remote-function risk, and Vite/plugin validation lanes
- `verify:latest-sveltekit-audit` fails when the source-controlled npm latest snapshot drifts from current registry output
- `alpha:latest-same-major:smoke` fails when npm-latest Svelte 5 or SvelteKit 2 can no longer build a minimal PHP/static adapter fixture
- `docs/REMOTE-FUNCTIONS-ALPHA-POLICY.md` and `verify:remote-functions` keep remote-functions support blocked until generated endpoint routing is proven
- deploy and hosted smoke commands fail on empty, placeholder, or unsafe environment values

## Stable blocker

Stable `1.0.2` remains blocked until hosted PHP smoke passes against a real deployment, Vite 8 and vite-plugin-svelte 7 are validated or explicitly deferred, newer Kit server surfaces have proof or an unsupported-feature policy, real native-host proof exists, npm publish authentication is configured (`npm whoami` no longer returns `E401`), and all required alpha evidence markers are regenerated and verified from current source.
