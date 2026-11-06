import { describe, expect, it } from 'vitest';
import path from 'node:path';
import { createDevWatchIgnored } from '../../scripts/utils/dev-watch.mjs';

describe('development watch boundaries', () => {
	for (const parent of ['.svelte-kit', 'build-e2e-nested']) {
		it(`traverses the ancestors of nested output under ${parent}`, () => {
			const output = `${parent}/custom/kit`;
			const ignored = createDevWatchIgnored(output);
			for (const file of [
				parent,
				`${parent}/custom`,
				output,
				`${output}/generated/client/app.js`
			]) {
				expect(ignored(path.resolve(file)), file).toBe(false);
			}
			for (const file of [`${parent}/other/generated/app.js`, `${output}/output/server/index.js`]) {
				expect(ignored(path.resolve(file)), file).toBe(true);
			}
		});
	}
	for (const output of ['.svelte-kit', '.svelte-kit-devcheck-root', '.svelte-kit-devcheck-base']) {
		it(`preserves source and current generated modules for ${output}`, () => {
			const ignored = createDevWatchIgnored(output);
			for (const file of [
				'src/routes/+page.svelte',
				'src/lib/build/source.ts',
				'static/logo.svg',
				'vite.config.ts',
				output,
				`${output}/generated`,
				`${output}/generated/client/app.js`
			])
				expect(ignored(path.resolve(file)), file).toBe(false);
			for (const file of [
				`${output}/output/client/index.html`,
				'.svelte-kit-fixture/generated/client/app.js',
				'.svelte-kit-fixture/output/server/index.js',
				'build-e2e-php-static',
				'build-e2e-js-ssr-root-server/handler.mjs',
				'build/index.php',
				'build-server/handler.mjs',
				'build-verify-all/index.php',
				'build-fallback/200.html',
				'build-negotiate/index.php'
			])
				expect(ignored(path.resolve(file)), file).toBe(true);
			expect(ignored(path.resolve('../outside/src/page.ts'))).toBe(false);
		});
	}
});
