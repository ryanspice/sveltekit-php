/**
 * Apache .htaccess templates for SvelteKit PHP Adapter
 * - Fixes refresh 404 for __data.json and __action in php-static mode
 * - Avoids treating __data.json as a "static json" (precompress/static rules can 404 it)
 * - Supports optional base path deployments (docroot .htaccess OR app-root .htaccess)
 *
 * NOTE: If your HTML contains <base href="..."> and SvelteKit emits ../_app URLs,
 * the browser may request /dev/_app/... (missing your base). That cannot be fixed
 * from /dev/sveltekit/.htaccess. Fix by removing <base> OR disabling paths.relative.
 */

import { getHtaccessPhpStatic } from './htaccess/php-static';

export function getHtaccess(
	mode: string,
	base: string,
	precompress = false,
	fallback?: string | boolean,
	trailingSlash: 'always' | 'never' | 'ignore' = 'ignore'
) {
	void mode;
	return getHtaccessPhpStatic(base, precompress, fallback, trailingSlash);
}
