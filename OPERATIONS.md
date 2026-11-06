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

Install Bun, Node.js 22.17 or later, and PHP on PATH. The package's `devEngines` enforces the
Node minimum; CI selects Node 24 and Bun 1.2.23. The PHP compatibility floor and the security
acceptance baseline are different: [scripts/check-php-runtime.php](scripts/check-php-runtime.php)
requires a supported patched branch before `test:php`. npm is needed for package and registry
smoke checks. Do not change toolchains or credentials merely to satisfy an unrelated documentation check.

```powershell
bun install --frozen-lockfile
bun run dev
```

Installation runs the `prepare` lifecycle hook (`svelte-kit sync`) and creates local dependencies/generated
SvelteKit state. A sync failure fails the hook; there is no masking fallback. The Kit 3 application
configuration lives in [app.config.mjs](app.config.mjs), shared by the Vite/config entry points.
`dev` builds the tracked adapter bundle and declarations plus app output, starts Vite and PHP, and watches source
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

The authored adapter lives in `adapter/src/`; `adapter/index.js` and `adapter/declarations/` are
tracked distribution artifacts. `build:adapter` runs both the JavaScript bundle build and the declaration
build, which recreates the declaration directory. Review regenerated artifacts with the source change. Normal app output is
`build/`; E2E variants use `build-e2e-*` and `.svelte-kit-*`. These are disposable generated
directories, separate from private site data. Builds can delete and recreate their output.

Keep task captures, preimages, reports and handoffs under the owning repository's `.ai/` tree.
For commands that create OS temporary consumers, set process-local `TEMP`, `TMP` and `TMPDIR`
to a task directory under `.ai/evidence/` before running them. Existing build/test tools also use
their documented generated directories; inspect their outputs and preserve any needed evidence.

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

## Build aliases and deployment prerequisites

`build:php` and `build:apache` are aliases for one regular `vite build`, using the configured
adapter. The adapter already emits PHP routing and mode-specific Apache rules, including
`.htaccess`; the aliases do not run an additional post-build adapter or a second Vite build.
The dev-host wrapper uses `build:apache` by default. A successful build does not establish
deployment configuration, host behavior or permission to upload.

The checked-in `.env.example` includes the `DEPLOY_IDENTITY_FILE` placeholder required by
`bun run verify:release-prep`. Its presence resolves the older template omission; it does not
establish a configured deployment identity or a passing release-prep result for a changed candidate.
