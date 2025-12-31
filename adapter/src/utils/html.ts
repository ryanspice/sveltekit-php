export function detectInlineDataModeFromHtml(html: string): 'nodes' | 'payload' | 'unknown' {
	// We need to find "const data =" OR "data:" followed by [ or {
	// Because "data:" can appear in data-URIs, we must loop until we find a valid one.

	const patterns = ['const data', 'data:'];

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

export function replaceInlineConstData(html: string): string | null {
	const patterns = ['const data', 'data:'];

	for (const p of patterns) {
		let startPos = 0;
		while (true) {
			const startIdx = html.indexOf(p, startPos);
			if (startIdx === -1) break;

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
				return `${before} <?php echo $__SK_DATA; ?>${after}`;
			}

			// If we got here, we found open but not close? Abort this match.
			startPos = startIdx + 1;
		}
	}

	return null;
}
