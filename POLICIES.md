# Project invariants

These are project constraints referenced by [AGENTS.md](AGENTS.md), the shared instruction entry.
They apply within the current task and host permissions.

## Source and HTTP behavior

- Edit `adapter/src/` and regenerate `adapter/index.js` and `adapter/declarations/`; verify strict artifact sync before
  accepting a change to the distributed adapter. Never patch client bundles to simulate routing.
- Preserve the SvelteKit `__data.json` URL contract. PHP can implement the bridge behind a
  rewrite; clients still request the JSON URL.
- Keep `kit.paths.base`, assets, app directory, redirects, and internal navigation consistent.
  Use `$app/paths` in fixtures where base-aware URLs are needed.
- Preserve Kit 2 and Kit 3 builder differences, custom route directories, trailing slashes,
  request-body forwarding and build identity. The local Kit 3 application uses `app.config.mjs`;
  a successful local build does not establish both consumer versions.
- Route page/endpoint overlaps by method and `Accept`; preserve `Vary: Accept`, response status,
  redirects, HEAD semantics, and multiple `Set-Cookie` headers.
- Preserve traversal checks and protected-path exclusions. Missing asset-like paths must not
  receive HTML route fallback. Keep the root router's return value when delegating to generated
  `build/router.php`.
- Deny private server/runtime output before an existing-file shortcut can serve it. Test Apache,
  Nginx and built-in PHP independently. Origin and trusted-proxy controls must be implemented
  and verified with rejected requests; environment-variable guidance alone is not enforcement.
- Keep `php-static` claims limited to prerendered documents and PHP data/actions/endpoints.
  Request-time Svelte document SSR and exact streaming/deferred behavior use `js-ssr` with a
  running sidecar. `csr = false` is the no-hydration contract for static pages.
- SvelteKit remote functions are unsupported on the current alpha track; follow
  [the explicit policy](docs/REMOTE-FUNCTIONS-ALPHA-POLICY.md). Development adapters remain local.

The [hosting contract](docs/HOSTING-CONTRACT.md) records the public options and host requirements.
Changes to routing, data, actions, negotiation, or proxy behavior need focused regression proof
under [TESTING.md](TESTING.md), using existing fixtures when they establish the behavior.

## Files and recovery

Preserve unrelated dirty/untracked work, fixture routes, and historical audit/release records.
Keep exact recovery copies for consequential edits and record hashes. Before restoring, compare
the current file with the expected replacement hash; reconcile later changes if it differs.

Build cleanup is restricted to verified disposable output. Resolve paths before recursive
cleanup and keep source trees, user directories, secrets, databases, and private runtime data
outside that boundary. Use the external-root guard deliberately; do not broaden it to make a
failed build pass.

## Secrets, publication, and evidence

Keep real environment values, tokens, SSH keys, and site data out of source, logs, PRs, and
reports. Commit only public placeholders. Preserve provider identities and shared configuration.
Review the package allowlist and generated artifacts when changing a package boundary.

The current package policy publishes to the `alpha` tag and disallows `latest`, `rc`, and
`stable`; read `package.json` and the release checklist before a version or channel change.
A passing check or an existing credential does not authorize publishing, deployment, merging,
or changing a remote target. Use existing task authorization without asking for it again.

Keep evidence tied to its source and execution context. A committed report is historical proof;
a skipped hosted check is no hosted proof; a native-wrapper simulation does not establish a
real desktop host result. Report source/static, build/runtime, visual, and human acceptance
separately, including commands that were blocked or not run.
