---
goal: Adopt the sveltekit-php 1.0.2 release candidate across Canopy-controlled SvelteKit properties and capture deployment pain points.
version: 2
date_created: 2026-08-24
last_updated: 2026-08-24
owner: Canopy Digital
status: 'In progress'
tags:
  - release
  - sveltekit-php
  - canopy-digital
  - dependency-upgrade
  - handoff
---

# Introduction

![Status: In progress](https://img.shields.io/badge/status-In%20progress-yellow)

This is the execution handoff for adopting the `sveltekit-php` `1.0.2` release candidate across Canopy Digital properties. Commit `3c7da04` on local `sveltekit-php` `main` is the frozen code baseline. The local v1 gate passed; npm publication, a registry-installed smoke, non-dot deployment provenance, and a refreshed hosted dynamic-PHP fixture remain release gates.

The only authoritative Lancaster and 519 public surfaces in this plan are the Canopy-controlled archives below. Standalone domains are out of scope because Canopy Digital no longer controls them.

- `https://canopydigital.ca/sites/lancasterfbc.ca/`
- `https://canopydigital.ca/sites/519troughandexterior.ca/`

Handoff boundary: execute SvelteKit adapter and dependency adoption through Phase 7. Leave Gentext and App Gentext on their current Astro 5 baselines; the deferred Astro migration in Phase 8 requires a separate owner instruction.

## 1. Requirements & Constraints

- **REQ-001**: Use commit `3c7da04` or an immutable registry prerelease derived from it as the adapter baseline.
- **REQ-002**: Treat only `canopydigital.ca/sites/*` routes as Lancaster and 519 production acceptance surfaces.
- **REQ-003**: Emit `sveltekit-php.json` at each controlled archive root with `adapterVersion` and `adapterBundleSha256` fields.
- **REQ-004**: Update the adapter before changing Svelte, SvelteKit, Vite, or the Svelte Vite plugin.
- **REQ-005**: Preserve the Canopy main site and every `/sites` document root during composed deployment.
- **REQ-006**: Capture a receipt containing adapter version, commit, bundle hash, options profile, build result, deploy release, and live route results.
- **CON-001**: Do not use uncontrolled standalone domains as health, redirect, DNS, canonical, or release checks.
- **CON-002**: Keep mutable runtime data outside public and OneDrive-synchronized build trees.
- **CON-003**: Run shared-output blog builds serially with distinct runtime, cache, and output roots.
- **CON-004**: Preserve each repository's established package manager and lockfile.
- **CON-005**: Do not stage unrelated changes from dirty consumer repositories.
- **CON-006**: Do not start the Astro 5-to-7 migration in this handoff.
- **SEC-001**: Never include credentials, private deployment hosts, private source paths, or runtime state in public provenance.
- **GUD-001**: Keep adapter adoption, same-major framework updates, and Vite/plugin major updates in separate commits.

## 2. Implementation Steps

### Implementation Phase 1: Freeze and publish the adapter candidate

- GOAL-001: Convert the locally green candidate into an immutable installable prerelease.

| Task     | Description                                                                                                                        | Completed | Date       |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-001 | Commit adapter hardening, declarations, consumer proof tooling, and compatibility evidence on `sveltekit-php` `main` as `3c7da04`. | ✅        | 2026-08-24 |
| TASK-002 | Run `bun run v1:gate:local`; retain the green local gate evidence.                                                                 | ✅        | 2026-08-24 |
| TASK-003 | Push `3c7da04` after owner review.                                                                                                 |           |            |
| TASK-004 | Restore npm authentication and publish `1.0.2-alpha.0` or the selected RC prerelease.                                              |           |            |
| TASK-005 | Install the published tarball into an external fixture and run JavaScript import, declaration, PHP-static, and JS-SSR smoke tests. |           |            |

### Implementation Phase 2: Establish Canopy-controlled production proof

- GOAL-002: Make production acceptance independent of domains Canopy does not control.

| Task     | Description                                                                                                           | Completed | Date       |
| -------- | --------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-006 | Remove standalone Lancaster and 519 mirror URLs from `release/consumer-profiles/canopy-sites.json`.                   | ✅        | 2026-08-24 |
| TASK-007 | Make mirror checks optional in `scripts/smoke-rc-consumers.mjs` and profile validation.                               | ✅        | 2026-08-24 |
| TASK-008 | Configure the profile to request non-dot `sveltekit-php.json` provenance beneath each Canopy archive root.            | ✅        | 2026-08-24 |
| TASK-009 | Update Lancaster and 519 publishers to emit sanitized `sveltekit-php.json` documents matching the frozen bundle hash. |           |            |
| TASK-010 | Run `bun run rc:consumer:smoke` and `bun run rc:consumer:verify`; require both Canopy archive consumers to pass.      |           |            |

### Implementation Phase 3: Upgrade the Canopy main site

- GOAL-003: Adopt the adapter and current same-major Svelte dependencies without coupling a Vite major migration.

| Task     | Description                                                                                                                                            | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---- |
| TASK-011 | Synchronize `B:\Dev\canopydigital.ca\web\local-adapter` from the frozen candidate using the repository's established sync script.                      |           |      |
| TASK-012 | Verify exact bundle and declaration hash parity before changing dependencies.                                                                          |           |      |
| TASK-013 | Run the existing check, unit/security, EFSDB, production-build, SEO, and prerender gates against the adapter-only change.                              |           |      |
| TASK-014 | Update Svelte from `^5.56.4` to `5.56.10` and SvelteKit from `^2.69.0` to `2.70.3`; retain Vite 7/plugin 6.                                            |           |      |
| TASK-015 | Rerun all Canopy gates and record failures against the adapter-only baseline.                                                                          |           |      |
| TASK-016 | Evaluate Vite `8.2.2` and `@sveltejs/vite-plugin-svelte` `7.3.0` in a separate commit; do not block the adapter rollout if this major migration fails. |           |      |

### Implementation Phase 4: Upgrade Lancaster and 519

- GOAL-004: Adopt the same immutable adapter across both Canopy archive publishers.

| Task     | Description                                                                                                                                            | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- | ---- |
| TASK-017 | Lancaster: synchronize the frozen adapter, emit provenance, build, and probe the Canopy archive root, representative routes, assets, and 404 behavior. |           |      |
| TASK-018 | Lancaster: update Svelte/SvelteKit within current majors, then evaluate Vite/plugin majors separately.                                                 |           |      |
| TASK-019 | 519: synchronize the frozen adapter, emit provenance, build, and probe the Canopy archive root, representative routes, assets, and 404 behavior.       |           |      |
| TASK-020 | 519: resolve existing deprecation/accessibility warnings before separately advancing plugin 5/Vite 6 major boundaries.                                 |           |      |

### Implementation Phase 5: Upgrade Black Cedar Designs

- GOAL-005: Replace the stale adapter Git pin and include Black Cedar in portfolio receipts.

| Task     | Description                                                                                                            | Completed | Date |
| -------- | ---------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-021 | Replace the adapter dependency pinned to `363df548...` with the frozen commit or registry prerelease.                  |           |      |
| TASK-022 | Run Black Cedar build, tests, EFSDB/security checks, and controlled live probes without staging unrelated local files. |           |      |
| TASK-023 | Add Black Cedar repository, publisher, controlled URL, and adapter version to the central portfolio inventory.         |           |      |

### Implementation Phase 6: Upgrade shared blog consumers

- GOAL-006: Remove vendored adapter drift without allowing Ryan and Canopy variants to overwrite each other.

| Task     | Description                                                                                                                   | Completed | Date |
| -------- | ----------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-024 | Synchronize the shared blog's older vendored adapter to the frozen candidate.                                                 |           |      |
| TASK-025 | Build Ryan and Canopy variants serially with explicit distinct runtime, cache, and output roots.                              |           |      |
| TASK-026 | Update Svelte `5.45.6`, SvelteKit `2.49.1`, plugin `6.2.1`, and Vite `7.2.6` in attributable steps before considering Vite 8. |           |      |

### Implementation Phase 7: Deploy in controlled waves

- GOAL-007: Produce rollback-safe production evidence without deleting subsidiary roots.

| Task     | Description                                                                                                                                 | Completed | Date |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- |
| TASK-027 | Wave A: deploy Canopy main plus one small SvelteKit consumer; preserve all existing `/sites` roots and retain a rollback pointer.           |           |      |
| TASK-028 | Soak Wave A for 24 hours and validate canonical Canopy routes, assets, auth, CSRF, protected APIs, runtime-state exclusion, and provenance. |           |      |
| TASK-029 | Wave B: deploy Lancaster, 519, and Black Cedar; validate each controlled URL and receipt.                                                   |           |      |
| TASK-030 | Wave C: deploy shared blog variants serially and validate that neither variant overwrites the other.                                        |           |      |
| TASK-031 | Convert every recurring failure into an adapter fixture, documentation correction, or composed-deploy guard with an assigned owner.         |           |      |

### Implementation Phase 8: Astro subsidiaries deferred

- GOAL-008: Preserve current Gentext services while deferring the unrelated two-major Astro migration.

| Task     | Description                                                                                                          | Completed | Date       |
| -------- | -------------------------------------------------------------------------------------------------------------------- | --------- | ---------- |
| TASK-032 | Leave `gentext.ai` and `app.gentext.ai` on Astro `^5.18.2`; do not alter dependencies or deployment in this handoff. | ✅        | 2026-08-24 |
| TASK-033 | Create a separate Astro 5-to-7 migration plan only after explicit owner instruction.                                 |           |            |

## 3. Alternatives

- **ALT-001**: Continue testing uncontrolled standalone domains. Rejected because their DNS and redirect behavior is outside Canopy Digital's authority and cannot be a release criterion.
- **ALT-002**: Keep `.well-known/sveltekit-php.json`. Rejected because the production host returns HTTP 403 for the dotfile path.
- **ALT-003**: Bulk-update all portfolio dependencies. Rejected because adapter, framework, Vite/plugin, and Astro failures would become indistinguishable.
- **ALT-004**: Publish stable `1.0.2` before a registry-installed and hosted proof. Rejected because local package correctness does not prove registry or hosting behavior.

## 4. Dependencies

- **DEP-001**: Local adapter baseline commit `3c7da04`.
- **DEP-002**: npm authentication with authority to publish `sveltekit-php`.
- **DEP-003**: Canopy composed deployment credentials and rollback mechanism.
- **DEP-004**: Canopy main target Svelte `5.56.10` and SvelteKit `2.70.3`.
- **DEP-005**: Optional isolated Vite `8.2.2` and plugin `7.3.0` evaluation.
- **DEP-006**: A current hosted functional fixture for PHP actions, loads, and endpoints.

## 5. Files

- **FILE-001**: `B:\Dev\sveltekit-php\release\consumer-profiles\canopy-sites.json` — controlled production URL and provenance contract.
- **FILE-002**: `B:\Dev\sveltekit-php\scripts\smoke-rc-consumers.mjs` — optional mirror and controlled archive probes.
- **FILE-003**: `B:\Dev\sveltekit-php\scripts\utils\rc-consumer-evidence.mjs` — profile and receipt validation.
- **FILE-004**: `B:\Dev\sveltekit-php\docs\RC-CONSUMER-PROOF.md` — operator-facing proof boundary.
- **FILE-005**: `B:\Dev\canopydigital.ca\web\local-adapter` — main-site adapter copy.
- **FILE-006**: `B:\Dev\canopydigital.ca\web\scripts` — build, EFSDB, composed deploy, and route verification workflows.
- **FILE-007**: Lancaster, 519, Black Cedar, and shared-blog package manifests, lockfiles, adapter sources, and publisher scripts.

## 6. Testing

- **TEST-001**: Run `bun run verify:rc-consumer-profile` after every profile change.
- **TEST-002**: Run the `tests/unit/rc-consumer-evidence.test.ts` unit suite, including optional-mirror and provenance-path validation.
- **TEST-003**: Run `bun run rc:consumer:smoke`; require only Canopy-controlled URLs and non-dot provenance.
- **TEST-004**: Run `bun run v1:gate:local` before prerelease publication.
- **TEST-005**: Install the registry tarball into an external fixture and test JavaScript, declarations, PHP-static, and JS-SSR behavior.
- **TEST-006**: Run each consumer's deterministic checks after adapter-only, framework, and Vite/plugin steps.
- **TEST-007**: After deployment, verify main, deep routes, assets, 404s, auth/CSRF, protected APIs, runtime-state exclusion, provenance, and preservation of every `/sites` root.

## 7. Risks & Assumptions

- **RISK-001**: Local, vendored, and Git-pinned adapter copies can drift. Mitigation: require immutable version and hash receipts.
- **RISK-002**: Main and subsidiary publishers can overwrite separate document roots. Mitigation: require composed deployment and post-deploy root inventory.
- **RISK-003**: Lancaster and Gentext generate large artifact trees. Mitigation: use manifests, bounded retained backups, and incremental transfer where safe.
- **RISK-004**: 519 is farther behind on Vite/plugin versions and has source warnings. Mitigation: clear warnings and advance one major boundary at a time.
- **RISK-005**: Shared blog builds can collide. Mitigation: serialize builds and isolate mutable roots.
- **ASSUMPTION-001**: `canopydigital.ca/sites/lancasterfbc.ca/` and `canopydigital.ca/sites/519troughandexterior.ca/` remain under Canopy Digital control.
- **ASSUMPTION-002**: Uncontrolled standalone domain behavior is intentionally ignored even when it changes.
- **ASSUMPTION-003**: Astro/Gentext work remains deferred until separately authorized.

## 8. Related Specifications / Further Reading

- `B:\Dev\sveltekit-php\plan\process-alpha-to-1x-rc-1.md`
- `B:\Dev\sveltekit-php\docs\ALPHA-RELEASE-CHECKLIST.md`
- `B:\Dev\sveltekit-php\docs\ALPHA-LATEST-SVELTEKIT-AUDIT.md`
- `B:\Dev\sveltekit-php\docs\RC-CONSUMER-PROOF.md`
- `B:\Dev\sveltekit-php\docs\ADAPTER-LANDSCAPE.md`
- `B:\Dev\sveltekit-php\release\consumer-profiles\canopy-sites.json`
