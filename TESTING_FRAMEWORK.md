# Testing framework reference

Use [TESTING.md](TESTING.md) for current verification guidance and
[SCRIPTS.md](SCRIPTS.md) for command prerequisites and side effects.

The current suite uses [playwright.config.ts](playwright.config.ts) with `php-static`,
`js-ssr-root`, and `js-ssr-subdir` projects. [build-e2e.mjs](scripts/build-e2e.mjs) builds their
fixtures and [verify-all.mjs](scripts/verify-all.mjs) runs integrated verification.

This compatibility entry replaces the earlier framework's removed split configurations,
`node-ssr` naming, and `e2e:*` script recipes. Earlier text remains in Git history.
