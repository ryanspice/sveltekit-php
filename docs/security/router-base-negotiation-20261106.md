# JS SSR base-path directory negotiation — November 6, 2026

## Finding and fix

After the JS SSR router strips a configured base path, its directory lookup selected
`index.html` before `index.php`. For a route with both files, `/sites/demo/negotiate/`
therefore served static HTML for every `Accept` value and bypassed the generated PHP
wrapper's method and content negotiation. The equivalent root URL selected PHP.

The base-stripped lookup now checks `index.php` first, matching the exact-directory
branch. Path guards, PHP exact-file execution, static-only directories, and the
existing root redirect with its query string remain unchanged.

## Evidence

- Source-generated PHP loopback fixtures exercise the actual adapter router and
  `getStandaloneApiPhp` wrapper, without requiring ignored E2E output.
- Root and `/sites/demo` directory requests cover JSON, HTML, wildcard and weighted
  mixed `Accept`, `Vary: Accept`, GET, HEAD with an empty body, POST method rejection,
  slash/query behavior, static-only directory indexes, byte-identical assets, and
  protected/traversal denials before handler side effects.
- The P2 regression failed on the P1-only router: base-path JSON `Accept` returned
  `text/html; charset=utf-8`. It passes with the index-order fix.
- Built-in PHP HTTP and source checks are local evidence only.

Apache rewrite/DirectoryIndex behavior, Nginx configuration, PHP-FPM pools, TLS and
proxy settings, deployment, consumer acceptance, and publication remain unverified.
