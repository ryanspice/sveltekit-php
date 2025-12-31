import { access } from 'node:fs/promises';

export async function exists(p: string) {
	try {
		await access(p);
		return true;
	} catch {
		return false;
	}
}
