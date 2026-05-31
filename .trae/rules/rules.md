SvelteKit PHP Adapter rules

Goal: PHP deploy output that matches SvelteKit semantics; fixture routes are the contract.

Modes: php-static=prerender+hydrate; PHP router serves pages/assets, __data bridge, actions/endpoints, negotiation; no runtime SSR. js-ssr=PHP entrypoint + Node/Bun sidecar; proxy page/data/action; SSR+streaming via server.respond (disable buffering for /stream).

Never patch client bundles; always serve/proxy __data.json (rewrite to __data.php). Honor kit.paths.base/assets/appDir. Negotiation: PUT/PATCH/DELETE/OPTIONS→+server; GET/POST/HEAD→+page only if Accept prefers text/html else +server; add Vary:Accept. Preserve status/redirects/headers and multi Set-Cookie. Adapter is build-time: use builder outputs only.

Dev: Bun-first; run PHP in dev; Vite HMR + proxy to PHP. Tests: don’t remove fixture routes; any fix adds fixture or scripts/verify-comprehensive.mjs assertion. Own-it: php-templates.ts, __data rewrites, negotiation, sidecar proxy.
