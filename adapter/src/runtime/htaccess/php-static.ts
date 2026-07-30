import { htaccessTrailingSlashBlock } from './trailing-slash';

const trimSlashes = (s: string) => s.replace(/^\/+|\/+$/g, '');
const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function joinRoot(rootPrefix: string, target: string) {
	const t = trimSlashes(target);
	return `${rootPrefix}${t}`;
}

function normalizeFallback(rootPrefix: string, fallback?: string | boolean) {
	if (fallback === false) return null;
	if (typeof fallback === 'string' && fallback.trim()) return joinRoot(rootPrefix, fallback);
	return joinRoot(rootPrefix, 'index.php');
}

export function getHtaccessPhpStatic(
	base: string,
	precompress = false,
	fallback?: string | boolean,
	trailingSlash: 'always' | 'never' | 'ignore' = 'ignore'
) {
	const baseTrimmed = trimSlashes(base);
	const baseRe = baseTrimmed ? escapeRe(baseTrimmed) : '';
	const basePrefix = baseTrimmed ? `${baseTrimmed}/` : '';
	const baseOptional = baseTrimmed ? `(?:${baseRe}/)?` : '';

	const rootPrefix = baseTrimmed ? `/${basePrefix}` : `/`;

	const fallbackTarget = normalizeFallback(rootPrefix, fallback);

	const redirectRules = htaccessTrailingSlashBlock({ basePath: rootPrefix, trailingSlash });

	const guardRules = `
	# deny dotfiles anywhere
	RewriteRule (^|/)\\. - [F,L]
`;

	const precompressRules = precompress
		? `
	# precompressed assets (br > gz) — EXCLUDES __data.json + __action
	RewriteCond %{REQUEST_URI} !/__data\\.json$ [NC]
	RewriteCond %{REQUEST_URI} !/__action$ [NC]
	RewriteCond %{HTTP:Accept-Encoding} br [NC]
	RewriteCond %{REQUEST_FILENAME}\\.br -f
	RewriteRule ^(.+\\.(?:css|js|mjs|json|map|svg|txt|wasm|woff2?))$ $1.br [QSA,L]

	RewriteCond %{REQUEST_URI} !/__data\\.json$ [NC]
	RewriteCond %{REQUEST_URI} !/__action$ [NC]
	RewriteCond %{HTTP:Accept-Encoding} gzip [NC]
	RewriteCond %{REQUEST_FILENAME}\\.gz -f
	RewriteRule ^(.+\\.(?:css|js|mjs|json|map|svg|txt|wasm|woff2?))$ $1.gz [QSA,L]
`
		: '';

	const headerRules = `
<IfModule mod_headers.c>
	Header always set X-Content-Type-Options "nosniff"

	<IfModule mod_setenvif.c>
		SetEnvIf Request_URI "^${rootPrefix}_app/" SK_ASSET=1
		SetEnvIf Request_URI "__data\\.json$" SK_DATA=1
		SetEnvIf Request_URI "__action$"    SK_ACTION=1
	</IfModule>

	Header set Cache-Control "public, max-age=31536000, immutable" env=SK_ASSET
	Header set Cache-Control "no-store" env=SK_DATA
	Header set Cache-Control "no-store" env=SK_ACTION

	${precompress ? 'Header append Vary "Accept-Encoding"\n' : ''}
</IfModule>
<IfModule mod_mime.c>
	AddType text/markdown       .md
	AddType text/csv            .csv
	AddType image/svg+xml       .svg
	AddType application/json    .json
</IfModule>
${
	precompress
		? `<IfModule mod_mime.c>
	AddEncoding br .br
	AddEncoding gzip .gz

	# map content-types for double-extensions
	AddType text/css              .css.br  .css.gz
	AddType application/javascript .js.br   .js.gz
	AddType application/javascript .mjs.br  .mjs.gz
	AddType application/json      .json.br .json.gz
	AddType application/json      .map.br  .map.gz
	AddType image/svg+xml         .svg.br  .svg.gz
	AddType application/wasm      .wasm.br .wasm.gz
	AddType font/woff2            .woff2.br .woff2.gz
</IfModule>
`
		: ''
}`.trim();

	const commonRules = `
	RewriteEngine On
	Options -MultiViews

${redirectRules}

	# Prefer PHP when a directory contains both index.php and index.html
	DirectoryIndex index.php index.html

${guardRules}
	# deny adapter private area (convention)
	RewriteRule ^${baseOptional}_protected/ - [F,L]

	# stop rewrite loops / direct hits
	RewriteRule ^${baseOptional}(?:index\\.php|router\\.php)$ - [L]
	RewriteRule ^${baseOptional}__data\\.php$ - [L]
	RewriteRule ^${baseOptional}__action\\.php$ - [L]

	# ALWAYS resolve SvelteKit data/action first
	RewriteRule ^${baseOptional}(.*/)?__data\\.json$ ${rootPrefix}$1__data.php [QSA,L]
	RewriteRule ^${baseOptional}(.*/)?__action$    ${rootPrefix}$1__action.php [QSA,L]

${precompressRules}
	# normalize nested /_app asset hits to rootPrefix/_app
	RewriteCond %{REQUEST_URI} !^${rootPrefix}_app/ [NC]
	RewriteRule ^${baseOptional}.+/_app/(.*)$ ${rootPrefix}_app/$1 [L]
	RewriteCond %{REQUEST_URI} !^${rootPrefix}_app/ [NC]
	RewriteRule ^.+/_app/(.*)$ ${rootPrefix}_app/$1 [L]

	# let real _app assets through (after normalization)
	RewriteRule ^${baseOptional}_app/ - [L]

	# let existing files through
	RewriteCond %{REQUEST_FILENAME} -f
	RewriteRule ^ - [L]
${
	trailingSlash !== 'never'
		? `
	# let existing directories through (if not 'never')
	RewriteCond %{REQUEST_FILENAME} -d
	RewriteRule ^ - [L]
`
		: ''
}
`;

	const dirAndFallbackRules = fallbackTarget
		? `
	# directory index resolution (php > html)
	RewriteCond %{REQUEST_FILENAME} -d
	RewriteCond %{REQUEST_FILENAME}/index.php -f
	RewriteRule ^${baseOptional}(.+?)/?$ ${rootPrefix}$1/index.php [QSA,L]

	# base root -> index.php (covers /dev/sveltekit/)
	RewriteCond %{REQUEST_FILENAME} -d
	RewriteCond %{REQUEST_FILENAME}/index.php -f
	RewriteRule ^${baseOptional}$ ${rootPrefix}index.php [QSA,L]

	RewriteCond %{REQUEST_FILENAME} -d
	RewriteCond %{REQUEST_FILENAME}/index.html -f
	RewriteRule ^${baseOptional}(.+?)/?$ ${rootPrefix}$1/index.html [QSA,L]

	# extension-less to .php (route/page endpoints emitted by adapter)
	RewriteCond %{REQUEST_FILENAME}.php -f
	RewriteRule ^${baseOptional}(.+?)/?$ ${rootPrefix}$1.php [QSA,L]

	# final fallback (router or index)
	RewriteRule ^${baseOptional}.*$ ${fallbackTarget} [QSA,L]
`
		: `
	# no fallback (explicit)
`;

	return `
<IfModule mod_rewrite.c>
${commonRules}
${dirAndFallbackRules}
</IfModule>
${headerRules}
`.trimStart();
}
