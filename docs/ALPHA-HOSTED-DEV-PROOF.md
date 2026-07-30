# Alpha hosted dev proof lane

This lane proves `hosted-php-smoke-proof` on a real PHP host without touching the production document root.

Target path:

```text
/dev/sveltekitphp
```

Current working-ground status:

- `https://blog.canopydigital.ca/dev/sveltekitphp/` is reachable and returns the SvelteKit PHP alpha fixture.
- `https://blog.ryanspice.com/dev/sveltekitphp/` is not the working ground and currently returns `404`.
- The Canopy working-ground fixture was refreshed on `2026-07-01` with `bun run alpha:deploy:dev-host -- --apply --smoke`.
- Hosted smoke passed for `1.0.2-alpha.0` and wrote `report/alpha-remote-smoke.json`; the deploy command then regenerated the alpha report and `bun run verify:alpha` passed.
- Treat this as alpha hosted proof for the `/dev/sveltekitphp` working ground. Stable still needs a fresh hosted gate against the final release deployment target.

The deploy helper intentionally refuses broad remote paths. `DEPLOY_REMOTE` must end with `/dev/sveltekitphp`, and hosted smoke must target a matching public URL path.

## Required environment

Use local shell variables, local `.env`, or CI secrets. Do not commit concrete values.

```powershell
$env:DEPLOY_HOST = "<ssh-host>"
$env:DEPLOY_USER = "<ssh-user>"
$env:DEPLOY_REMOTE = "domains/blog.canopydigital.ca/public_html/dev/sveltekitphp"
$env:DEPLOY_LOCAL = "build"
$env:DEPLOY_IDENTITY_FILE = "$HOME\.ssh\id_ed25519_ryanspice"
$env:DEPLOY_PORT = "22"
$env:ALPHA_SMOKE_BASE_URL = "https://blog.canopydigital.ca/dev/sveltekitphp/"
```

If the host document root differs, keep the same final path segment and verify it in the hosting panel before upload.

## Build only

```powershell
bun run alpha:deploy:dev-host -- --build-only
```

This builds the adapter bundle and Apache/PHP output with:

```text
SK_BASE_PATH=/dev/sveltekitphp
DEPLOY_BASE=/dev/sveltekitphp
ADAPTER_MODE=php-static
```

The Apache build step preserves the adapter-generated `.htaccess` file for
normal builds. This guarded dev-host helper then writes an isolated-target
`.htaccess` and root `index.php` shim so `build/` can be uploaded directly into
`/dev/sveltekitphp` without placing `_app`, `_runtime`, `_protected`, or
`adapter` files in the production document root.

## Precheck without upload

```powershell
bun run alpha:deploy:dev-host
```

This checks deploy environment shape and the guarded remote path. It does not upload without `--apply`.

## Upload and smoke

```powershell
bun run alpha:deploy:dev-host -- --apply --smoke
```

This runs the guarded upload, then runs:

```powershell
bun run alpha:remote:smoke
bun run alpha:report
bun run verify:alpha
```

Passing this command is the preferred way to convert `hosted-php-smoke-proof` from placeholder evidence to real hosted alpha evidence.

## Safety boundaries

- Do not point `DEPLOY_REMOTE` at `public_html`, `/`, `~`, or a domain root.
- Use `DEPLOY_IDENTITY_FILE` only for a local private key path; never commit the key or a concrete machine-specific path.
- Do not add unguarded `php_flag` or `php_value` directives to `.htaccess`;
  shared PHP-FPM hosts commonly turn those into blanket HTTP 500 responses.
- Do not include credentials or query tokens in `ALPHA_SMOKE_BASE_URL`.
- Do not use this lane for production deploys.
- Keep real native host proof separate from hosted PHP smoke; this lane proves PHP-host routing, no-hydration HTML, endpoint dispatch, form actions, content types, and leak/traversal guards.
