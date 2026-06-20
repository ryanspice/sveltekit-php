# Composer bootstrap recipe

Last updated: 2026-06-17

This is a design stub for PHP projects that want to reuse existing Composer libraries inside `+page.server.php` and `+server.php` handlers.

The adapter does not currently implement a first-class Composer bootstrap option. This recipe documents the intended safe shape so future work has a clear boundary.

## Future option shape

```js
// svelte.config.js
import adapter from 'sveltekit-php/adapter';

export default {
  kit: {
    adapter: adapter({
      mode: 'php-static',
      phpBootstrap: './vendor/autoload.php'
    })
  }
};
```

## Required safety rules

- `phpBootstrap` must be relative to the project root.
- Absolute paths must be rejected.
- Parent traversal such as `../vendor/autoload.php` must be rejected.
- The resolved path must stay inside the project root.
- Missing files must fail the build in strict mode.
- The bootstrap must be included before route handlers.
- The bootstrap path must not be printed with secrets or private host paths in public reports.

## Current manual workaround

If you control the deployed PHP host, include Composer autoload from your route handler:

```php
<?php
require_once __DIR__ . '/../../vendor/autoload.php';

function load($event) {
    return [
        'composer' => 'loaded'
    ];
}
```

Use this only when the relative path is stable in generated output. A first-class adapter option is safer because it can validate and generate the include path consistently.

## Acceptance gate for implementation

- [ ] Unit fixture with a fake Composer autoload file.
- [ ] Path safety tests for absolute paths and `..` traversal.
- [ ] PHP smoke proving route handler can call a class/function from bootstrap.
- [ ] Documentation for shared-host upload layout.
- [ ] No new hard dependency on Composer for users who do not need it.
