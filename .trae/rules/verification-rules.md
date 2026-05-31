Verification Plan — SvelteKit PHP Adapter

Run scripts/verify-comprehensive.mjs. Base=/sveltekit-php. Always start PHP. js-ssr: start sidecar; tests talk to PHP only.

php-static: prerender+hydrate; PHP serves assets, __data.json bridge, actions/endpoints, negotiation (no runtime SSR). js-ssr: PHP proxies HTML/__data/actions to sidecar (SSR+stream).

P0: base mount 200; base kept in asset URLs + redirect Location; root markers; __data.json works (never call __data.php); layout merge (/parent-child/nested); ssr-data (js-ssr HTML has server data; php-static no “waiting”); redirect-me keeps query; negotiate method+Accept + Vary:Accept; form-basic plain+enhanced (x-sveltekit-action); api/ping JSON; cookies roundtrip + proxy preserves multi Set-Cookie.

P1: form-multipart; 404; error-throw 500. P2: stream (chunked in js-ssr); test-js prerender.

Run: bun scripts/verify-comprehensive.mjs --base=/sveltekit-php --phpPort=8086 --mode=php-static; for js-ssr add --mode=js-ssr --ssrPort=3010
