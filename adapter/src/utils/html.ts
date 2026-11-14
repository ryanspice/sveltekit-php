type Token = { text: string; start: number; end: number };
type InlineData = { start: number; end: number; mode: 'nodes' | 'payload' };

/** Only executable inline scripts; comments, raw text and templates are inert. */
function* inlineScripts(html: string) {
	const tags = /<!--[\s\S]*?(?:-->|$)|<\/?([a-z][\w:-]*)\b(?:[^"'<>]|"[^"]*"|'[^']*')*>/gi;
	let templateDepth = 0;
	for (let tag; (tag = tags.exec(html)); ) {
		if (!tag[1]) continue;
		const name = tag[1].toLowerCase();
		const closing = tag[0].startsWith('</');
		if (name === 'template') {
			templateDepth = Math.max(0, templateDepth + (closing ? -1 : 1));
			continue;
		}
		if (closing) continue;
		if (name === 'plaintext') return;
		if (
			![
				'script',
				'style',
				'textarea',
				'title',
				'xmp',
				'iframe',
				'noembed',
				'noframes',
				'noscript'
			].includes(name)
		)
			continue;
		const endTag = new RegExp(`</${name}\\s*>`, 'gi');
		endTag.lastIndex = tags.lastIndex;
		const end = endTag.exec(html);
		if (!end) return;
		if (name === 'script' && templateDepth === 0) {
			const attributes = new Map<string, string>();
			const attrs = /([^\s=/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
			const source = tag[0].slice('<script'.length, -1);
			for (let attr; (attr = attrs.exec(source)); ) {
				const key = attr[1].toLowerCase();
				if (!attributes.has(key)) attributes.set(key, attr[2] ?? attr[3] ?? attr[4] ?? '');
			}
			const type = (attributes.get('type') ?? '').trim().toLowerCase();
			if (
				!attributes.has('src') &&
				['', 'module', 'text/javascript', 'application/javascript'].includes(type)
			) {
				yield { source: html.slice(tags.lastIndex, end.index), offset: tags.lastIndex };
			}
		}
		tags.lastIndex = endTag.lastIndex;
	}
}

/** A bounded lexical scan, not evaluation: quoted text/comments cannot supply signatures. */
function quotedEnd(source: string, start: number): number {
	const quote = source[start];
	for (let i = start + 1; i < source.length; ) {
		if (source[i] === '\\') i += 2;
		else if (source[i] === quote) return i + 1;
		else if (quote === '`' && source.startsWith('${', i)) {
			const expression = scanTokens(source, i + 2, true);
			if (expression.end < 0) return -1;
			i = expression.end;
		} else i++;
	}
	return -1;
}

function scanTokens(
	source: string,
	start = 0,
	stopAtBrace = false
): { tokens: Token[]; end: number } {
	const result: Token[] = [];
	let braceDepth = 0;
	for (let i = start; i < source.length; ) {
		const start = i;
		const c = source[i];
		if (/\s/.test(c)) {
			i++;
			continue;
		}
		if (source.startsWith('//', i)) {
			const end = source.indexOf('\n', i + 2);
			i = end < 0 ? source.length : end;
			continue;
		}
		if (source.startsWith('/*', i)) {
			const end = source.indexOf('*/', i + 2);
			if (end < 0) return { tokens: [], end: -1 };
			i = end + 2;
			continue;
		}
		if (c === '"' || c === "'" || c === '`') {
			i = quotedEnd(source, i);
			if (i < 0) return { tokens: [], end: -1 };
			result.push({ text: '<quoted>', start, end: i });
			continue;
		}
		// Ignore regexp bodies in expression positions (including bundled inline clients).
		const previous = result.at(-1)?.text;
		if (
			c === '/' &&
			(!previous ||
				/^[([{,:;=!?&|+*%~<>-]$/.test(previous) ||
				['return', 'throw', 'case'].includes(previous))
		) {
			let inClass = false;
			for (i++; i < source.length; i++) {
				if (source[i] === '\\') i++;
				else if (source[i] === '[') inClass = true;
				else if (source[i] === ']') inClass = false;
				else if (source[i] === '/' && !inClass) break;
				else if (source[i] === '\n') return { tokens: [], end: -1 };
			}
			if (i >= source.length) return { tokens: [], end: -1 };
			i++;
			while (/[a-z]/i.test(source[i] ?? '') && i < source.length) i++;
			result.push({ text: '<regexp>', start, end: i });
			continue;
		}
		if (/[\w$]/.test(c)) {
			while (i < source.length && /[\w$]/.test(source[i])) i++;
		} else i++;
		if (c === '{') braceDepth++;
		if (c === '}') {
			if (stopAtBrace && braceDepth === 0) return { tokens: result, end: i };
			braceDepth--;
		}
		result.push({ text: source.slice(start, i), start, end: i });
	}
	return { tokens: result, end: stopAtBrace ? -1 : source.length };
}

function closeGroup(ts: Token[], start: number): number {
	const pairs = new Map([
		['[', ']'],
		['{', '}'],
		['(', ')']
	]);
	if (!pairs.has(ts[start]?.text)) return -1;
	const stack: string[] = [];
	for (let i = start; i < ts.length; i++) {
		const text = ts[i].text;
		if (pairs.has(text)) stack.push(pairs.get(text)!);
		else if ([']', '}', ')'].includes(text)) {
			if (stack.pop() !== text) return -1;
			if (stack.length === 0) return i;
		}
	}
	return -1;
}

function findInlineData(html: string): InlineData | null {
	const matches: InlineData[] = [];
	for (const script of inlineScripts(html)) {
		const ts = scanTokens(script.source).tokens;
		for (let i = 2; i < ts.length; i++) {
			// Kit's split, single and inline bundle strategies all call .start(..., options).
			if (
				ts[i].text !== 'start' ||
				ts[i - 1].text !== '.' ||
				!['kit', 'app'].includes(ts[i - 2].text) ||
				ts[i + 1]?.text !== '('
			)
				continue;
			const callEnd = closeGroup(ts, i + 1);
			if (callEnd < 0) continue;
			for (let arg = i + 2; arg < callEnd; arg++) {
				if (['[', '(', '{'].includes(ts[arg].text)) {
					const end = closeGroup(ts, arg);
					if (end < 0) break;
					if (ts[arg].text === '{' && end === callEnd - 1) {
						const fields = new Map<string, [number, number]>();
						let valid = true;
						for (let field = arg + 1; field < end; ) {
							if (ts[field + 1]?.text !== ':') {
								valid = false;
								break;
							}
							const value = field + 2;
							let valueEnd = value;
							while (valueEnd < end && ts[valueEnd].text !== ',') {
								if (['[', '(', '{'].includes(ts[valueEnd].text)) {
									const groupEnd = closeGroup(ts, valueEnd);
									if (groupEnd < 0) break;
									valueEnd = groupEnd;
								}
								valueEnd++;
							}
							if (fields.has(ts[field].text)) return null;
							fields.set(ts[field].text, [value, valueEnd]);
							field = valueEnd + 1;
						}
						if (!valid) break;
						const ids = fields.get('node_ids');
						const data = fields.get('data');
						if (!ids || ts[ids[0]].text !== '[' || !data) break;
						let [start, finish] = data;
						if (finish === start + 1 && ts[start].text === 'data') {
							// Legacy separate declaration, but only when referenced by the options.
							const declarations: [number, number][] = [];
							for (let d = 0; d < i; d++) {
								if (
									['const', 'let', 'var'].includes(ts[d].text) &&
									ts[d + 1]?.text === 'data' &&
									ts[d + 2]?.text === '='
								) {
									const end = closeGroup(ts, d + 3);
									if (end >= 0 && end < i && ts[end + 1]?.text === ';')
										declarations.push([d + 3, end + 1]);
								}
							}
							if (declarations.length !== 1) break;
							[start, finish] = declarations[0];
						}
						if (!['[', '{'].includes(ts[start].text) || closeGroup(ts, start) !== finish - 1) break;
						matches.push({
							start: script.offset + ts[start].start,
							end: script.offset + ts[finish - 1].end,
							mode: ts[start].text === '[' ? 'nodes' : 'payload'
						});
					}
					arg = end;
				}
			}
		}
	}
	return matches.length === 1 ? matches[0] : null;
}

export function detectInlineDataModeFromHtml(html: string): 'nodes' | 'payload' | 'unknown' {
	return findInlineData(html)?.mode ?? 'unknown';
}

/** Replace only the literal supplied to Kit's hydration options, never visible page text. */
export function replaceInlineConstData(html: string): string | null {
	return rewriteInlineData(html)?.html ?? null;
}

/** Share one selected range and mode when generating the PHP bridge and document. */
export function rewriteInlineData(
	html: string
): { html: string; mode: 'nodes' | 'payload' } | null {
	const data = findInlineData(html);
	if (!data) return null;
	return {
		html:
			html.slice(0, data.start) +
			'(function(){ const d = <?php echo $dataPayload; ?>; return d; })()' +
			html.slice(data.end),
		mode: data.mode
	};
}
