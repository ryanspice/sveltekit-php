---
goal: Adopt the sveltekit-php 1.0.2 release candidate across Canopy Digital properties, update compatible framework dependencies, and capture consumer pain points with deploy evidence.
version: 1
date_created: 2026-08-24
last_updated: 2026-08-24
owner: Canopy Digital
status: proposed
tags:
  - release
  - sveltekit-php
  - canopy-digital
  - dependency-upgrade
  - deployment
---

# Canopy Digital subsidiary adoption plan

![Status: proposed](https://img.shields.io/badge/status-proposed-blue)

# Introduction

The adapter is locally close to a `1.0.2` release candidate, but it is not yet a publishable stable v1 update. The local release gate, declaration build, package smoke, current SvelteKit compatibility fixtures, and production-consumer tooling establish a credible candidate. Publication still requires npm authority, a published-package consumer smoke, current hosted functional evidence, and a production receipt tied to an immutable adapter version.

This plan upgrades the Canopy Digital portfolio in controlled waves. It separates adapter adoption from framework-major migrations, preserves the existing deployment topology, and records each site's failures as adapter or workflow feedback instead of masking them with a portfolio-wide dependency rewrite.

## 1. Requirements & Constraints

- Freeze an immutable `sveltekit-php` candidate commit and package version before changing consumers.
- Do not use an uncommitted local bundle as production provenance.
- Update the adapter independently from SvelteKit, Vite, and Astro major versions so regressions remain attributable.
- Preserve the main Canopy deployment and all `/sites` publishers; a main-site deploy must not remove subsidiary roots.
- Keep mutable runtime data outside public and OneDrive-synced build trees.
- Run shared-output blog builds serially to prevent one site from overwriting another site's output.
- Preserve each repository's package manager and lockfile conventions.
- Require deterministic build checks before deploy and route-level HTTP proof afterward.
- Capture an RC receipt for every SvelteKit consumer, including adapter version, commit, options profile, build result, deploy release, and live routes.
- Treat Astro 5 to Astro 7 as a separate two-major migration; Astro sites do not validate the SvelteKit adapter.
- Avoid broad commits in dirty consumer repositories; stage only reviewed dependency, adapter, test, and documentation changes.

## 2. Implementation Steps

### Phase 1: Freeze the adapter release candidate

| Task | Action | Exit evidence |
| --- | --- | --- |
| 1.1 | Commit the reviewed adapter hardening, public declarations, RC consumer proof tooling, and refreshed compatibility evidence on `sveltekit-php` `main`. | Immutable Git commit and clean path-scoped staging review. |
| 1.2 | Run `bun run v1:gate:local`, `bun run rc:consumer:smoke`, and `bun run release:npm-state`. | Local gate report, live consumer classification, and npm authority state. |
| 1.3 | Publish a `1.0.2` prerelease only after npm authentication is available, then install from the registry into an external fixture. | Registry tarball, integrity, and published-package smoke receipt. |
| 1.4 | Define a public provenance artifact that can survive ordinary hosting rules, rather than relying on an inaccessible dotfile path. | Documented JSON endpoint or public release receipt with schema validation. |

### Phase 2: Upgrade the Canopy main site

| Task | Action | Exit evidence |
| --- | --- | --- |
| 2.1 | Replace `B:\Dev\canopydigital.ca\web\local-adapter` with the frozen adapter artifact using the repository's established sync path. | Bundle and declaration hashes match the frozen candidate. |
| 2.2 | Build with the current site dependency set first. Run check, unit/security checks, EFSDB contract checks, production build, and SEO/prerender verification. | Passing adapter-only baseline and preserved external runtime root. |
| 2.3 | Update Svelte from `^5.56.4` to `5.56.10` and SvelteKit from `^2.69.0` to `2.70.3`; retain Vite 7 and plugin 6 for attribution. | Lockfile diff, checks, build, and route inventory. |
| 2.4 | Evaluate Vite `8.2.2` with `@sveltejs/vite-plugin-svelte` `7.3.0` as a separate change. | Dedicated compatibility result; no forced adoption if ecosystem or site tooling blocks it. |
| 2.5 | Deploy through the composed main-plus-subsidiary release workflow. | Main site, `/sites`, auth, EFSDB boundaries, and subsidiary routes all proven live. |

### Phase 3: Upgrade the primary SvelteKit subsidiaries

| Task | Action | Exit evidence |
| --- | --- | --- |
| 3.1 | Lancaster: adopt the frozen adapter first, then update SvelteKit/Svelte within current majors. | Build receipt covering the roughly 1,953-file artifact and live route probes. |
| 3.2 | 519 Trough: adopt the frozen adapter first; resolve current deprecation and accessibility warnings before attempting plugin 5/Vite 6 major jumps. | Warning ledger, successful build, and live route probes. |
| 3.3 | For both sites, test the Vite/plugin major update in isolated commits only after adapter and SvelteKit upgrades are green. | Per-site go/no-go decision with exact failing tool or plugin when blocked. |

### Phase 4: Upgrade Black Cedar Designs

| Task | Action | Exit evidence |
| --- | --- | --- |
| 4.1 | Replace the Git dependency pinned to commit `363df548...` with the frozen RC commit or registry prerelease. | Lockfile resolves the intended immutable version. |
| 4.2 | Run its build, tests, EFSDB/security contracts, and deploy verification without staging unrelated local documents. | Scoped diff plus build and live receipt. |
| 4.3 | Add Black Cedar to the same central deployment/provenance inventory used by `/sites`. | Portfolio inventory includes ownership, repository, publisher, URL, and adapter version. |

### Phase 5: Upgrade shared blog consumers

| Task | Action | Exit evidence |
| --- | --- | --- |
| 5.1 | Sync the older vendored blog adapter to the frozen candidate. | Adapter hash parity and declaration availability. |
| 5.2 | Build Ryan and Canopy variants serially with distinct runtime/cache/output roots. | Two independent receipts with no shared-output collision. |
| 5.3 | Update Svelte `5.45.6`, SvelteKit `2.49.1`, plugin `6.2.1`, and Vite `7.2.6` in staged same-major steps before considering Vite 8. | Per-step check/build results and preserved blog content behavior. |

### Phase 6: Upgrade Astro subsidiaries separately

| Task | Action | Exit evidence |
| --- | --- | --- |
| 6.1 | Keep `gentext.ai` and `app.gentext.ai` on their current Astro 5 baseline during adapter rollout. | Reproducible existing builds of approximately 2,077 and 8 pages. |
| 6.2 | Create an Astro 5-to-7 migration branch for each site, reviewing Node requirements, integrations, content collections, and output changes. | Migration checklist and build diff for each major boundary. |
| 6.3 | Deploy Astro upgrades independently from the SvelteKit adapter release. | Independent rollback point and live route proof. |

### Phase 7: Portfolio deployment waves and feedback

| Task | Action | Exit evidence |
| --- | --- | --- |
| 7.1 | Wave A: Canopy main and one small SvelteKit consumer. | 24-hour soak with live receipt and rollback artifact. |
| 7.2 | Wave B: Lancaster, 519, and Black Cedar. | All route probes, auth/runtime boundaries, and receipt validation pass. |
| 7.3 | Wave C: shared blogs, then Astro migrations. | Serial deployment evidence with no publisher-root deletion. |
| 7.4 | Convert recurring failures into adapter fixtures, documentation, or deploy-script guards. | Each pain point has an owner, reproduction, disposition, and regression check. |

## 3. Alternatives

### Bulk-update every dependency in one portfolio commit

Rejected because the portfolio spans SvelteKit and Astro, three Vite/plugin generations, and multiple adapter acquisition mechanisms. A bulk update would make build failures difficult to attribute and would couple rollback across otherwise independent sites.

### Publish stable `1.0.2` before consumer adoption

Rejected until a registry-installed external fixture and current production receipt pass. Local package correctness is necessary but does not prove npm packaging, hosting, rewrite, or deployment behavior.

### Continue vendoring unversioned adapter bundles

Not preferred as the long-term model. Vendoring can support immediate controlled adoption, but every copy must carry immutable provenance and hash parity. Registry prereleases or exact Git commits are easier to audit.

## 4. Dependencies

| Dependency | Current evidence | Target or decision |
| --- | --- | --- |
| `sveltekit-php` | Public latest `1.0.1`; local candidate `1.0.2-alpha.0` | Freeze and prove `1.0.2` RC before stable publication. |
| Svelte | Canopy `^5.56.4`; current latest `5.56.10` | Same-major update after adapter-only baseline. |
| SvelteKit | Canopy `^2.69.0`; current latest `2.70.3` | Same-major update after adapter-only baseline. |
| Vite | Portfolio spans 6 and 7; current latest `8.2.2` | Separate major migration per site. |
| `@sveltejs/vite-plugin-svelte` | Portfolio spans 5 and 6; current latest `7.3.0` | Upgrade with compatible Vite major in isolated changes. |
| Astro | Gentext sites use `^5.18.2`; current latest `7.2.4` | Separate two-major project, not part of adapter acceptance. |
| npm credentials | Current release authority not proven | Required for prerelease/stable publication only. |
| Hosting and deploy credentials | Existing publishers restored and live | Required for immutable release receipts and rollback testing. |

## 5. Files

| Path | Role |
| --- | --- |
| `B:\Dev\sveltekit-php\package.json` | Package exports, version, and release gates. |
| `B:\Dev\sveltekit-php\adapter\index.js` | Canonical generated adapter bundle. |
| `B:\Dev\sveltekit-php\adapter\declarations` | Public TypeScript declaration surface. |
| `B:\Dev\sveltekit-php\release\consumer-profiles\canopy-sites.json` | Production consumer route and evidence profile. |
| `B:\Dev\canopydigital.ca\web\package.json` | Main Canopy dependency baseline. |
| `B:\Dev\canopydigital.ca\web\local-adapter` | Main Canopy adapter copy that must match the frozen candidate. |
| `B:\Dev\canopydigital.ca\web\scripts` | Existing build, deploy, EFSDB, and composed-site workflow. |
| `B:\Dev\Lancaster\package.json` | Lancaster dependency and build surface. |
| `B:\Dev\519trough\package.json` | 519 dependency and build surface. |
| `B:\Dev\BlackCedarDesigns\package.json` | Black Cedar Git-pinned adapter and dependency surface. |
| Shared blog repository package and adapter paths | Ryan and Canopy serial build consumers; resolve exact active checkout before editing. |
| Gentext and App Gentext package manifests | Astro migration surfaces; resolve exact active checkout before editing. |

## 6. Testing

1. Adapter: `bun run v1:gate:local` and artifact/type synchronization.
2. Package: pack tarball, inspect allowlist, install into an external fixture, and import both JavaScript and declarations.
3. Consumer baseline: build every SvelteKit consumer with only the adapter changed.
4. Dependency steps: run the repository's check, lint, unit, security, EFSDB, prerender, and production build commands after each coherent version change.
5. Deployment: verify canonical URL, deep routes, assets, redirects, auth/CSRF, protected API behavior, and public runtime-state exclusion.
6. Portfolio preservation: prove the main deployment leaves all subsidiary document roots intact.
7. Provenance: validate every receipt against the candidate commit/package integrity and consumer options profile.
8. Soak: monitor Wave A before broad rollout; preserve the prior known-good release and document rollback commands.

## 7. Risks & Assumptions

| Risk or assumption | Impact | Mitigation |
| --- | --- | --- |
| Adapter adoption is inconsistent: local copy, vendored bundle, and Git pin. | Drift can pass unnoticed and production cannot be traced to a release. | Standardize receipts now; converge on registry prerelease or exact Git pin. |
| A public provenance marker may be blocked by dotfile hosting rules. | RC consumer smoke cannot prove the deployed adapter. | Use a non-dot public JSON route or signed release receipt. |
| Main and subsidiary publishers are separate. | A main deploy can remove or overwrite subsidiary roots. | Make composed deployment and post-deploy root inventory mandatory. |
| Canopy development and build processes can collide over generated directories. | False build failures and corrupted evidence. | Stop conflicting servers or isolate generated/runtime roots before gates. |
| Lancaster and Gentext produce large artifact trees. | Slow hashing, deployment, and rollback storage pressure. | Use manifests, incremental upload where safe, and bounded retained backups. |
| 519 starts farther behind on Vite/plugin versions and has warnings. | Major upgrades may expose real source defects. | Clear warnings and upgrade one boundary at a time. |
| Shared blog variants can target the same mutable output. | One build can overwrite the other. | Serialize builds and assign explicit variant-specific roots. |
| Astro latest is two majors ahead. | Migration cost is unrelated to adapter quality. | Keep it outside the adapter release gate and deploy independently. |
| Most repos do not expose a uniform package-manager declaration. | Automation may choose the wrong install command. | Detect lockfile and document the canonical command per consumer. |
| Prior emergency deploys may have skipped durable rollback archives due storage. | Recovery time increases. | Require a verified remote release pointer and bounded local/remote rollback retention. |

## 8. Related Specifications / Further Reading

- `B:\Dev\sveltekit-php\plan\process-alpha-to-1x-rc-1.md`
- `B:\Dev\sveltekit-php\docs\ALPHA-RELEASE-CHECKLIST.md`
- `B:\Dev\sveltekit-php\docs\ALPHA-LATEST-SVELTEKIT-AUDIT.md`
- `B:\Dev\sveltekit-php\docs\RC-CONSUMER-PROOF.md`
- `B:\Dev\sveltekit-php\docs\ADAPTER-LANDSCAPE.md`
- `B:\Dev\sveltekit-php\release\consumer-profiles\canopy-sites.json`
