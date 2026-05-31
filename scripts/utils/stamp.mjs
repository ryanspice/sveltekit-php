import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { normalizeAdapterMode } from './config.mjs';

export async function verifyBuildStamp(buildDir, expectedMode, expectedBasePath) {
	const stampPath = path.join(buildDir, '_runtime', 'build-stamp.json');

	if (!existsSync(stampPath)) {
		return { ok: false, error: `Build stamp missing at ${stampPath}` };
	}

	try {
		const content = await readFile(stampPath, 'utf8');
		const stamp = JSON.parse(content);

		const normalizedExpectedMode = normalizeAdapterMode(expectedMode);
		const normalizedActualMode = normalizeAdapterMode(stamp.mode);
		if (normalizedActualMode !== normalizedExpectedMode) {
			return {
				ok: false,
				error: `Mode mismatch: expected '${normalizedExpectedMode}', got '${stamp.mode}'`
			};
		}

		// Normalize base paths for comparison (remove trailing slashes, ensure leading slash if not empty)
		const normalize = (p) => {
			if (!p || p === '/' || p === '.') return '';
			let s = p.trim();
			if (s.endsWith('/')) s = s.slice(0, -1);
			if (!s.startsWith('/') && s.length > 0) s = '/' + s;
			return s;
		};

		const normExpected = normalize(expectedBasePath);
		const normActual = normalize(stamp.basePath);

		if (normActual !== normExpected) {
			return {
				ok: false,
				error: `BasePath mismatch: expected '${normExpected}', got '${normActual}'`
			};
		}

		return { ok: true, stamp };
	} catch (e) {
		return { ok: false, error: `Failed to read/parse stamp: ${e.message}` };
	}
}
