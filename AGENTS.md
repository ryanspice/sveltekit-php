# Working in SvelteKit PHP

## Entry and ownership

Read `INTENT.md`, `docs/MODERNIZATION.md`, the relevant hosting/mode contract, and applicable parent instructions. Inspect HEAD, branch, status and owned paths. Source, generated artifacts, local package, published package and deployed consumer can represent different candidates.

Use the official Svelte MCP first: `list-sections`, then relevant documentation. Run `svelte-autofixer` before finalizing `.svelte`, `.svelte.ts`, or `.svelte.js` edits. Prefer TypeScript, Svelte 5 runes, lean dependencies and static/prerender delivery unless request-time SSR is needed.

The lead owns architecture, file allocation, integration and final acceptance. Workers receive a bounded result, exact file claim and acceptance checks. Record claims through the active harness; one writer owns a path. Overlapping source work needs isolated worktrees or explicit serialized hunks. A new worktree does not include another worker's uncommitted fixes.

## Packet and lifecycle

Use `repo.schema.json`'s `work_order` fields or equivalent readable text:

```text
ROUTE / ROLE: execution owner, exact provider/model/options, tools, cost/data boundary
TASK: behavior to deliver and why it matters
BASELINE: repository, HEAD, worktree, relevant dirty paths/hashes
OWNERSHIP: allowed writes, protected paths, shared test/server owner
ACCEPTANCE: source/generated/package/HTTP/browser checks for this slice
BUDGET: finite deadline and inherited child/turn limits; stop conditions
HANDOFF: patch/commit, checks/evidence, open issues, next action, child state
```

Native coding workers may inspect, edit and test within authorized ownership. Discover current capabilities; model names and free-price labels do not prove tool grants, entitlement or allowance. Preserve exact routes when requested and do not silently enter paid fallback.

For selected Fugu work, read current owner-authored `POLICY.md`, discover the live catalog and use `Invoke-FuguLane.ps1`. Validate optional local paths through `LOCAL_PATHS.md`; do not reconfigure missing integrations. Current broker grants differ from native coding tools, so evidence/proposed patches may be the appropriate output. Preserve run plans, inherited budgets, expiry and broker-only recursion. Do not copy machine paths, auth profiles or a mutable roster into the repo.

Native harness task IDs and Fugu run/task IDs remain separately owned. Parent wait expiry is not cancellation. Reconcile terminal status and descendants before completion; never kill shared servers by name. Record route substitutions and capability limits honestly. Catalog/inference/file-read/edit/test/acceptance evidence remain separate.

## Contracts to preserve

- `php-static` and `js-ssr` are distinct modes; PHP hosting alone does not provide request-time Svelte SSR.
- Keep remote functions blocked until explicit generated-endpoint and host proof authorizes support.
- Preserve Kit 2 and Kit 3 builder differences, custom route/app directories, base paths, trailing slashes, `csr=false`, multi-cookie behavior, body forwarding and build identity.
- Public routers must deny private server/runtime source before any existing-file shortcut. Test Apache, Nginx and built-in PHP behavior separately.
- Implement origin/proxy controls before claiming environment variables enforce them. A documentation recommendation is not runtime validation.
- Generated `adapter/index.js` and declarations come from source, never hand patches. Coordinate source and bundle ownership.
- Preserve unrelated dirty/untracked work, including sidecars. Never commit credentials, real env files, private packets or runtime data. Do not expose dev/preview servers to untrusted clients.

## Verification and focused commits

For adapter source changes, use `bun run build:adapter`, `bun run verify:artifacts -- --strict`, focused unit tests and `bun run check`. Add relevant root/base, generated PHP/Apache/Nginx, package-import and mode fixtures. Security changes need negative cases and proof rejected requests do not run handlers. Run pinned Kit 2/3 consumer checks when builder/runtime behavior changes. Broader local/hosted gates remain required for release and may have unrelated baseline blockers; report them rather than weakening them.

Build/check commands can generate ignored reports or tracked artifacts. Inspect the diff and retain only the task's intended outputs. A prior receipt cannot certify a changed bundle; record package version, commit, dirty paths, bundle hash, commands, timestamp and host scope.

When committing is authorized, make one coherent behavior fix plus necessary regression checks/docs. Run `git diff --check`, stage explicit files/reviewed hunks, inspect the staged diff, and commit with a useful title, for example `fix(runtime): keep sidecar bundles outside the public root`. Coordinate mixed-ownership files before staging. Do not broadly stage, reset, clean, or create cosmetic churn commits. Without commit authority, return the patch and suggested title. Separate publication, push, merge and deployment authority; reuse existing session authorization without asking again.

Exit with a `handoff` receipt: base/current commit, worktree, paths/hashes, actual checks/evidence, unresolved findings, commit or null, pending descendants and next permitted action. Local checks, independent review, hosted proof and npm publication have separate states. The lead accepts the integrated candidate.
