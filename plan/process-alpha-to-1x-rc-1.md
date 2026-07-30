---
goal: SvelteKit PHP alpha to official 1.x RC and stable release plan
version: 1.0
date_created: 2026-07-01
last_updated: 2026-07-02
owner: Ryan Spice
status: 'In progress'
tags:
  - release
  - alpha
  - rc
  - stable
  - sveltekit-php
---

# Introduction

![Status: In progress](https://img.shields.io/badge/status-In_progress-yellow)

This plan defines the path from the current `sveltekit-php@1.0.2-alpha.0` evidence state to an official public alpha, release candidate, and stable 1.x release. The exact final version must follow SemVer evidence rather than a preselected marketing label: use `1.0.2-*` if the release is primarily corrective over the existing `1.0.0`/`1.0.1` line, or `1.1.0-*` if the release adds material new public capability beyond the existing package contract.

## Current execution state

| Item | Current evidence | Status | Next action |
| --- | --- | --- | --- |
| npm registry baseline | `npm view sveltekit-php dist-tags version versions --json` returned `latest: 1.0.1` and versions `1.0.0`, `1.0.1`. | Confirmed | Keep the next alpha on the `1.0.2-alpha.N` track unless new public feature scope requires `1.1.0-alpha.0`. |
| npm authentication | `npm whoami` and `bun run release:npm-state` returned `E401 Unauthorized` on 2026-07-02. | Blocked | Run `npm login` or otherwise authenticate the maintainer account, then rerun `bun run release:npm-state:strict` before publishing. |
| package dry-run | `bun run release:npm-state` ran npm pack dry-run metadata collection in a temp pack destination and produced `sveltekit-php-1.0.2-alpha.0.tgz`, shasum `f802f329c73814a50c2e4afebc9193ac445ab6e6`, 15 files, no bundled dependencies after adding the published-alpha smoke, root-router parity verifier, packaged root-router/npm-auth docs, `1.0.2` stable-target wording cleanup, public contract docs, release-note support-lane docs, dev-adapter boundary status docs, refreshed live-blog SEO evidence docs, Vite-major validation evidence, v1 gate-chain enforcement, the npm release-state probe, and hosted-gate skip-local composition. | Passed | Rerun immediately before `npm publish --tag alpha`. |
| packed consumer smoke | `npm run alpha:consumer:smoke` passed on 2026-07-01: consumer import worked through `./adapter/index.js` and publish manifest smoke passed for `sveltekit-php-1.0.2-alpha.0.tgz` with 15 files. | Passed | Keep as local pre-publish proof; still run `npm run alpha:published:smoke` after registry publish. |
| registry consumer smoke | `scripts/smoke-published-alpha.mjs` and `npm run alpha:published:smoke` verify that `sveltekit-php@alpha` installs from npm, builds a `php-static` fixture, emits `index.php`, `.htaccess`, `router.php`, `_runtime/compat.php`, and `adapter/route-manifest.php`, and keeps the prerendered page free of hydration bootstrap markers. `node --check scripts/smoke-published-alpha.mjs` passed; `npm run alpha:published:smoke` currently fails with the intended "Publish with npm publish --tag alpha" blocker because no alpha dist-tag exists yet. | Ready, blocked on publish | Run after `npm publish --tag alpha`. |
| root router parity proof | `scripts/verify-root-router-parity.mjs` and `npm run verify:root-router-parity` compare root `router.php` and generated `build/router.php` built-in server responses across page, data, negotiation, missing-route, asset, protected, base, and encoded traversal fixtures. It passed on 2026-07-01 after root `router.php` was fixed to `return require $router_real;` and the verifier cleanup path was hardened so PHP child servers do not linger. | Passed | Keep in `v1:gate:local` and rerun after router/build-output changes. |
| release-prep drift guard | `bun run verify:release-prep` passed 17 checks on 2026-07-02 after the latest-package snapshot refresh, including `root-router-parity-contract` and `public-contract-docs`. | Passed | Keep this green before alpha, RC, and stable package changes. |
| latest SvelteKit audit verifier | `bun run verify:latest-sveltekit-audit` passed on 2026-07-02 after updating the npm latest snapshot to `svelte@5.56.4`, `@sveltejs/kit@2.69.0`, `@sveltejs/vite-plugin-svelte@7.1.2`, and `vite@8.1.3`. | Passed | Rerun when npm snapshot docs change or before RC evidence refresh. |
| RC version decision | The first official RC stays on the corrective `1.0.2-rc.0` track because the current delta is docs, verifier, package-contract, and root-router parity hardening rather than a new public adapter feature. | Decided | Do not switch package metadata to RC until alpha publish and `alpha:published:smoke` complete. |
| release-note lane contract | Release notes now distinguish supported `php-static`, supported-with-sidecar `js-ssr`, partial Vite 8/plugin 7 validation, unsupported remote functions/WordPress/PHP-FPM/ISR/image/auth lanes, native-wrapper host ownership, and hosted/npm proof boundaries. | Passed locally | Regenerate `report/alpha-release-notes.md` during the next `alpha:report:full` run. |
| dev adapter boundary | Dev adapters are explicitly dev-only, reject production/CI use without override, and write deterministic 503 stubs instead of silently degrading. | Passed locally | Keep this post-stable hardening lane focused on tests/docs unless runtime leakage appears. |
| live blog SEO refresh | `seo_audit_python` reran from `B:\Temp\@Browser` on 2026-07-01 and wrote `B:\Temp\@Browser\seo_blog_ryanspice_20260701\blog.ryanspice.com-root-20260701T060746Z-v0_4_9`; 28 pages, score `91`, grade `A-`, 2 high, 5 medium, 13 low, 1 info. High findings are confined to intentionally private `/login`; content-template quick wins remain blog follow-up, not adapter blockers. | Passed | Keep blog evidence as consumer proof only; do not substitute it for hosted PHP adapter fixture or npm-published consumer proof. |
| Vite 8/plugin 7 isolated validation | `bun run alpha:latest-vite-major:smoke` passed on 2026-07-02 with `svelte@5.56.4`, `@sveltejs/kit@2.69.0`, `@sveltejs/vite-plugin-svelte@7.1.2`, and `vite@8.1.3`; dependency floors remain unchanged. | Passed locally | Keep this as isolated validation evidence, not an in-place dependency-floor upgrade. |
| local v1 gate | `bun run v1:gate:local` passed on 2026-07-01 after adding `alpha:latest-vite-major:smoke` to the gate chain, fixing the readiness unit fixture, and tightening release-prep verification for the gate chain. Today’s source/report refresh means this full gate must be rerun before release. | Stale after source refresh | Keep as the local release gate; hosted and npm-published proof remain separate blockers. |
| npm release-state probe | `bun run release:npm-state` reports auth, dist-tags, published versions, target-version collision, and pack dry-run metadata without publishing; default mode stays report-only while `release:npm-state:strict` fails on blockers. | Passed locally with expected auth blocker | Run strict mode after npm login and before `npm publish --tag alpha`. |
| hosted v1 gate component | `ALPHA_SMOKE_BASE_URL=https://blog.canopydigital.ca/dev/sveltekitphp/ bun run v1:gate:hosted` passed on 2026-07-01 in 12 seconds after the hosted wrapper was made composable with `--skip-local`; it ran remote smoke, regenerated hosted evidence, and passed `verify:alpha`. The later composed `bun run v1:gate` attempt was interrupted and is not counted as full composed-gate proof. | Passed component, full composed gate unproven | Rerun the full composed gate before RC/stable claims if exact single-command evidence is required. |
| publish state | `1.0.2-alpha.0` is not published while npm authentication is missing. | Not started | After auth and final dry-run, run `npm publish --tag alpha`. |

## RC/stable blocker classification

| Item | Classification | Required before RC | Required before stable | Current action |
| --- | --- | --- | --- | --- |
| npm maintainer authentication | Release-blocking | Yes | Yes | Authenticate, rerun `npm whoami`, then publish `1.0.2-alpha.0` with `npm publish --tag alpha`. |
| Published alpha consumer fixture | Release-blocking | Yes | Yes | Run `npm run alpha:published:smoke` after alpha publish. |
| Root `router.php` parity | Release-blocking unless explicitly removed from stable support | Yes | Yes | Done locally on 2026-07-01; `verify:root-router-parity` is implemented, passed, and is wired into `v1:gate:local`. |
| Final package hygiene | Release-blocking | Yes | Yes | Run `git status`, confirm no tracked scratch artifacts, and rerun `npm pack --dry-run --json`. |
| Final hosted release target | Release-blocking | No | Yes | Rerun `bun run v1:gate` against the final hosted target immediately before stable publish. |
| Streaming deferred serialization parity | Explicitly unsupported/post-stable unless implemented | No | No | Documented on 2026-07-01: `php-static` does not claim exact SvelteKit/devalue streaming-deferred parity; use `js-ssr` for exact streamed Svelte document/deferred chunk behavior. |
| Dev adapter placeholder polish | Post-stable hardening | No | No | Keep dev adapters explicitly dev-only; improve smoke tests after stable unless a verifier detects runtime leakage. |
| Large adapter mode-branch dedupe | Post-stable maintainability | No | No | Defer until stable contract is published unless a release-blocking bug appears. |
| `sk_prefers_html` template dedupe | Post-stable maintainability | No | No | Defer; current behavior is tested through router/action fixtures. |
| Debug output cleanup | Post-stable maintainability | No | No | Keep debug gated; audit after stable. |
| Vite 8 / plugin 7 upgrade | Isolated validation lane | No | No, if documented | Keep `alpha:latest-vite-major:smoke` current; do not upgrade in-place for RC unless a separate dependency-floor change is intentionally scoped. |
| WordPress/PHP-FPM/remote functions/ISR/image optimization/auth roles | Unsupported for this stable line | No | No | Keep out of stable claims until separate fixtures, docs, and hosted proof exist. |
| Live blog SEO cleanup | Consumer-proof quality work | No | No | Keep as blog workflow follow-up; do not block adapter stable unless it reveals adapter-generated markup or routing regressions. |

## 1. Requirements & Constraints

- **REQ-001**: Keep `php-static` honest. Prerendered/static pages and PHP data/action handlers are first-class; true dynamic Svelte document SSR remains the `js-ssr` sidecar lane.
- **REQ-002**: Preserve current alpha proof: hosted PHP smoke for `https://blog.canopydigital.ca/dev/sveltekitphp/`, live `blog.ryanspice.com` no-hydration consumer evidence, latest same-major Svelte 5/SvelteKit 2 smoke, and package dry-run evidence.
- **REQ-003**: Publish alpha before RC. The next public package must be published with `npm publish --tag alpha`, then consumed from npm in a clean fixture before any RC label is used.
- **REQ-004**: RC must mean API and packaging freeze. No new adapter option, runtime mode, or route behavior should be introduced after RC except release-blocker fixes.
- **REQ-005**: Stable must not be published to the `latest` dist-tag until a current RC candidate has passed the full local gate, hosted gate, package install fixture, and consumer proof on the intended release target.
- **REQ-006**: Keep remote functions explicitly unsupported until generated HTTP endpoint routing has PHP fixtures and hosted proof.
- **REQ-007**: Keep Vite 8 and `@sveltejs/vite-plugin-svelte` 7 as an isolated validation lane until the repo intentionally upgrades those major ranges.
- **REQ-008**: Keep generated artifacts synchronized. `adapter/index.js` and generated report artifacts must be regenerated from source, not hand-edited.
- **REQ-009**: Keep secrets out of the repo. `.env` remains operational/local only; `.env.example` remains placeholder-safe.
- **REQ-010**: Treat `blog.ryanspice.com` as consumer proof, not as a replacement for the dedicated hosted adapter fixture.
- **SEC-001**: Hosted smoke must continue probing traversal, encoded traversal, `.env`, package/source exposure, and asset fallback behavior.
- **SEC-002**: Deploy commands must continue rejecting empty, placeholder, credentialed, query-bearing, broad, or parent-relative runtime values.
- **REL-001**: Version choice must be made immediately before publish:
  - `1.0.2-alpha.N` -> `1.0.2-rc.0` -> `1.0.2` when the release is corrective/hardening only.
  - `1.1.0-alpha.0` -> `1.1.0-rc.0` -> `1.1.0` when the release adds new public feature scope.
- **CON-001**: Do not call the release stable only because the current alpha gate passes. Stable requires public package install proof and release-target proof.
- **CON-002**: Do not promote WordPress, PHP-FPM, ISR, image optimization, auth/roles, or remote functions into the 1.x stable contract unless each feature has fixtures, docs, and hosted proof.
- **CON-003**: Do not require a real OS-native desktop wrapper for adapter stable. Native/Mica evidence remains browser-safe adapter metadata unless a separate host wrapper release exists.

## 2. Implementation Steps

### Implementation Phase 1 - Alpha publish readiness

- GOAL-001: Convert the current local/hosted alpha evidence into a public npm alpha that can be installed by a clean consumer.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Confirm the current package remains `1.0.2-alpha.0` in `package.json` unless a new alpha patch is required after this plan. | Yes | 2026-07-01 |
| TASK-002 | Run `bun run alpha:gate:hosted` with `ALPHA_SMOKE_BASE_URL=https://blog.canopydigital.ca/dev/sveltekitphp/` and preserve the passing `report/alpha-remote-smoke.json` evidence. | Yes | 2026-07-01 |
| TASK-003 | Run `npm pack --dry-run --json` and confirm the package contains only intended files from `package.json.files`. | Yes | 2026-07-01 |
| TASK-004 | Run `npm whoami`; if unauthenticated, authenticate the maintainer account without committing tokens or printing credentials. Current result: `E401 Unauthorized`; `bun run release:npm-state` now captures the same blocker plus registry and pack metadata without publishing. | Blocked | 2026-07-02 |
| TASK-005 | Publish the alpha using `npm publish --tag alpha` from the verified working tree. | No |  |
| TASK-006 | Create a clean external consumer fixture that installs `sveltekit-php@alpha` from npm, builds a `php-static` fixture, and confirms `index.php`, `.htaccess`, `router.php`, `_runtime/compat.php`, route manifest, and no-hydration fixture behavior. Script exists as `npm run alpha:published:smoke`; it cannot pass until `sveltekit-php@alpha` is published. | Blocked | 2026-07-01 |
| TASK-007 | Update `docs/ALPHA-READINESS.md`, `docs/ALPHA-HOSTED-DEV-PROOF.md`, `checklist.md`, and generated alpha report evidence with npm alpha publish and clean npm-install fixture proof. | No |  |

### Implementation Phase 2 - RC scope freeze

- GOAL-002: Decide whether the official RC is `1.0.2-rc.0` or `1.1.0-rc.0` and freeze the public contract.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-008 | Classify every remaining checklist item as release-blocking, post-stable, or explicitly unsupported for this 1.x line in `checklist.md`. | Yes | 2026-07-01 |
| TASK-009 | Choose `1.0.2-rc.0` if no new public adapter feature is added after alpha publish; choose `1.1.0-rc.0` if public adapter feature scope expands. Decision: `1.0.2-rc.0`, because current changes are corrective docs/verifier/root-router parity work, not new public adapter feature scope. | Yes | 2026-07-01 |
| TASK-010 | Freeze adapter public options, output file contract, package exports, runtime headers, environment names, report endpoint paths, and documented support boundaries in `docs/HOSTING-CONTRACT.md` and `docs/ALPHA-READINESS.md`. Added public options, package exports/files, env names, runtime headers, remote-functions boundary, and `public-contract-docs` release-prep guard. | Yes | 2026-07-01 |
| TASK-011 | Write release notes that distinguish supported, partial, unsupported, and future feature lanes: `php-static`, `js-ssr`, remote functions, Vite 8/plugin 7, WordPress, PHP-FPM, native wrapper evidence, and hosted deployment proof. Implemented in the generated release-note source and mirrored in readiness/release checklist docs. | Yes | 2026-07-01 |
| TASK-012 | Ensure `README.md` tells a new user what the adapter supports, what it does not support, and which mode to choose for static, PHP actions/data, and JS sidecar SSR. Added front-loaded mode choice guidance and remote-functions unsupported warning linked to the policy doc. | Yes | 2026-07-01 |
| TASK-013 | Update package metadata and release policy from alpha track to the chosen RC track, while keeping `publishConfig.tag` off `latest` until stable. | No |  |

### Implementation Phase 3 - Stable blocker closure

- GOAL-003: Resolve or explicitly defer remaining blockers that would make a stable 1.x release misleading or fragile.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-014 | Resolve root `router.php` parity risk by making it delegate to the shared generated router logic where practical, or by adding parity fixture tests that prove root and generated router safety behavior match. Implemented `scripts/verify-root-router-parity.mjs` and wired it into `v1:gate:local`. | Yes | 2026-07-01 |
| TASK-015 | Decide whether streaming deferred serialization parity is required for stable. If required, implement and test exact SvelteKit/devalue parity; if not, document it as unsupported/partial with a verifier marker. Decision: not required for stable; documented as a `php-static` support boundary with `js-ssr` as the exact streaming/deferred lane. | Yes | 2026-07-01 |
| TASK-016 | Tighten dev adapter status by converting remaining `Partial` checklist items into either tested dev-only behavior or explicitly unsupported future work. Dev adapter boundary doc/checklist now point at the focused smoke coverage for local/test stubs, production/CI rejection, explicit override, and deterministic 503 errors. | Yes | 2026-07-01 |
| TASK-017 | Audit root/package hygiene with `git status`, verify no scratch artifacts are tracked, and keep local generated/debug outputs ignored. | No |  |
| TASK-018 | Run the live blog SEO tool again from `B:\Temp\@Browser` and either fix or annotate expected private-route noise so the consumer proof does not hide known template issues. Fresh run `blog.ryanspice.com-root-20260701T060746Z-v0_4_9` scored `91` / `A-`; high findings are confined to intentionally private `/login`, and content-template issues remain explicit blog follow-up. | Yes | 2026-07-01 |
| TASK-019 | Validate the current Vite 8/plugin 7 lane in an isolated branch or fixture, then either upgrade intentionally or document the current Svelte 5/SvelteKit 2 same-major support boundary as the stable claim. `bun run alpha:latest-vite-major:smoke` passed on 2026-07-02 with npm-latest Vite 8/plugin 7 in a packed PHP/static fixture; dependency floors remain unchanged. | Yes | 2026-07-02 |
| TASK-020 | Run `bun run v1:gate:local` and resolve any failures without weakening stable release requirements. Added the Vite-major smoke to the local v1 gate, fixed the readiness unit fixture, tightened release-prep gate-chain verification, and `bun run v1:gate:local` passed. | Yes | 2026-07-01 |
| TASK-021 | Run `bun run v1:gate` with the final hosted release target and resolve any failures without replacing the release target with narrower proof. `v1:gate:hosted` now passes against `https://blog.canopydigital.ca/dev/sveltekitphp/` after hosted-gate skip-local composition, but the composed `bun run v1:gate` attempt was interrupted and is not counted as exact single-command evidence. | No |  |

### Implementation Phase 4 - RC publish and soak

- GOAL-004: Publish an official RC and prove it works from the registry, not only from the local checkout.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-022 | Bump package version to the chosen RC version, for example `1.0.2-rc.0` or `1.1.0-rc.0`. | No |  |
| TASK-023 | Run `bun run v1:gate` with the release hosted target and verify alpha/latest/report/package gates still pass under the RC version. | No |  |
| TASK-024 | Run `npm pack --dry-run --json`, inspect the file list, and publish with `npm publish --tag rc`. | No |  |
| TASK-025 | Install the RC from npm into a clean fixture and build/smoke `php-static`, no-hydration, PHP actions/data, base path, path safety, and `js-ssr` sidecar documented lanes. | No |  |
| TASK-026 | Update release notes, checklist, and docs with the exact npm package version, dist-tag, fixture proof, hosted proof URL, and known limitations. | No |  |
| TASK-027 | Soak the RC through real consumer use on `blog.ryanspice.com`/Canopy or a dedicated public fixture without adding unplanned features. | No |  |

### Implementation Phase 5 - Stable 1.x release

- GOAL-005: Publish the stable package to `latest` only after RC evidence proves the final release contract.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-028 | Confirm no release-blocking checklist item remains `Pending`, `Partial`, or `Verify` unless it is explicitly moved to unsupported/post-stable with docs and verifier coverage. | No |  |
| TASK-029 | Bump package version from RC to stable, for example `1.0.2` or `1.1.0`, and remove RC/alpha-only publish metadata as appropriate. | No |  |
| TASK-030 | Run `bun run v1:gate` against the final hosted target and keep the full command output as release evidence. | No |  |
| TASK-031 | Run `npm pack --dry-run --json` and inspect the stable package file list. | No |  |
| TASK-032 | Publish with `npm publish --tag latest` only after TASK-030 and TASK-031 pass. | No |  |
| TASK-033 | Install the stable version from npm in a clean consumer fixture and verify the same matrix used for RC. | No |  |
| TASK-034 | Tag the release in git, publish GitHub release notes, and update `checklist.md` with final stable proof. | No |  |

## 3. Alternatives

- **ALT-001**: Publish `1.0.0` stable directly. Rejected because npm already has `1.0.0` and `1.0.1`, and the current verified package is `1.0.2-alpha.0`.
- **ALT-002**: Rename the current package to `1.0.0-rc.0`. Rejected because it would move backward relative to the existing registry line and confuse consumers.
- **ALT-003**: Promote the hosted alpha gate directly to stable. Rejected because stable also needs public npm install proof, final release-target proof, and release-blocker classification.
- **ALT-004**: Expand scope to WordPress/PHP-FPM/remote functions before RC. Rejected for this release because those lanes need separate fixtures, hosted proof, and docs that would delay the stable core adapter contract.

## 4. Dependencies

- **DEP-001**: npm maintainer authentication for `sveltekit-php`.
- **DEP-002**: SSH/deploy access for `https://blog.canopydigital.ca/dev/sveltekitphp/` or the final hosted fixture target.
- **DEP-003**: Current Svelte 5/SvelteKit 2 same-major package availability refreshed on 2026-07-02: `svelte@5.56.4`, `@sveltejs/kit@2.69.0`, `@sveltejs/vite-plugin-svelte@7.1.2`, and `vite@8.1.3`.
- **DEP-004**: Existing Bun, Node, PHP, Playwright, and SvelteKit tooling used by the repo scripts.
- **DEP-005**: `seo_audit_python` for live blog consumer proof refresh.

## 5. Files

- **FILE-001**: `package.json` - version, dist-tag, release policy, files allowlist, scripts.
- **FILE-002**: `checklist.md` - release hardening tracker and stable blocker ledger.
- **FILE-003**: `docs/ALPHA-READINESS.md` - alpha/RC/stable evidence documentation.
- **FILE-004**: `docs/ALPHA-HOSTED-DEV-PROOF.md` - hosted proof workflow.
- **FILE-005**: `docs/HOSTING-CONTRACT.md` - stable runtime/deployment support contract.
- **FILE-006**: `docs/ADAPTER-FEATURE-CATALOG.md` - supported/partial/missing adapter feature matrix.
- **FILE-007**: `docs/ADAPTER-LANDSCAPE.md` - external adapter comparison and strategic scope.
- **FILE-008**: `README.md` - user-facing install and capability contract.
- **FILE-009**: `scripts/run-alpha-release-gate.mjs` - local alpha gate command orchestration.
- **FILE-010**: `scripts/run-hosted-alpha-gate.mjs` - hosted gate command orchestration.
- **FILE-011**: `scripts/verify-alpha-release-prep.mjs` - release-prep verifier.
- **FILE-012**: `scripts/verify-alpha-readiness.mjs` - alpha report verifier.
- **FILE-013**: `scripts/smoke-remote-alpha.mjs` - hosted remote smoke.
- **FILE-014**: `adapter/src/index.ts` - adapter public contract and support guards.
- **FILE-015**: `adapter/src/runtime/router/shared.ts` - shared router safety behavior.
- **FILE-016**: `router.php` - root compatibility router parity target.
- **FILE-017**: `tests/unit/router-parity.test.ts` - root/generated router parity evidence.
- **FILE-018**: `report/*` - generated evidence artifacts.

## 6. Testing

- **TEST-001**: `bun run alpha:gate:hosted` with `ALPHA_SMOKE_BASE_URL=https://blog.canopydigital.ca/dev/sveltekitphp/`.
- **TEST-002**: `bun run v1:gate:local`.
- **TEST-003**: `bun run v1:gate` with the final release hosted target.
- **TEST-004**: `npm pack --dry-run --json`.
- **TEST-004A**: `bun run release:npm-state`; after npm login, `bun run release:npm-state:strict`.
- **TEST-005**: clean npm consumer fixture installing `sveltekit-php@alpha`, then `sveltekit-php@rc`, then stable.
- **TEST-005A**: `npm run alpha:published:smoke` after `npm publish --tag alpha`.
- **TEST-006**: `bun run verify:latest-sveltekit-audit`.
- **TEST-007**: `bun run alpha:latest-same-major:smoke`.
- **TEST-007A**: `bun run alpha:latest-vite-major:smoke`.
- **TEST-008**: `bun run verify:release-prep`.
- **TEST-009**: `bun run verify:alpha`.
- **TEST-010**: `bun run verify:artifacts -- --strict`.
- **TEST-011**: `bun run test:unit`.
- **TEST-012**: `bun run test:php`.
- **TEST-013**: `bun run check`.
- **TEST-014**: live `seo_audit_python` crawl for `https://blog.ryanspice.com/`.

## 7. Risks & Assumptions

- **RISK-001**: npm registry already contains `1.0.0` and `1.0.1`, so the stable version must not move backward.
- **RISK-002**: `alpha:report:full` writes a skipped hosted-smoke placeholder by design; any final release evidence must restore real hosted smoke with `alpha:remote:smoke` or `alpha:gate:hosted`.
- **RISK-003**: The hosted fixture is target-specific. Passing `/dev/sveltekitphp` does not automatically prove every production host or final deployment target.
- **RISK-004**: Vite 8/plugin 7 drift could become a stable expectation if not explicitly validated or documented.
- **RISK-005**: Blog SEO findings can create noisy consumer proof if private routes and template issues are not fixed or annotated.
- **RISK-006**: Root `router.php` parity risk can undercut path-safety claims if it diverges from generated runtime behavior.
- **RISK-007**: Deferred streaming serialization may be misread as exact SvelteKit parity unless the support boundary is explicit.
- **ASSUMPTION-001**: Latest-package source/report evidence was refreshed on 2026-07-02; full local v1 gate evidence still comes from 2026-07-01 and must be rerun before release after today’s source changes.
- **ASSUMPTION-002**: The first official RC should be `1.0.2-rc.0` unless new public feature scope is added before RC.
- **ASSUMPTION-003**: Stable 1.x can ship without remote functions, WordPress plugin mode, PHP-FPM package mode, and native OS wrapper proof if those are explicitly out of scope.

## 8. Related Specifications / Further Reading

- `checklist.md`
- `docs/ALPHA-READINESS.md`
- `docs/ALPHA-HOSTED-DEV-PROOF.md`
- `docs/HOSTING-CONTRACT.md`
- `docs/ADAPTER-FEATURE-CATALOG.md`
- `docs/ADAPTER-LANDSCAPE.md`
- `docs/REMOTE-FUNCTIONS-ALPHA-POLICY.md`
- `README.md`

