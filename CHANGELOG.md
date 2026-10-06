# Changelog

## 1.1.0-alpha.0 — 2026-10-06 (unpublished)

- Add backward-compatible SvelteKit 3 adapter support alongside SvelteKit 2. Normalize the flat Kit 3 builder configuration without mutating the upstream builder.
- Generate Kit 3's server instance for the JavaScript SSR sidecar; retain Kit 2's manifest and Server bootstrap.
- Initialize sidecar server asset reads and run server instrumentation before application code, including Kit 3's environment initializer.
- Stop generating PHP stubs that shadow JavaScript endpoints in `js-ssr`; preserve request bodies and cookies through the PHP proxy to the sidecar.
- Serve the sidecar mode's prerendered homepage under a fixed deployment base; forward mutative homepage requests to Node.
- Reject Kit 3 `.remote.svelte.js`/`.remote.svelte.ts` modules under the existing unsupported remote-functions policy.
- Add packed consumer TypeScript, real build, generated PHP syntax and HTTP fixtures for both modes at root and `/sites/cos`.

This minor alpha adds compatibility without changing adapter options or requiring existing Kit 2 consumers to migrate. Publication, hosted acceptance and CoS production acceptance remain separate gates.
