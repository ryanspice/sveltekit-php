import path from 'node:path';

/**
 * Keep fixture output out of the app's development watch tree.
 * @param {string} [outDir]
 * @param {string} [root]
 */
export function createDevWatchIgnored(outDir = '.svelte-kit', root = process.cwd()) {
	const normalize = (/** @type {string} */ file) => {
		const normalized = path.resolve(file).replace(/\\/g, '/');
		return process.platform === 'win32' ? normalized.toLowerCase() : normalized;
	};
	const kitOutput = normalize(path.resolve(root, outDir));
	const generated = `${kitOutput}/generated`;
	return (/** @type {string} */ filePath) => {
		const file = normalize(path.resolve(root, filePath));
		// Keep ancestors traversable when the current output is nested inside a fixture tree.
		// Kit's generated modules remain watched for HMR.
		if (
			file === kitOutput ||
			kitOutput.startsWith(`${file}/`) ||
			file === generated ||
			file.startsWith(`${generated}/`)
		)
			return false;
		const relative = path.relative(normalize(root), file).replace(/\\/g, '/');
		const top = relative.split('/')[0];
		return (
			/^\.svelte-kit[^/]*$/.test(top) ||
			/^(?:build-e2e-.+|build|build-server|build-verify-.+|build-fallback|build-negotiate)$/.test(
				top
			)
		);
	};
}
