# JS SSR PHP source execution fix

**Status:** locally implemented and committed on the integration branch; built-in PHP loopback proof passed. Apache, Nginx, PHP-FPM, and production-host acceptance remain open.

## Cause and plan

The JS SSR router has two exact-file checks. The first runs before the configured base path is removed; the second runs after the request path has been mapped back into the public root. Both checked only `is_file()` and sent the resolved file as bytes. Shared request guards normally return physical PHP files to PHP's built-in server, but a base-prefixed logical path does not map to that physical file until after the shared shortcut. The router then sent generated PHP wrappers and endpoint files as `application/octet-stream` source.

The fix dispatches resolved `.php` files through PHP in both exact-file branches. Extension matching is case-insensitive. Before `require`, the router sets `$_SERVER["SCRIPT_FILENAME"]` to the resolved file, preserving the entrypoint expected by generated handlers. Non-PHP files continue through `router_send_file`; shared traversal and private-path guards remain ahead of exact-file handling. Directory index order is unchanged and remains a separate negotiation fix.

## Implementation and regression evidence

The focused regression builds probes from actual generated negotiation wrappers and endpoint files, adds a unique source marker, and runs the generated JS SSR router with PHP's loopback server. It covers root and `/sites/demo`, GET and HEAD, the wrapper and direct `_server.php` endpoint, decoded and upper-case PHP filenames, byte-identical static content, protected runtime/server paths, traversal rejection, and absence of a protected-handler side effect.

The regression failed before the change: base-prefixed wrapper requests returned `application/octet-stream` and the PHP source marker; the encoded and upper-case `.PHP` case also returned source. After the change, all five HTTP tests passed. JSON wrapper requests returned status 200 and `application/json`; HEAD returned no body. Direct `_server.php` executed without marker disclosure. The static fixture was byte-identical, protected requests were denied, and the protected side-effect file was absent.

Task-local request records and exact command logs are in `.ai/evidence/router-p1-20261106/`. The source and generated bundle hashes are recorded in the handoff there.

## Checks and limits

The P1 gate runs the focused regression, existing router parity and protected-runtime tests, adapter build, strict generated-artifact sync, Svelte/TypeScript check, PHP runtime/redeclaration check, changed-file formatting and lint, and root-router parity against matching generated output. Results are in the private task handoff.

These results establish only the generated router under PHP 8.5.12's built-in loopback server. Apache rewrite behavior, Nginx/FastCGI routing, PHP-FPM worker configuration, host document roots, and deployed runtimes still require independent acceptance. A direct `_server.php` request may execute its generated endpoint; the compatibility criterion is execution or an appropriate denial with no source disclosure.
