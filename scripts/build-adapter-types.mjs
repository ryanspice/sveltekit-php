import { spawnSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const declarations = path.join(repoRoot, 'adapter', 'declarations');
const expected = path.resolve(repoRoot, 'adapter', 'declarations');
if (path.resolve(declarations) !== expected || !declarations.startsWith(path.join(repoRoot, 'adapter'))) {
	throw new Error(`Refusing to clean unexpected declarations path: ${declarations}`);
}
rmSync(declarations, { recursive: true, force: true });
const command = process.platform === 'win32' ? 'bun.exe' : 'bun';
const result = spawnSync(command, ['x', 'tsc', '-p', 'adapter/tsconfig.declarations.json'], {
	cwd: repoRoot,
	stdio: 'inherit'
});
if (result.error) throw result.error;
if (result.status !== 0) process.exit(result.status ?? 1);
