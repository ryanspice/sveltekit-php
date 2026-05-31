export function detectInlineDataModeFromHtml(html: string): 'nodes' | 'payload' | 'unknown' {
	// We need to find "const data =" OR "data:" followed by [ or {
	// Because "data:" can appear in data-URIs, we must loop until we find a valid one.

	const patterns = ['const data', 'let data', 'var data', 'data:'];

	for (const p of patterns) {
		let startPos = 0;
		while (true) {
			const idx = html.indexOf(p, startPos);
			if (idx === -1) break;

			// Check what follows
			for (let i = idx + p.length; i < html.length; i++) {
				const c = html[i];
				if (c === '=' || c === ':' || c === ' ' || c === '\t' || c === '\r' || c === '\n') continue;

				if (c === '[') return 'nodes';
				if (c === '{') return 'payload';

				// Invalid char, this occurrence is not it (e.g. data:image)
				break;
			}

			startPos = idx + 1;
		}
	}

	return 'unknown';
}

/**
 * Replaces the JSON array/object literal with a PHP echo statement.
 * Supports finding "const data = [...]" or "data: [...]" inside the HTML script tags.
 */
export function replaceInlineConstData(html: string): string | null {
	// 1. Locate the script block that contains the SvelteKit data payload.
	//    This is usually inside <script type="application/json" data-sveltekit-fetched> or a regular <script> tag depending on Kit version.
	//    Actually, standard SvelteKit (latest) often puts `const data = [...]` inside a module script or standard script.

	// We'll search for the signature of the data assignment.
	const patterns = ['const data', 'let data', 'var data', 'data:'];

	for (const p of patterns) {
		let startPos = 0;
		while (true) {
			const startIdx = html.indexOf(p, startPos);
			if (startIdx === -1) break;

			// Check context: ensure we are not inside a string (simplistic check)
			// A better way is to verify what comes after.

			// Find opening bracket
			let openIdx = -1;
			let openChar = '';
			let closeChar = '';
			let isValid = false;

			for (let i = startIdx + p.length; i < html.length; i++) {
				const c = html[i];
				if (c === ' ' || c === '\t' || c === '\r' || c === '\n' || c === '=' || c === ':') continue;
				if (c === '[') {
					openIdx = i;
					openChar = '[';
					closeChar = ']';
					isValid = true;
					break;
				}
				if (c === '{') {
					openIdx = i;
					openChar = '{';
					closeChar = '}';
					isValid = true;
					break;
				}
				// Invalid char -> not this one
				break;
			}

			if (!isValid) {
				startPos = startIdx + 1;
				continue;
			}

			// Found valid start, now find end
			let balance = 1;
			let closeIdx = -1;
			let inString = false;
			let stringChar = '';
			let escape = false;

			for (let i = openIdx + 1; i < html.length; i++) {
				const c = html[i];

				if (escape) {
					escape = false;
					continue;
				}

				if (c === '\\') {
					escape = true;
					continue;
				}

				if (inString) {
					if (c === stringChar) inString = false;
					continue;
				}

				if (c === '"' || c === "'" || c === '`') {
					inString = true;
					stringChar = c;
					continue;
				}

				if (c === openChar) {
					balance++;
				} else if (c === closeChar) {
					balance--;
					if (balance === 0) {
						closeIdx = i;
						break;
					}
				}
			}

			if (closeIdx !== -1) {
				const before = html.slice(0, openIdx);
				const after = html.slice(closeIdx + 1);

				// Check if we are replacing "data:" (object property) or "const data =" (variable)
				// We only want to append ", hydrate: true" if we are inside the start options object.
				// "data:" implies object property.
				const isProperty = /data\s*:\s*$/.test(before);

				if (isProperty) {
					return `${before} (function(){ const d = <?php echo $dataPayload; ?>; return d; })() , hydrate: true ${after}`;
				} else {
					return `${before} (function(){ const d = <?php echo $dataPayload; ?>; return d; })()${after}`;
				}
			}

			startPos = startIdx + 1;
		}
	}

	return null;
}
