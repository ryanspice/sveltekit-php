# First security implementation wave — October 23, 2026

Local implementation and acceptance receipt. Branch: `codex/security-hardening-20261023`. Original source baseline: `202e692676f40495c58980f72832720ac0b4fc36`. Source/dependency checkpoint: `5886f8467dda20a56fb125d5a292f1ce15d2f70d`. This document is committed after that checkpoint. Package track remains **1.1.0-alpha.0**, unpublished.

## Changes and focused commits

| Commit | Result |
| --- | --- |
| `c7de10f` | README, AGENTS, INTENT, modernization plan and repository task/receipt schema. |
| `48aac15` | Patched-PHP runtime check and local runtime receipt. |
| `9f466f9` | A-01: sidecar server output moves to the private `<out>-server/` sibling; overlap/unowned-cleanup guards and private-artifact denials. |
| `1414e02` | A-02: PHP action Origin checks before handler includes; explicit missing-Origin exception and bounded action bodies. |
| `9b1f724` | A-03: loopback Node default, canonical origin, trusted-peer forwarding policy, bounded declared/streamed bodies and hardened PHP proxy. |
| `806072a` | Independent-review follow-up: scope artifact denials to root/base namespaces while preserving nested public routes; correct Apache pattern spacing and deny `.server` sources. |
| `5886f84` | Patch compatible dependencies, all nested Vite resolutions, and current Kit 2/3 consumer fixture pins. |

Set the same public `SK_ORIGIN` on PHP and Node for proxied actions. Node listens on `127.0.0.1` by default; a non-loopback override also requires `SK_ORIGIN`. Forwarding is trusted only with explicit opt-in and an allowed immediate peer. PHP action POSTs reject absent/null/cross-site origins by default, before user includes. `SK_ALLOW_MISSING_ORIGIN=1` allows only absent Origin for a reviewed client. PHP action/non-read Node bodies default to a 10 MiB cap using `SK_BODY_SIZE_LIMIT`, while the PHP proxy retains its separate `MAX_BODY_BYTES` setting. Standalone PHP endpoints still require host/consumer body limits. See the [hosting contract](../HOSTING-CONTRACT.md) for all implemented settings and ingress limits.

For `out: 'build'`, keep `build-server/` outside every document root. Root/base private artifacts, dotfiles, encoded/case/Windows aliases, `_protected` and `.server` sources are denied before static delegation. Ordinary `/api/server/status`, `/api/adapter/status` and `/api/_runtime/status` remain usable. `_runtime/build-stamp.json` is intentionally public diagnostic metadata. Apache rules have source-level regressions; actual Apache/Nginx execution is still a host gate.

## Candidate identity and preservation

The fresh packed-consumer matrix used working bundle SHA-256:

```text
173f3f856be7eb6beb56fcf0df7e5c36ff749ec1e1d0b75098424e2cd782d099
```

The committed bundle at the source checkpoint has SHA-256:

```text
39a6d6b8152f38e2b8575c1161443f68b5a24fe63bf1f6434f99266ad0e23ab7
```

They differ because the worktree retains the user's original, unstaged case-insensitive `_protected` guard in `shared.ts` and its generated bundle. Integration staged only owned hunks. Each A-01/A-02/A-03/follow-up staged snapshot was exported, built and tested before commit. Whole-worktree unit/browser/package checks include the preserved user changes and must not be described as a pristine-HEAD package receipt.

All other pre-existing tracked dirty consumer/profile/script/test files retain their original SHA-256 values. The original untracked protected-runtime test is also unchanged and unstaged. Private `.ai`, `.codegraph`, `.hermes-sidecars`, conversation and Hermes material were not committed. A machine-local baseline and preservation audit record exact paths/hashes. No push, npm publish or deployment occurred.

## Runtime and dependency evidence

Local Windows PHP is **8.5.12 x64 NTS** in both discovered installations; configs and EFSDB's BLAKE3 DLL were preserved. See the [runtime receipt](runtime-20261023.md). This does not attest a remote FPM pool.

Development lock: Kit **2.70.3**, Svelte **5.57.2**, Vite **7.3.7**, plugin **6.2.1**, devalue **5.9.4**, TypeScript **5.9.3**. Every Vite lock resolution is 7.3.7, including test tooling. Bun initially retained old nested installations after the lock change; `bun install --force --ignore-scripts` corrected them. Node `createRequire` probes from both Vitest and vite-node then resolved **7.3.7**. The override satisfies their existing version ranges.

The development application still requires a separate Kit 3 migration: Vite-plugin configuration, TypeScript 6/Vite 8/plugin 7 and 42 files using removed/changed aliases or imports. The [dated exception](../MODERNIZATION.md) names the owner and next gate. Kit 2 does not contain every October Kit 3 security fix; this is open debt, not release clearance. Adapter consumer compatibility with Kit 3 is independently tested below.

## Verification

All recorded commands exited zero. Logs and retained disposable consumers remain machine-local; the ignored `report/kit-compatibility.json` binds the fresh matrix to the working bundle hash above.

| Check | Actual result |
| --- | --- |
| Isolated staged A-01 build and affected tests | 26/26 passed. |
| Isolated staged A-02 build and Origin tests | 4/4 passed. |
| Isolated staged A-03 build and sidecar tests | 6/6 passed. |
| Isolated staged route follow-up build/tests | 24/24 passed; worker's broader affected run passed 43/43. |
| `bun run check` | 0 errors / 0 warnings. |
| `bun run test:unit -- --maxWorkers=1` | 151/151 across 17 files, rerun after correcting the installed test-tool Vite resolutions. |
| `bun run test:php` | Patched runtime check and five generated PHP includes passed without redeclaration. |
| `bun run build:adapter`, strict `verify:artifacts` | Bundle and all 18 declaration files match source. |
| `bun run test:kit-compatibility -- --keep` | All eight packed consumer builds/HTTP cases passed: Kit 2.70.3 and 3.1.0, php-static/js-ssr, root and `/sites/cos`. |
| `bun run verify:all -- --skipUnit --skipE2E` | All configured fixture builds, PHP syntax, output checks and both-mode HTTP sanity passed. |
| `bun x playwright test --workers=2 --reporter=line` with `CI=1` | 32/32 passed across php-static, js-ssr root and js-ssr subdirectory projects. |
| Root compatibility-router parity | 11 root and 12 base-path HTTP requests matched fresh generated routers. |

Kit 3 fixture pins: 3.1.0 / Svelte 5.57.2 / Vite 8.3.5 / plugin 7.3.1 / TS 6.0.3. Kit 2 fixture pins match the patched development lane. The fixture checks exports/types, custom route/app directories, static bytes/compression, PHP endpoints, request-time SSR, filesystem reads, instrumentation, cookies and PHP proxy POSTs. This is local HTTP acceptance, not hosted proof.

Native Codex workers owned bounded implementation and independent review. Review identified the reserved-route mismatch and the need to document matching PHP/Node origins; both were addressed. Source/code checks remain distinct from agent agreement. No Fugu dispatch, paid fallback or fleet bridge accounting is claimed. Test servers exited; no shared services were killed.

Open gates: Kit 3 development-app migration; actual Apache/Nginx/FPM configuration, private directory permissions and TLS/proxy topology; fresh authorized hosted consumer receipts; broader A-04 release-evidence consolidation; and owner publication authority. The October 6 compatibility document remains historical. No real-host, npm or GitHub profile acceptance is inferred from these local checks.
