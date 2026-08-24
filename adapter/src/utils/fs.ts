import { access } from 'node:fs/promises';
import { existsSync, rmSync } from 'node:fs';

export async function exists(p: string) {
	try {
		await access(p);
		return true;
	} catch {
		return false;
	}
}

export interface CleanBuildDirectoryOptions {
	strict: boolean;
	warn(message: string): void;
	remove?: typeof rmSync;
	pathExists?: typeof existsSync;
	wait?: (milliseconds: number) => Promise<void>;
}

export async function cleanBuildDirectory(
	dir: string,
	{
		strict,
		warn,
		remove = rmSync,
		pathExists = existsSync,
		wait = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
	}: CleanBuildDirectoryOptions
): Promise<void> {
	if (!pathExists(dir)) return;

	try {
		remove(dir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
		return;
	} catch {
		await wait(200);
	}

	try {
		remove(dir, { recursive: true, force: true });
	} catch (error) {
		const message = `Failed to clean ${dir}: ${String(error)}`;
		if (!strict) warn(`${message} Refusing to build into stale output.`);
		throw new Error(message, { cause: error });
	}
}
