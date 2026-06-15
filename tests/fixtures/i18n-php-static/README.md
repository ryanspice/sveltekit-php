# i18n PHP-static fixture

This fixture documents the route shapes required for locale-prefixed SvelteKit output under the PHP-static adapter.

It is intentionally small and dependency-free. Unit tests assert the adapter parser/router contracts directly; this fixture provides the concrete SvelteKit file layout for future end-to-end expansion.

Covered surfaces:

- `[lang=lang]` param matcher via `src/params/lang.ts`
- localized page route at `/fr/`
- localized article route at `/fr/[slug]/`
- localized endpoint at `/fr/rss.xml`
- localized RSS reader page at `/fr/rss-reader/`
- localized action route at `/fr/action-test`
- localized JSON endpoint at `/fr/api/locale`
- base-path expectation such as `/blog/fr/...`
- SvelteKit data/action companion paths such as `/blog/fr/demo/__data.json` and `/blog/fr/action-test/__action`

