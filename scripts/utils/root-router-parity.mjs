import { parseArgs } from 'node:util';

/** @param {string[]} argv */
export function parseParityArgs(argv) {
	const { values } = parseArgs({
		args: argv,
		options: {
			build: { type: 'string' },
			host: { type: 'string' },
			generatedPort: { type: 'string' },
			rootPort: { type: 'string' },
			basePath: { type: 'string' }
		},
		strict: true,
		allowPositionals: false
	});
	for (const [key, value] of Object.entries(values)) {
		if (key !== 'basePath' && value.trim() === '') {
			throw new Error(`--${key} requires a nonempty value`);
		}
	}
	return values;
}

/**
 * @typedef {object} ParityResponse
 * @property {number} statusCode
 * @property {string} contentType
 * @property {string} location
 * @property {string} normalizedBodyHash
 * @property {string} normalizedBody
 */

/** @param {ParityResponse} generated @param {ParityResponse} root */
export function compareResponses(generated, root) {
	if (generated.statusCode !== root.statusCode) {
		return { ok: false, reason: `status mismatch ${generated.statusCode} !== ${root.statusCode}` };
	}
	if (generated.contentType !== root.contentType) {
		return {
			ok: false,
			reason: `content-type mismatch ${generated.contentType || '(none)'} !== ${root.contentType || '(none)'}`
		};
	}
	if (generated.location !== root.location) {
		return {
			ok: false,
			reason: `location mismatch ${generated.location || '(none)'} !== ${root.location || '(none)'}`
		};
	}
	if (generated.normalizedBodyHash !== root.normalizedBodyHash) {
		return {
			ok: false,
			reason: `body mismatch ${firstDiff(generated.normalizedBody, root.normalizedBody)}`
		};
	}
	return { ok: true, reason: '' };
}

/** @param {string} left @param {string} right */
function firstDiff(left, right) {
	const max = Math.min(left.length, right.length);
	let index = 0;
	while (index < max && left[index] === right[index]) index += 1;
	const leftSnippet = JSON.stringify(left.slice(Math.max(0, index - 40), index + 80));
	const rightSnippet = JSON.stringify(right.slice(Math.max(0, index - 40), index + 80));
	return `at ${index}; generated=${leftSnippet}; root=${rightSnippet}`;
}

/** @param {Buffer} body @param {number} port @param {string} host */
export function normalizeBodyForComparison(body, port, host) {
	const text = body.toString('utf8');
	return (
		text
			.replaceAll(`${host}:${port}`, `${host}:<PORT>`)
			.replaceAll(`localhost:${port}`, 'localhost:<PORT>')
			.replace(/req_[a-f0-9]+\.\d+/g, 'req_<ID>')
			.replace(/layout_[a-f0-9]+\.\d+/g, 'layout_<ID>')
			.replace(/page_[a-z0-9_-]+_[a-f0-9]+\.\d+/g, 'page_<ID>')
			.replace(/("PHP [^"]+",)\d+/g, '$1<MEMORY>')
			// The demo layout emits memory_get_usage immediately after its PHP engine field.
			// Keep all surrounding payload bytes and every other numeric value significant.
			.replace(
				/("php_engine"\s*:\s*"PHP [^"]+",\s*"memory_usage"\s*:\s*)(?:0|[1-9]\d*)(?=\s*[,}])/g,
				'$1<MEMORY>'
			)
	);
}
