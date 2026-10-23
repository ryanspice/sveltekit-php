# SvelteKit PHP intent

## Why it exists

Let a SvelteKit project use standard PHP hosting and existing PHP backend skills while preserving a modern frontend build. Provide explicit deployment choices: prerendered documents with PHP handlers, or a PHP proxy with a persistent JavaScript SSR sidecar.

The project earns attention by making the difficult boundaries visible and verifiable: routing, public/private output, actions, cookies, base paths, package artifacts and actual host behavior.

## Current limits

Local package track is `1.1.0-alpha.0`. October 23 registry inspection found published `latest=1.0.1` and no alpha tag. Kit 2/3 compatibility documentation records earlier pinned fixtures, not current hosted acceptance. Remote functions remain unsupported. Ordinary FPM-backed hosting is distinct from any proposed special PHP-FPM package mode.

The [modernization plan](docs/MODERNIZATION.md) owns the current security queue and research inventory. Runtime fixes, dependency migration, fresh host proof and publication remain open. Repository metadata does not change the adapter's options, consumer API, or application data schema.

## Priorities

1. Protect sidecar server output and enforce action-origin/proxy boundaries.
2. Update affected locked dependencies and prove current Kit 2/3 compatibility.
3. Bind release claims to the actual package/bundle/host receipt.
4. Make agent ownership, useful commits, independent acceptance and handoff routine.
5. Show a simple deploy story and real evidence on GitHub.

## Repository metadata

This JSON block is the `intent` instance for `repo.schema.json`. The schema also defines work orders and exit receipts; it validates their structure, not the truth of test results or authority.

```json
{
  "schemaVersion": "1.0.0",
  "kind": "intent",
  "repository": "ryanspice/sveltekit-php",
  "reviewedAt": "2026-10-23",
  "baselineCommit": "202e692676f40495c58980f72832720ac0b4fc36",
  "status": "alpha",
  "purpose": "Deploy SvelteKit frontend output to PHP hosting with explicit PHP-static and JavaScript-sidecar modes.",
  "entrypoints": ["README.md", "AGENTS.md", "docs/HOSTING-CONTRACT.md", "docs/MODERNIZATION.md"],
  "sourceRoots": ["adapter/src", "src", "scripts", "tests", "docs"],
  "invariants": ["Distinct php-static and js-ssr modes", "Remote functions fail closed", "Source and generated package parity", "Root and base-path consumer acceptance"],
  "verificationCommands": ["bun run check", "bun run test:unit", "bun run build:adapter", "bun run verify:artifacts -- --strict", "bun run test:kit-compatibility", "bun run v1:gate:local"],
  "releaseGates": ["Runtime security fixes", "Current dependency graph", "Kit 2/3 packed consumers", "Independent review", "Current hosted proof", "Owner npm publication authority"],
  "presentation": {
    "description": "Deploy SvelteKit to PHP hosting: prerendered pages, PHP data and actions, and an optional JavaScript SSR sidecar.",
    "topics": ["sveltekit", "sveltekit-adapter", "php", "shared-hosting", "prerender", "typescript"],
    "profilePitch": "SvelteKit PHP — modern SvelteKit builds for PHP hosting, with explicit deployment modes and packed-consumer verification."
  }
}
```

## Repository shape and presentation

Keep adapter implementation under `adapter/src`, fixtures/demo under `src` and `tests`, build/release tooling under `scripts`, durable explanations under `docs`, and consumer profiles under `release`. Avoid a broad directory move while securing runtime output.

The five-file convention is README, AGENTS, INTENT, the dated modernization plan and repository schema. It is intentionally shared with EFSDB so agents can enter either repo using the same packet/receipt structure. Private fleet configuration and execution logs remain outside public docs.

The public profile already pins SvelteKit PHP. Give its repository card the description above and a few precise topics. Add a real root/subdirectory deployment demonstration and an architecture image only after the behavior is verified. Keep compatibility, hosted, and release badges tied to their actual evidence. A live static consumer shows that consumer's behavior; it cannot certify every action or SSR path.

No GitHub metadata, pin, profile or npm release changes are part of this package.
