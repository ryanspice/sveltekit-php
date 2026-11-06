# Repository operations

[AGENTS.md](AGENTS.md) is the shared instruction entry. This runbook covers work in the adapter
checkout; [SCRIPTS.md](SCRIPTS.md) records command effects and [TESTING.md](TESTING.md) selects checks.

## Identify the checkout

Run from the intended repository root before editing or building:

```powershell
git rev-parse --show-toplevel
git remote get-url origin
git branch --show-current
git rev-parse HEAD
git status --short
```

The expected repository is `ryanspice/sveltekit-php`. Verify the actual remote before pushing.
`origin/main` is a local cached ref. When the task needs current remote state, query
`git ls-remote origin refs/heads/main`; this does not establish a deployed version.

## Setup and development

Install Bun, Node.js, and PHP 8.1+ on PATH. Use a Node version supported by the checked-in Vite
dependency; PHP 8.3+ is the recommended production target. npm is needed for package and
registry smoke checks. Do not change toolchains or credentials merely to satisfy an unrelated
documentation check.

```powershell
bun install --frozen-lockfile
bun run dev
```

Installation runs the `prepare` lifecycle hook and creates local dependencies/generated SvelteKit
state. `dev` builds the tracked adapter bundle and app, starts Vite and PHP, and watches source
changes. Defaults are Vite port 5173 and PHP `127.0.0.1:8080`. The PHP server serves `build/`
through the root compatibility router. Stop the command to stop its child servers.

After editing `adapter/src/`, run `bun run build:adapter` explicitly before rebuilding the app;
the running watch loop invokes only `bun run build`. A failed rebuild can leave the last good
output in service, so check the command result before attributing a browser response to a change.
The [development boundary](docs/DEV-ADAPTER-BOUNDARY.md) keeps development adapters local.

## Build and generated output

```powershell
bun run build:adapter
bun run build
bun run verify:artifacts -- --strict
bun run serve:php
```

The authored adapter lives in `adapter/src/`; `adapter/index.js` is its tracked distribution
bundle. Review and commit a regenerated bundle with the source change. Normal app output is
`build/`; E2E variants use `build-e2e-*` and `.svelte-kit-*`. These are disposable generated
directories, separate from private site data. Builds can delete and recreate their output.

`php-static` is the default. Set `ADAPTER_MODE` to `js-ssr` only for a target that can run the
JavaScript sidecar. `SK_BASE_PATH` takes priority over `DEPLOY_BASE`; an empty value means the
root deployment. See [the hosting contract](docs/HOSTING-CONTRACT.md) for routing and host behavior.

## Private runtime state

Use [.env.example](.env.example) and [the runtime config example](config/site-runtime.example.json)
as templates. Real values belong in the shell, CI secrets, or ignored local configuration.
Keep databases, private drafts, credentials, and mutable site state outside Git and cloud sync.
Choose a site-specific directory under the platform's private application-data area.

`scripts/Resolve-SiteRuntime.ps1` reads the configured site root; `-Create` creates its directory
tree. Inspect and adapt the example first because it records a developer site, not a universal
machine path. A configured build output must be disposable and separate from persistent state.
Before using `SVELTEKIT_PHP_SAFE_EXTERNAL_ROOTS`, verify the resolved output paths stay under a
narrow trusted output root. Allowlisting a parent does not make everything below it safe to delete.

## Release and hosted work

Use the current [alpha release checklist](docs/ALPHA-RELEASE-CHECKLIST.md) and
[hosting contract](docs/HOSTING-CONTRACT.md) for an authorized release. Local gates produce
evidence; they do not publish the package or accept a release. `alpha:report:full` contacts public
APIs and writes a skipped hosted-smoke record. Preserve any existing real-host proof before
regenerating a report with that placeholder step.

`precheck:deploy` checks required deployment variable presence, not host readiness or authority.
Hosted smoke sends requests, including form POSTs, to `ALPHA_SMOKE_BASE_URL`; use an approved
fixture target. The dev-host wrapper's `--apply` uploads and cleans remote files. Verify the
target, source build, rollback copy, and established authorization before using it.

## Known command gaps

At this guidance update, `build:php` calls absent `scripts/build-php.js` and `build:apache` calls
absent `scripts/build-apache.js`. Both run `vite build` before reaching the missing script, so
they can change output before failing. The default `alpha:deploy:dev-host` path calls
`build:apache` and is therefore blocked in this checkout. Do not describe it as a working
deployment recipe or use `--skip-build` to conceal the missing build prerequisite.

The checked-in `.env.example` also omits `DEPLOY_IDENTITY_FILE`, which
`bun run verify:release-prep` requires. That source check currently fails at `verifyEnvFiles`;
a passing README contract check does not clear the release-prep gate.

These gaps are documented here without changing the implementation. Recheck the actual targets
when addressing them, and update the catalogue with the verified replacement.
