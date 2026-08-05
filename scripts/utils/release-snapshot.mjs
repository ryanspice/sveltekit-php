import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const packageJsonPath = path.resolve(
	path.dirname(fileURLToPath(import.meta.url)),
	'../../package.json'
);

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

export const PACKAGE_VERSION = packageJson.version;
export const RELEASE_TRACK = packageJson.sveltekitPhpReleasePolicy?.track ?? '';
export const RELEASE_CHANNEL = packageJson.sveltekitPhpReleasePolicy?.channel ?? '';

export function packageVersion() {
	return PACKAGE_VERSION;
}
