# Kit 3 development-app migration — October 25, 2026

The repository's development application has an uncommitted SvelteKit 3.1.0 migration candidate. Implementation started October 23 and integration resumed October 25. Final acceptance is blocked by stalled local command delivery; the multipart fix has not completed its current tests or artifact rebuild. Adapter consumers retain separate Kit 2 and Kit 3 compatibility lanes. This receipt follows the [initial security implementation](implementation-20261023.md); it does not establish completed migration, publication or hosted acceptance.

## Candidate and preservation boundary

- Entry commit: `dabdfd2972482f22d5a0110450fd60c5e2af8b5a` on `codex/security-hardening-20261023`.
- Accepted migration commit: none. HEAD remains the entry commit.
- Local package version remains `1.1.0-alpha.0`.
- Last observed working bundle SHA-256, October 23: `944cbd427be4a36dec219930b58689be805f5c4bd67df8215b88e4c2e1eab27a`. It predates the multipart source fix and needs regeneration.
- Current source/bundle hash reconciliation: unverified on October 25 because final reads and commands stalled.

The lead recorded the initial status, tracked-file hashes and copies of the eleven protected dirty/untracked files before editing. Ten protected files remain byte-for-byte preserved. The generated bundle necessarily changes for the new fixes; its original case-insensitive `_protected` guard delta remains in the working tree and outside these commits. Other private sidecars and untracked work remain untouched.

Adapter commit slices are built from isolated staged-tree exports. Each export excludes the pre-existing dirty router change and regenerates its own bundle/declarations from source. Bun's three dependency source-label comments are normalized from junction-relative paths to ordinary checkout labels; implementation bytes are not patched. Standalone runtime tests use a minimal verification-only TypeScript scaffold because those earlier commit slices precede the application's Kit 3 configuration migration. The integrated application checks run in the preserved working tree, including the owner's existing fixes.

## Toolchain and application changes

| Development dependency | Resolved version |
| --- | --- |
| SvelteKit | 3.1.0 |
| Svelte | 5.57.2 |
| Vite / Svelte plugin | 8.3.5 / 7.3.1 |
| TypeScript | 6.0.3 |
| Vitest | 4.1.12 |
| Local Node / Bun / PHP | 26.7.0 / 1.2.23 / 8.5.12 |

Node >=22.17 is a development-checkout requirement through `devEngines`; the public peer range remains `^2.0.0 || ^3.0.0`. No forced peer resolution was used.

`app.config.mjs` supplies flat Kit options to `sveltekit(...)` in `vite.config.ts`. It preserves mode, fixed/automatic base, output, fallback, assets, compression and environment precedence. TypeScript extends `$app/tsconfig`; package imports replace `$lib` with exact-extension `#lib/*` paths. Removed environment/hook/action types, error props, route resolution and custom enhanced-form callbacks are migrated. Framework errors keep their intended status/body; unexpected errors are masked and redirects use the local deployment base.

The Vite watcher ignores known generated fixture trees while allowing source, static/configuration inputs, every ancestor of the current output directory, and its `generated` subtree. Real development PHP bridge probes pass at root and `/dev/sveltekit`. The SSR-data example forwards `url.pathname`, retaining the deployment base.

## Browser-discovered adapter fixes

| Defect | Result and regression |
| --- | --- |
| Enhanced PHP results serialized the entire envelope as devalue | Emit a JSON envelope whose `data` alone is devalue. Preserve HTTP/result status, Kit 2/3 error shape and normalized location, including missing actions and duplicate named-action keys. Twelve generated-PHP action cases plus four origin cases cover this boundary. |
| Kit 3's prerender list includes HTML endpoints | Preserve endpoint bytes/MIME and avoid creating a PHP directory at the HTML file path. Keep real page conversion and avoid shadowing preserved JSON/HTML endpoints. Eight adaptation/HTTP cases span builder forms, modes and bases; the builder getter regression avoids Kit 3's deprecated facade. |
| Flat child pages could select a parent's data template | Select the exact route's base-aware data before directory/index fallbacks. Four adaptation cases cover child, parent, root and custom directory data. |
| Inline hydration received flattened navigation tables | Decode node values for inline startup while retaining flattened `__data` wire tables. Preserve object/list distinctions, PHP load precedence and the existing deferred-value bridge. Thirteen actual-PHP cases cover positive values and bounded rejection. |
| The plain-text blog helper interpreted markup | Escape the existing plain-text `html` prop. Two actual Svelte SSR cases verify malicious text escaping and ordinary content. Arbitrary malicious blog-slug reachability was not established. |
| PHP consumes default-parsed multipart bodies before proxy dispatch | A prepared fix builds one bounded temporary stream for both transports, reconstructs parsed POST fields/uploads with safe headers and a fresh boundary, and retains available raw bytes. Fresh tests, whole-file reconciliation and browser acceptance are pending. See [PHP's input-stream contract](https://www.php.net/manual/en/wrappers.php.php). |

Inline PHP hydration supports JSON-compatible values and the adapter's existing Promise placeholder. It rejects cyclic data, unsupported tagged JavaScript types/sentinels, malformed references, depth above 256 and expanded-node cost above 100,000. Memoized subtree height and cost prevent shared-DAG bypasses. This is not full JavaScript devalue-type parity.

## Acceptance

Completed October 23 checks before the final multipart patch: type check with zero errors/warnings, scoped ESLint, 202 unit tests, six builds, strict JS/declaration sync, eight packed Kit 2/3 consumer cases, PHP runtime/redeclaration checks, and root/base HTTP/router checks. These results do not certify the subsequently changed proxy source. Four PHP-static core desktop/mobile/root/base browser cases passed; JS-SSR multipart failed, causing the remaining fix. The readiness-page duplicate key was also corrected after a browser failure and needs fresh browser confirmation.

October 25 re-entry confirmed the same branch/HEAD, PHP 8.5.12 with a passing no-INI security-baseline check, and all ten non-bundle protected-file hashes. The original generated-bundle guard remains outside the staged action slice. No new commits, push, publication or deployment occurred.

The final multipart source was updated by the implementation worker for the PHP 8.1 code floor, parsed-POST guard, header/upload safety, existing `MAX_BODY_BYTES` cap and explicit zero-cap rejection. Twenty multipart cases are declared when both transports are available, with no completed resumed result. Independent review accepted the inspected body/transport design and supplied guard hunks, but could not re-read/hash the final entire file. Focused test commands and process-control checks stalled. One owned command session was cancelled and closed with exit code 1; another remains unconfirmed and includes queued formatting before tests. A direct Node test process was reported as PID `20040`; its cleanup has been requested but is not verified. Pending verification is not a pass.

Four prepared action-slice files remain staged: `adapter/index.js`, `adapter/src/runtime/php-templates.ts`, `scripts/verify-all.mjs`, and `tests/unit/php-action-result.test.ts`. The staged bundle is an isolated action-only artifact; the working bundle and full migration source represent different candidates. Inspect this staged diff before continuing the commit sequence.

Reproduction commands for the integrated application:

```powershell
bun run check:runtime
bun run build:adapter
bun run verify:artifacts -- --strict
bun run check
bun x vitest run tests/unit --maxWorkers=1
bun run build:e2e
bun run test:e2e:kit3
bun x playwright test --config playwright.config.ts
bun run test:kit-compatibility
bun run test:php
```

The migration browser matrix uses Chromium Desktop Chrome and Pixel 7 emulation, both deployment modes, and root plus `/dev/sveltekit`. It exercises hydration, client navigation without reload, enhanced success/failure, multipart filename rendering, parameterized links/breadcrumbs, actual report downloads, `csr=false`, private-file denials and genuine missing-asset responses. Native forms without JavaScript are checked in `js-ssr`; PHP-static's client fallback is an explicit mode boundary.

Development-server evidence includes retained 60/120-second failures before the watch correction. After correction, observed root startup/SSR were 3.988/18.610 seconds; subdirectory startup/SSR were 4.993/4.401 seconds. Both returned dynamic PHP `page_ssr_…` values without build placeholders. These are local measurements, not performance guarantees. All probe-owned processes were closed.

## Agent ownership and remaining gates

Native workers owned application/runtime changes, tooling/configuration and bounded independent review. The lead owned shared generated artifacts, builds, browser/server checks, staging and commit acceptance. Review found the error-envelope, duplicate action-key and decoder resource/depth issues; implementers added reproducing regressions and the reviewer accepted those earlier frozen slices. Reviewer source inspection and implementer test reports remain distinct from the lead's integrated checks. The resumed multipart worker and reviewer reached a command-delivery blocker; final tests, hashes and owned-process settlement remain open.

Keep the public/private hosting contracts and remote-functions rejection. Real Apache/Nginx/PHP-FPM host acceptance, TLS/proxy configuration, deployed consumer proof, npm publication, push and merge remain separate gates. This turn prepared local development changes; commits remain gated by verification. Existing advanced named-action demo limitations outside the tested core form flows are not represented as complete cross-mode parity. Physical mobile-device acceptance was not performed.

Sanitized command logs, baseline copies, isolated commit candidates and browser evidence are retained in local `sveltekit-php-kit3-20261023-01` and `sveltekit-php-kit3-20261025-01` verification receipt directories; machine-specific/private fleet files are not published in this document. Resume by settling the owned test process, completing the multipart focused tests/review, regenerating adapter artifacts, running current type/unit/build/browser/packed gates, and committing explicit slices only after the relevant checks pass.
