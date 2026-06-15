import path from 'node:path';
import { writeFile, mkdir } from 'node:fs/promises';
import type { AdapterOptions, Builder } from './types.js';

function assertDevAdapterAllowed(name: string) {
	const allow = process.env.SK_PHP_ALLOW_DEV_ADAPTER === 'true';
	const nodeEnv = process.env.NODE_ENV ?? 'development';
	const ci = process.env.CI === 'true';

	if (!allow && (nodeEnv === 'production' || ci)) {
		throw new Error(
			`${name} is dev-only. Use the production adapter for builds, or set SK_PHP_ALLOW_DEV_ADAPTER=true for an explicit local override.`
		);
	}
}

function getDevStubPhp(adapterName: string) {
	return `<?php
declare(strict_types=1);

http_response_code(503);
header('Content-Type: text/plain; charset=utf-8');
echo "${adapterName} is a development-only stub. Run bun run dev for local development or use the production adapter for deployable PHP output.";
`;
}

/**
 * Lightweight development adapter that writes deterministic stubs only.
 */
export default function sveltekitPhpDevAdapter(options: AdapterOptions = {}) {
	const { ssr = true, out = './build', assets = './build' } = options;

	return {
		name: '@ryanspice/sveltekit-adapter-php-dev',
		async adapt(builder: Builder) {
			assertDevAdapterAllowed('@ryanspice/sveltekit-adapter-php-dev');

			const outDir = path.resolve(out);
			const assetsDir = path.resolve(assets);

			builder.log.minor('Development adapter: writing client assets and explicit PHP stub');
			builder.writeClient(assetsDir);

			if (ssr) {
				await mkdir(outDir, { recursive: true });
				await writeFile(
					path.join(outDir, 'index.php'),
					getDevStubPhp('@ryanspice/sveltekit-adapter-php-dev'),
					'utf8'
				);
				builder.log.minor('Created development-only PHP stub');
			}

			builder.log.minor('Development adapter complete');
		}
	};
}
