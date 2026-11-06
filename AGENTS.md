# Repository instructions

This is the shared instruction entry for contributors and agents. The current task and host
permissions take priority. Tool-specific files point here and add no separate authority.

## Start with the requested work

1. Check the repository root, remote, branch, HEAD, and working tree before editing. Verify that
   the source and commands named by the task exist in this checkout. A cached remote ref or
   historical report does not establish current remote or live deployment state.
2. Read [README.md](README.md) for the adapter contract, then load only the relevant guidance:
   [operations](OPERATIONS.md), [commands](SCRIPTS.md), [testing](TESTING.md), or
   [project invariants](POLICIES.md). Read the nearest applicable instructions for touched files.
3. Treat [package.json](package.json), the selected script implementation, and the active
   [workflows](.github/workflows) as command evidence. Report missing targets or conflicting
   documentation; do not substitute an older implementation silently.

## Work in the right layer

- Author the adapter in `adapter/src/`; regenerate tracked `adapter/index.js` with
  `bun run build:adapter` when its source changes. Do not patch the generated bundle alone.
- `src/routes/` contains the demo and behavioral fixtures. Preserve the fixture contracts used
  by `tests/` and verification scripts.
- Preserve `php-static` and `js-ssr` boundaries, HTTP behavior, protected paths, and base paths
  described in [POLICIES.md](POLICIES.md). Production support is defined in
  [the hosting contract](docs/HOSTING-CONTRACT.md).
- Historical `docs/AUDIT-*`, `docs/CHAT-*`, and release evidence record earlier observations.
  Keep those records intact; verify current source before repeating their claims.

## Ownership and scope

The lead owns integration and acceptance. Workers edit only their assigned area and return
changed files, exact checks, evidence, and unresolved issues. Preserve unrelated modifications
and untracked work; stage only the requested changes.

Keep recovery copies before consequential edits. Record source and replacement hashes; a
current-file hash mismatch blocks restoring a preimage over later work. Reconcile those edits.

Use authority already supplied by the user. A request for documentation or PRs does not
authorize a deployment, package publication, merge, credential change, or shared provider
configuration change. If a required action falls outside the task, identify the missing decision.

## Verification and handoff

Use [TESTING.md](TESTING.md) to select the smallest meaningful checks plus the applicable
project gates. Recheck after changed inputs, failures, or unresolved concerns; do not repeat
successful broad suites without a reason. Read command side effects in [SCRIPTS.md](SCRIPTS.md)
before running network, hosted, cleanup, or deployment steps.

Report source/static checks, build/runtime checks, visual checks, and human acceptance
separately. Name what ran and what remains unverified. Keep authored source, generated output,
Git commits, remote PR state, hosted behavior, and release acceptance distinct.

## Current intent and owned artifacts

Read `INTENT.md` and the relevant section of `docs/MODERNIZATION.md` before changing contracts. Use the work-order and handoff shapes in `repo.schema.json` for scoped ownership and evidence. Keep project task records under `.ai/`: intake in `inbox/`, deliverables in `outbox/`, checks in `evidence/`, and retained originals in `archive/`. Record plans and reviews in `.ai/SYNTHESIS-QUEUE.json`; mark them synthesized only after recording the source hash, maintained destination, unresolved issues and receipt. Never commit private packets, keys, runtime stores or conversation exports.

Follow applicable parent Svelte instructions: use the official Svelte MCP documentation and autofixer for Svelte source changes. One writer owns a path; coordinate shared generated output and test processes. Historical receipts establish their recorded candidate only.
