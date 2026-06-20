# WordPress and CMS embedding recipe

Last updated: 2026-06-17

This repo does not currently generate a WordPress plugin, shortcode, or admin page adapter. The supported core lane is generic PHP/shared-hosting output.

Use this recipe to decide whether `sveltekit-php` is the right tool for a WordPress/CMS deployment.

## Current support

| Need | Current status |
| --- | --- |
| Upload prerendered/static PHP output to a PHP-capable host | Supported |
| Serve SvelteKit assets from a subdirectory | Partial, use `kit.paths.base` / `kit.paths.assets` carefully |
| Embed generated app inside an existing CMS theme shell | Not first-class |
| Generate WordPress shortcode | Not supported |
| Generate WordPress admin plugin | Not supported |
| Shadow DOM or CSS isolation for CMS themes | Not supported in core |
| `renderHead` / `renderBody` hooks | Not supported in core |

## Recommended current approach

For a standalone SvelteKit app hosted alongside WordPress:

```js
// svelte.config.js
import adapter from 'sveltekit-php/adapter';

export default {
  kit: {
    paths: {
      base: '/my-svelte-app',
      assets: '/my-svelte-app'
    },
    adapter: adapter({
      mode: 'php-static',
      basePath: '/my-svelte-app'
    })
  }
};
```

Deploy the generated output to the matching subdirectory, then link to it from WordPress navigation.

## Avoid for now

- Do not copy generated chunks into a theme by hand without preserving `_app` paths.
- Do not rely on WordPress rewrite rules to fix a wrong SvelteKit base path.
- Do not embed a hydrated SvelteKit app into arbitrary post content unless CSS and script loading are controlled.
- Do not claim server-side Svelte document rendering from PHP alone. Use `js-ssr` if request-time Svelte SSR is required.

## Future profile candidates

- `wordpress-shortcode` profile for shortcode output.
- `wordpress-admin` profile for admin page output.
- `renderHead` and `renderBody` hooks for theme integration.
- Optional style-isolation guidance for theme conflicts.
- Upload-layout examples for `wp-content/uploads` or plugin directories.

## Acceptance gate for a WordPress profile

- [ ] Fixture WordPress-like base path.
- [ ] CSS/JS asset path smoke.
- [ ] `renderHead` / `renderBody` deterministic output.
- [ ] Clear limitation docs for hydration, forms, auth, and WordPress rewrite rules.
- [ ] No core adapter behavior changes for non-WordPress users.
