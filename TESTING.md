# Verification

Use [AGENTS.md](AGENTS.md) for shared instructions and [SCRIPTS.md](SCRIPTS.md) for prerequisites
and side effects. Check the current source and command targets before running a historical recipe.

## Select evidence for the change

| Change                                                 | Smallest useful local checks                                                                                                                       | Additional evidence when applicable                                                                                                                   |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Documentation only                                     | Verify links/anchors, command names and script targets; inspect for private paths/values; run `git diff --check` and targeted Markdown formatting. | Current CI still runs on documentation PRs; report its result separately. Application/browser checks are not needed to establish a prose-only change. |
| TypeScript/Svelte source                               | `bun run check`, relevant Vitest or fixture tests, changed-file lint.                                                                              | Full repository lint and the CI gates before integration.                                                                                             |
| Adapter generator/runtime                              | Focused unit/PHP regression, `bun run build:adapter`, strict artifact sync.                                                                        | Mode-specific verification of affected generated output and HTTP behavior.                                                                            |
| Routing, base paths, data, actions, negotiation, proxy | A regression fixture/assertion demonstrating the changed behavior; verify affected PHP/static and JS SSR paths.                                    | `bun run verify:root-router-parity` for router changes; root/subdirectory E2E where relevant.                                                         |
| Package, version, or release contract                  | Release-prep and artifact checks plus consumer smoke.                                                                                              | Current compatibility audit/smokes and alpha/release checklist; hosted evidence for claims that require a real host.                                  |
| UI or hosted behavior                                  | Relevant fixture/runtime proof.                                                                                                                    | Visual or hosted inspection only when that scope is requested; record its target and limitations.                                                     |

Use existing tests when they prove the behavior. Add a regression test for a behavior change
when the existing suite cannot detect it. Preserve meaningful fixtures rather than deleting them
to make a gate pass. Stop broadening successful checks unless changed inputs or an unresolved
concern justify it.

Router parity needs a matching application build. Run `bun run build:adapter` and
`bun run build` before `bun run verify:root-router-parity`, or select matching existing output
with its `--build` and `--basePath` options. The parity checker starts PHP probes; it does not
build missing output.

## Focused commands

After locked dependency installation, these are separate checks selected by scope:

```powershell
bun run check
bun run test:unit
bun run test:php
bun run verify:artifacts -- --strict
```

For one Vitest case, use `bun run test:unit -- tests/unit/paths.test.ts` with the relevant file.
For Markdown, use the installed formatter on only changed files, for example
`bunx --no-install prettier --check AGENTS.md OPERATIONS.md SCRIPTS.md CLAUDE.md POLICIES.md TESTING.md`.
Do not install a new formatter or run repository-wide rewriting just for a prose check.

## Build and browser integration

```powershell
bun run build:e2e
bun run test:e2e -- --project=php-static
bun run test:e2e -- --project=js-ssr-root
bun run test:e2e -- --project=js-ssr-subdir
```

The single [Playwright config](playwright.config.ts) defines these three projects. The build
driver produces four PHP/static variants and two JS SSR variants; Playwright's server driver
checks their stamps and starts PHP/sidecar processes. Ports 8086, 8087, and 8088 are the project
entrypoints. Do not assume an already-running unrelated server proves the current build.

`bun run verify:php-static` and `bun run verify:js-ssr` combine builds, unit/PHP, HTTP/output and
browser checks for a mode. `bun run test` is the full verification driver, not just Playwright.
After a matching build, `bun scripts/verify-all.mjs --mode=all --skipBuild` reuses artifacts.
Use `--basePath=/dev/sveltekit` for explicit subdirectory verification when the change needs it.

Builds rewrite the tracked adapter bundle and disposable output. Review `git status --short`
afterward. A skipped PHP or browser phase is a coverage gap, not a successful result for that phase.

## Existing CI gates

[CI](.github/workflows/playwright.yml) runs for pushes and PRs to `main`/`master` on PHP 8.1 and
8.3. It installs locked dependencies, runs lint/typecheck, builds the adapter, checks strict
artifact sync, verifies the latest dependency audit, runs same-major consumer smoke and
release-prep checks, builds E2E artifacts, installs browsers, then runs unit and full verification.

[Alpha Gate](.github/workflows/alpha-gate.yml) runs the local alpha sequence on those branches.
The hosted job requires manual dispatch with a base URL. `alpha:gate` includes public API/npm
access and package installation; the latest audit can become stale as upstream packages change.
Record registry/network/rate-limit failures separately from source failures without calling the
gate passed. Keep exact failure evidence before deciding whether a refresh belongs in the task.

The `v1:gate:*` scripts are broader release gates. A skipped hosted placeholder or simulated
native wrapper result cannot satisfy a real-host claim. Use the
[alpha checklist](docs/ALPHA-RELEASE-CHECKLIST.md) for release acceptance.

## Handoff evidence

Record the branch/commit, changed inputs, exact commands, exit results, and generated files.
Separate source/static checks from build/runtime results, visual inspection, and human acceptance.
State missing prerequisites and unrun gates explicitly. A local pass, remote check, deployed
response, and release approval are different observations.
