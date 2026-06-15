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

function getViteDevRouterPhp() {
	return `<?php
declare(strict_types=1);

http_response_code(503);
header('Content-Type: text/plain; charset=utf-8');
echo "The Vite PHP dev adapter is a development-only stub. Start the repo dev workflow with bun run dev, or build with the production adapter before serving PHP output.";
`;
}

/**
 * Vite-integrated development adapter for local development only.
 */
export default function sveltekitViteDevAdapter(options: AdapterOptions = {}) {
	const { ssr = true, out = './build', assets = './build' } = options;

	return {
		name: '@ryanspice/sveltekit-adapter-php-vite-dev',
		async adapt(builder: Builder) {
			assertDevAdapterAllowed('@ryanspice/sveltekit-adapter-php-vite-dev');

			const outDir = path.resolve(out);
			const assetsDir = path.resolve(assets);

			builder.log.minor('Vite dev adapter: writing client assets and explicit PHP stub');
			builder.writeClient(assetsDir);

			if (ssr) {
				await mkdir(outDir, { recursive: true });
				await writeFile(path.join(outDir, 'dev-router.php'), getViteDevRouterPhp(), 'utf8');
				builder.log.minor('Created Vite development-only PHP stub');
			}

			builder.log.minor('Vite dev adapter complete');
		}
	};
}
