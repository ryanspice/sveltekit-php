# Remote functions alpha policy

Marker: `remote-functions-alpha-policy`

Status: unsupported for `1.0.2-alpha` PHP runtime output.

SvelteKit remote functions are a current experimental SvelteKit feature that create generated server HTTP endpoints from `.remote.js` and `.remote.ts` files. The PHP adapter does not yet have fixture proof that those generated endpoints are converted, routed, validated, and deployed safely through the PHP runtime.

## Current rule

- `kit.experimental.remoteFunctions` must stay disabled for PHP adapter alpha builds.
- `.remote.js`, `.remote.ts`, `.remote.mjs`, `.remote.mts`, `.remote.cjs`, and `.remote.cts` files are blocked by the adapter build guard.
- `event.platform.php.remoteFunctions.supported` reports `false`.
- The release-prep verifier requires this policy, the adapter guard, and the package evidence marker to remain in sync.
- Package-contract proof marker: `remoteFunctionsAlphaPolicyProof`.

## Why this is blocked

Remote functions always run on the server and expose generated HTTP endpoints. Until the PHP runtime has explicit route-manifest handling and hosted smoke proof for those endpoints, silently allowing the feature would imply server behavior that this adapter cannot currently prove.

## Promotion path

Remote functions can move from unsupported to alpha-supported only after all of the following exist:

- A fixture using `kit.experimental.remoteFunctions = true`.
- Coverage for `query`, `form`, `command`, and `prerender` remote function modes, or a documented subset policy.
- Generated PHP routing for the remote-function HTTP endpoints.
- Path-safety and validation-error tests for the generated endpoints.
- PHP-static and JS-SSR behavior documentation.
- Hosted PHP smoke proof against a real deployment.

Until then, users who need remote functions should use an official Node, edge, or serverless adapter for that app.
