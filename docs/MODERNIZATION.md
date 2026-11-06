# SvelteKit PHP security and modernization plan

Reviewed October 23, 2026. Original baseline: `main`, `202e692676f40495c58980f72832720ac0b4fc36`, local version `1.1.0-alpha.0`. Scope: adapter/runtime source, prior reviews, upstream security changes, agent workflow and GitHub presentation. The first local fix wave is implemented on `codex/security-hardening-20261023`; see the [implementation receipt](security/implementation-20261023.md). Deployment and publication remain open.

For the current candidate and acceptance boundaries, start with [INTENT](../INTENT.md), the [hosting contract](HOSTING-CONTRACT.md), and the dated [implementation](security/implementation-20261023.md) and [migration](security/kit3-migration-20261025.md) receipts. The older release plans and audits below retain their original version, registry, authentication and gate-count observations; those observations do not establish current release readiness.

## October 23 review and implementation evidence

- At the October 23 review, existing changes to `adapter/index.js`, `adapter/src/runtime/router/shared.ts`, RC consumer docs/profile/scripts/tests, and untracked agent material were protected. The November 6 artifact cleanup preserved historical reports, prompts and guides in `.ai/archive/`; it removed only verified-empty sidecars and inactive project-local Codegraph residue. Exact paths and hashes are recorded in `.ai/evidence/integration-20261106/artifact-cleanup.json`.
- Original dirty bundle SHA-256: `49744F5084AD7C8713757023C5EE8CC6B52AF48EF39516B295676F2BA6D4C110`. The October 6 compatibility receipt describes a different bundle; it is historical evidence. The implementation receipt binds the fresh packed-consumer result to the current bundle.
- Review-baseline lockfile: Kit **2.49.2**, Svelte **5.46.1**, Vite **7.3.0**, plugin **6.2.1**, devalue **5.6.1**. The implementation resolves Kit **2.70.3**, Svelte **5.57.2**, Vite **7.3.7**, plugin **6.2.1**, devalue **5.9.4**. The peer range permits Kit 2/3; consumer graphs still need their own updates.
- `bun run check`: **PASS**, 0 errors/0 warnings, October 23. The old October 6 note about a dirty-test type error does not describe this current check result.
- Independent read-only source review returned four findings. A PHP CLI probe against existing `build-e2e-js-ssr-root/router.php` found `/server/handler.mjs` delegated to static serving (`return false`, status 200). This is router control-flow evidence, not an HTTP host test or a fresh build.
- No full unit/build/browser/Kit matrix, artifact rebuild, hosted gate or npm publish ran for this documentation review. The review covers accessible primary sources and local artifacts; it does not claim every public review has been found.

## Recent upstream synthesis and implications

| Primary source/date | Finding | Local implication and action |
| --- | --- | --- |
| [PHP release, Oct 21](https://www.php.net/archive/2026.php#2026-10-21-5) | Critical engine fixes apply to PHP-FPM and other web SAPIs. | Inventory actual host runtimes; patch/recycle workers. Fixed releases include 8.5.12 / 8.4.27 / 8.3.36 / 8.2.35, or verified vendor backports. Shared hosting is not an exemption. |
| [PHP Foundation synthesis, Oct 21](https://thephp.foundation/blog/2026/10/21/todays-php-security-release-and-how-were-strengthening-php-security/) | Explains external audits, AI-assisted report volume, root-cause validation and decision ownership. | Use bounded independent reviews plus reproductions and deterministic acceptance. This review read the synthesis, not every underlying audit report. |
| [SvelteKit 3 migration](https://svelte.dev/docs/kit/migrating-to-sveltekit-3), [adapter API](https://svelte.dev/docs/kit/writing-adapters) | Kit 3 requires Node >=22.17, TS 6, Svelte >=5.57.1, Vite >=8.0.12, plugin 7; config and builder APIs change. CSRF is always on in Kit's JS runtime. | Preserve pinned Kit 2/3 lanes. Migrate development app separately from adapter compatibility. PHP-generated actions need their own equivalent enforcement. |
| [Windows preview traversal, Oct 5](https://github.com/sveltejs/kit/security/advisories/GHSA-xgrj-p7pg-6vm3) | Kit preview on Windows can disclose files; patched 3.0.0. Dev/production adapters have different exposure. | Locked Kit 2.49.2 is affected for preview. Keep preview local/restricted while migrating; do not label this a PHP production-router exploit. |
| [Self-fetch redirect SSRF, Oct 5](https://github.com/sveltejs/kit/security/advisories/GHSA-prjg-x2qj-wj3g) | Origin-influenced fallbacks followed redirects; fixed 3.0.0, initial origin still needs validation. | Review sidecar origin construction and consumers' self-fetch paths; configure fixed origin/trusted boundary and test spoofing. |
| [Enhanced-form redirect, Oct 5](https://github.com/sveltejs/kit/security/advisories/GHSA-pfhg-q3qv-9q6r) | Catch-all/double-slash action paths can cause open redirects; fixed 3.0.0. | Test leading-slash normalization and enhanced/native parity. |
| [Prerender cache-header XSS, Oct 5](https://github.com/sveltejs/kit/security/advisories/GHSA-27mw-82g8-phjj) | Untrusted cache-control set during prerender can enter HTML; fixed 3.0.0. | Consumers should use trusted cache policies and rebuild affected output. Applicability needs an untrusted header source. |
| [Accept-header ReDoS, Jul 29](https://github.com/sveltejs/kit/security/advisories/GHSA-29g2-3rmr-qm68) | Kit 2.70.2 is the documented fixed release; header limits affect exposure. | Upgrade the Kit 2 compatibility lane to a patched release, retaining explicit exceptions for October issues fixed in Kit 3. |
| [Svelte DOM clobbering](https://github.com/sveltejs/svelte/security/advisories/GHSA-rcqx-6q8c-2c42), [SSR spread XSS](https://github.com/sveltejs/svelte/security/advisories/GHSA-pr6f-5x2q-rwfp), [hydratable serialization](https://github.com/sveltejs/svelte/security/advisories/GHSA-f3cj-j4f6-wq85), May 14 | Fixed 5.55.7; exploit preconditions differ. | Locked 5.46.1 is affected by applicable ranges; patch/rebuild and audit untrusted data paths. Kit 3's minimum is higher. |
| [Vite WebSocket file read, Apr 6](https://github.com/vitejs/vite/security/advisories/GHSA-p9ff-h696-f583), [middleware script issue](https://github.com/vitejs/vite/security/advisories/GHSA-9jrq-w75r-8gcw), [non-Windows fs allow bypass](https://github.com/vitejs/vite/security/advisories/GHSA-rq7h-c2jc-7f22), Oct 6 | Locked 7.3.0 predates fixes; October fixes include 7.3.7 / 8.3.3. | Patch compatible lane first; assess each server's exposure/platform. Keep new Vite 8 migration isolated. |
| [devalue shared-memory disclosure, Sep 18](https://github.com/sveltejs/devalue/security/advisories/GHSA-j22f-vq7h-c4qm), [malformed-input DoS, Aug 27](https://github.com/sveltejs/devalue/security/advisories/GHSA-9rgm-9g3h-6x36), [defensive key hardening, Sep 18](https://github.com/sveltejs/devalue/security/advisories/GHSA-4q55-j62x-fr9h) | Shared-buffer serialization fixed 5.9.3; other parsing/serialization hardening also landed. | Upgrade the actual graph to a current compatible release >=5.9.3; verify Buffer/view isolation and untrusted parse limits. Audit source and bundled consumer copies. |

The official [Kit advisory index](https://github.com/sveltejs/kit/security/advisories) also lists July remote-form payload/prototype issues and May `query.batch` cross-talk. The adapter's remote-functions build rejection narrows those production paths, but does not replace a dependency update for the dev app or sidecar. The [devalue index](https://github.com/sveltejs/devalue/security/advisories) lists additional September sparse-array/string-allocation and async/reviver issues; inspect the full resolved graph and actual API use before closing the dependency task.

Registry snapshot checked October 23: **Kit 3.1.0, Svelte 5.57.2, Vite 8.3.5, plugin 7.3.1, devalue 6.0.3**. Patch compatible devalue 5.x resolutions first; a 6.x move is a separate API/consumer migration. `sveltekit-php` has **latest 1.0.1 only**; no alpha tag. Registry metadata is not compatibility or publication proof for this local candidate.

**Kit 3 development-app migration candidate — October 25, 2026:** the working checkout resolves `@sveltejs/kit@3.1.0`, Svelte 5.57.2, Vite 8.3.5, plugin 7.3.1 and TypeScript 6.0.3. Flat Vite configuration, package imports, route resolution, error props and form callbacks replace the removed Kit 2 interfaces. Browser checks exposed additional PHP action-envelope, prerendered-endpoint, exact-data-template, inline-hydration and multipart-proxy defects. Fixes are prepared, but the migration exception remains open until fresh source/generated, type, build and browser gates pass for the final proxy candidate. October 25 command delivery stalled before those checks could complete; no migration commits were created. The [migration receipt](security/kit3-migration-20261025.md) records the candidate, checks, agent ownership and open gates. The preceding advisory table describes the original review baseline; its locked-version observations are historical.

## Review findings and implementation targets

| ID | Priority and evidence | Fix scope | Required checks |
| --- | --- | --- | --- |
| A-01 | P1: `adapter/src/index.ts:997–1014` writes the server bundle inside public output. `runtime/htaccess-templates.ts:21` reuses static rules; `runtime/htaccess/php-static.ts:110–135` and `runtime/router/shared.ts:135–138` allow existing server files. | Separate private server output and deny server/runtime source before all static shortcuts. Preserve public assets. | Apache, Nginx and PHP-built-in HTTP tests; server handler/manifest/chunks and encoded/case variants denied at root and base. Packed output contains no public private-source tree. |
| A-02 | P1: `runtime/php-templates.ts:708–748` dispatches PHP POST actions without Origin validation. Cookie/session-backed consumer actions can be exposed. | Canonical origin and explicit missing/null-Origin policy before action dispatch; documented trusted-origin exceptions. | Ordinary/named/enhanced/multipart/direct-shim actions, root/base, cross-origin/null/missing origins; rejected requests never execute handlers. |
| A-03 | P1 at review baseline: `runtime/js-ssr-templates.ts:18–20`, `79`, `118` trusted forwarded origin/address and bound all interfaces. | Implemented loopback default, explicit binding, canonical origin validation, trusted-peer policy, direct-sidecar body limit. | Direct/proxied spoofing and oversized bodies passed locally. Set the same `SK_ORIGIN` on PHP and Node; see the updated hosting contract. TLS/host acceptance remains open. |
| A-04 | P2: August latest-audit and 1.0.2 checklist differ from October 1.1 candidate; old hosted reports are skipped/failed/expired; bundle hash differs from October fixture receipt. | Single candidate/evidence record, freshness/hash checks and clear local/hosted/published state. | Reject stale/mismatched receipts and unsupported release claims. Correct nonexistent alpha install guidance. |

Runtime paths abbreviated in A-01–A-03 are beneath `adapter/src/`. A-01 through A-03 now have focused local fix commits and regression checks. The source evidence above describes the original baseline; it is not a live exploit or disclosure of consumer secrets. A-04's broader release-receipt consolidation remains open; the new implementation receipt records this candidate without replacing unrelated dirty consumer work.

## Reviews and syntheses found

| Artifact | Disposition |
| --- | --- |
| `docs/AUDIT-2026-01-15.md` | Early headers/cookies audit; old PHP floor/coverage claims are historical. |
| `docs/AUDIT-2026-01-19.md`, `AUDIT-2026-01-20.md`, related EXECUTE docs | Early app/dev reviews and execution plans; revalidate against current source. |
| `docs/AUDIT-2026-01-23-ROUTING.md`, related CHAT synthesis | Routing mismatch history; later mode contracts supersede it as implementation truth. |
| `.ai/archive/legacy-20260805/runs/20260805-005751/final/AUDIT-2026-08-05.md` | Five attempted lanes, three usable reports, two explicit summarization gaps. Not five-reviewer consensus. Local private audit material is not automatically public documentation. |
| `.ai/archive/legacy-20260805/runs/20260805-014805/final/SUMMARY.md`, [PR #1](https://github.com/ryanspice/sveltekit-php/pull/1) | Follow-up fixes and conditional review disposition, historical deterministic gates, npm/host limits. Reconcile final merged source rather than reapplying the initial audit list. |
| `.ai/archive/hermes-sidecars-20261106/` | July document proposals and their prompts, preserved with original relative paths. Root-router, contract, mode-choice, dev-boundary and release-plan recommendations are represented in maintained docs; their old version/authentication observations remain historical. |
| `.ai/archive/legacy-20260805/skills/sveltekit-php-adapter/SKILL.md` | Historical local guide. Its `svelte.config.js` entrypoint and future-platform-emulation note are superseded by the current repository instructions and development/hosting contracts. |
| `docs/ALPHA-LATEST-SVELTEKIT-AUDIT.md`, Aug 24 | Useful adapter landscape and latest-major synthesis; stale as a current version snapshot. |
| `docs/SVELTEKIT-3-COMPATIBILITY.md`, `report/kit-compatibility.json`, Oct 6 | Pinned Kit 2/3 historical package/build/PHP/HTTP proof with exact bundle hash and exclusions; not acceptance for the current dirty candidate. |
| `docs/HOSTING-CONTRACT.md`, RC/remote-functions policy docs | Hosting contract updated with the implemented origin/proxy/body controls; unrelated dirty RC consumer work is preserved. Ordinary FPM hosting is distinct from the explicitly excluded special PHP-FPM package mode. |

Preserve existing nowdoc emission, safe build-root guards, Windows sensitive-root denial, strict prepack artifact sync, cookie/header forwarding and remote-function rejection. The pre-existing dirty case-insensitive `_protected` denial and regression test are already present; this review does not claim them as newly implemented.

## August residuals reconciled on November 6, 2026

The follow-up merge commit `363df54871fe4fe9692b0d16cab46bcc088a5758` is an ancestor of the inspected checkout. Its original findings are historical inputs, not a fresh fix list. The following dispositions come from current source inspection only; no build, runtime, hosted or publication acceptance was run for this documentation synthesis.

| Recorded residual | Current disposition |
| --- | --- |
| `js-ssr` sibling-collision cleanup may leave a public duplicate. | Still requires focused verification. In `adapter/src/index.ts`, the public prerender copy precedes collision handling, while the sibling branch removes `pageFile` from `prerenderedRoot`. The later private `<out>-server/` isolation addresses server-source exposure, not this output-copy question. A generated-output and HTTP fixture must establish closure. |
| `prepack` requires Bun. | Retained tooling requirement: `package.json` invokes `bun run verify:artifacts -- --strict`. Preserve strict artifact verification and supply the required tool in packaging environments. |
| `verifyVersionDrift` excludes prose. | Retained check boundary: `scripts/verify-alpha-release-prep.mjs` scans `.mjs` files under `scripts/`. Its pass result does not certify release-version prose; the historical banners in the older documents make that distinction explicit. |
| The example redirect cookie derives `Secure` from the request protocol. | Still present in `src/hooks.server.js`. The hosting contract now requires explicit canonical-origin/proxy configuration; actual TLS/proxy behavior remains a host acceptance gate. |

Preimages, source hashes, document destinations and unresolved items are recorded in `.ai/evidence/integration-20261106/history-synthesis.json`. The archived originals remain available; synthesis does not authorize their deletion.

## Agents, sequence and commit slices

| Wave | Owner | Output | Acceptance/dependency |
| --- | --- | --- | --- |
| 0 | Lead + runtime owner | Exact baseline/claims, patched PHP host inventory, dependency advisory map. | Preserve dirty fixes; no remote runtime assumptions. |
| 1 | Runtime-output implementer | A-01 private server output and deny rules, one coherent fix. | Generated package + Apache/Nginx/PHP root/base proof. |
| 2A | PHP action implementer | A-02 action-origin enforcement and negative fixtures. | Own PHP templates; coordinate generated bundle with lead. |
| 2B | Sidecar implementer | A-03 binding/origin/proxy/body controls. | Separate templates; serialize bundle generation/integration. |
| 3 | Dependency/compatibility owner | Patched Kit 2 compatibility fixture and Kit 3.1 development candidate; current Svelte/devalue/Vite. | Follow official migration; no forced peers. Preserve mode/base/CSR/cookies/instrumentation/read behavior. |
| 4 | Release-evidence owner | A-04 candidate/receipt freshness contract and updated docs. | Current graph, package hash and relevant checks. |
| 5 | Independent reviewer + host owner | Consequential-diff review and real FPM-backed-host checks. | Fixed candidate, finite scope, synthetic data. |
| 6 | Presentation owner + lead | Demo/screenshot/metadata packet and authorized release action. | Accepted local/package/host evidence and publication authority. |

Use current fleet capabilities and cost authority; do not embed a model roster. Native coding agents can implement owned slices. Fugu research/review uses the current policy, adapter and ledger; broker grants do not become native write authority. Prefer different-family review where judgment remains, then deterministic root reconciliation. One assignment has one lifecycle owner, finite limits, and an exit receipt. Read `AGENTS.md` for entry/commit rules.

Useful commit sequence: documentation convention; private bundle isolation; PHP action-origin checks; sidecar trust controls; compatible dependency patches; Kit 3 development migration; evidence/presentation updates. Each commit contains the behavior and necessary tests/docs, without unrelated dirty work. Commit/push/release authority is task-specific.

## Repository schema and layout

Five files here and five in EFSDB establish a shared entry: README, AGENTS, INTENT, `docs/MODERNIZATION.md`, `repo.schema.json`. Keep implementation paths stable. The schema defines `intent`, `work_order`, and `handoff`, with ownership/route/budget/check/commit/child fields. The intent instance lives in `INTENT.md`; future execution receipts live in the active harness or ignored output, with sanitized durable records promoted deliberately.

The current schema is an additive repository/workflow contract. It does not alter the route manifest, adapter options, consumer schema or PHP storage format. Automation that enforces it is a follow-up implementation task; prose/schema presence alone does not lock paths, validate provider access or create a commit.

## Gates before release

After patches, run affected units, source/generated parity, PHP syntax/redeclaration, `bun run check`, root-router parity, both modes' root/base HTTP/browser tests, packed imports/types, and pinned Kit 2/3 consumers. Then run the full current local gate and controlled hosted consumer proof. Record failures without weakening gates. Expired/skipped host receipts remain open.

Verify actual FPM patch level/restart, document root, server-source denial, private socket/sidecar, TLS origin, cookie flags, decoded request limits, caching/status/content types and disabled debug exposure. Keep CI install/runtime versions deliberate, use least workflow permissions, review action pinning, and add a dedicated security/reporting workflow as a later code slice. Do not mix host administration into a documentation task.

## GitHub presentation

README now opens with the deployment problem, mode table, architecture and honest release state. Keep detailed recipes below that first screen. Apply the About description/topics from `INTENT.md` when GitHub edits are authorized. The profile already pins the adapter; pair its story with EFSDB and agent-skills.

Add a verified root/subdirectory deployment demo with a native PHP form, a small sanitized screenshot and alt text. Show host configuration requirements next to the mode that needs them. Use real build/compatibility/release badges and distinguish local candidate from published version. No profile, metadata, release or hosting change is performed by this planning package.

## Historical planning-package verification receipt

At the earlier planning checkpoint, the Svelte check passed with zero errors/warnings. Both shared JSON Schema 2020-12 copies compiled in strict mode: four valid intent/work-order/handoff fixtures passed, and seven deliberately invalid fixtures were rejected. All 35 relative Markdown links and metadata paths across the ten files resolved; owned whitespace checks passed. All eleven pre-existing tracked dirty files retained their original SHA-256 hashes at that checkpoint. Independent review's two README findings were corrected: deployment guidance distinguishes public output and private sidecar files, and artifact verification commands use strict mode. These checks preceded the source fixes; the [implementation receipt](security/implementation-20261023.md) records the fresh runtime, package and browser results and remaining hosted gates.

