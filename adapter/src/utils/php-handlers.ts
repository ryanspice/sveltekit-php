const HTTP_METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'] as const;

type PhpHandlerKind = 'page' | 'layout' | 'endpoint';

const PHP_FUNCTION_RE = /\bfunction\s+(&\s*)?([A-Za-z_][A-Za-z0-9_]*)\s*\(/g;

function escapeRegExp(value: string) {
	return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function kindForServerFile(rel: string): PhpHandlerKind {
	if (rel.endsWith('+server.php')) return 'endpoint';
	if (rel.includes('+layout')) return 'layout';
	return 'page';
}

function actionName(name: string, prefix: string, kind: PhpHandlerKind) {
	const canonical = name.match(/^action_([A-Za-z0-9_]+)$/);
	if (canonical) return canonical[1];

	const expected = name.match(new RegExp(`^${escapeRegExp(prefix)}_action_([A-Za-z0-9_]+)$`));
	if (expected) return expected[1];

	const legacy = name.match(
		new RegExp(`^sk_[A-Za-z0-9_]+_${kind}_server_action_([A-Za-z0-9_]+)$`)
	);
	return legacy?.[1] ?? null;
}

function loadTarget(name: string, prefix: string, kind: PhpHandlerKind) {
	if (name === 'load' || name === `${prefix}_load`) return `${prefix}_load`;
	if (new RegExp(`^sk_[A-Za-z0-9_]+_${kind}_server_load$`).test(name)) {
		return `${prefix}_load`;
	}
	return null;
}

function endpointTarget(name: string, prefix: string) {
	if ((HTTP_METHODS as readonly string[]).includes(name)) return `${prefix}_${name}`;

	const expected = name.match(
		new RegExp(`^${escapeRegExp(prefix)}_(${HTTP_METHODS.join('|')})$`)
	);
	if (expected) return `${prefix}_${expected[1]}`;

	const legacy = name.match(new RegExp(`^sk_[A-Za-z0-9_]+_server_(${HTTP_METHODS.join('|')})$`));
	if (legacy) return `${prefix}_${legacy[1]}`;

	return null;
}

function handlerTarget(name: string, kind: PhpHandlerKind, prefix: string) {
	if (kind === 'endpoint') return endpointTarget(name, prefix);

	const load = loadTarget(name, prefix, kind);
	if (load) return load;

	const action = actionName(name, prefix, kind);
	return action ? `${prefix}_action_${action}` : null;
}

function looksLikeUnsupportedHandler(name: string, kind: PhpHandlerKind) {
	if (kind === 'endpoint') {
		if (HTTP_METHODS.some((method) => method.toLowerCase() === name.toLowerCase())) return true;
		return /^sk_[A-Za-z0-9_]+_server_(get|post|put|delete|patch|options|head)$/i.test(name);
	}

	if (name === 'action' || /^action[A-Z]/.test(name)) return true;
	return /_(page|layout)_server_(load|action)(_|$)/.test(name);
}

export function normalizePhpHandlerSource(source: string, rel: string, prefix: string) {
	const kind = kindForServerFile(rel);
	const renames = new Map<string, string>();
	const referenceRenames = new Map<string, string>();
	const targets = new Map<string, string>();
	const errors: string[] = [];

	for (const match of source.matchAll(PHP_FUNCTION_RE)) {
		const name = match[2];
		const target = handlerTarget(name, kind, prefix);

		if (!target) {
			if (looksLikeUnsupportedHandler(name, kind)) {
				errors.push(`Unsupported PHP handler export "${name}" in ${rel}`);
			}
			continue;
		}

		const existing = targets.get(target);
		if (existing && existing !== name) {
			errors.push(`Duplicate PHP handler export for "${target}" in ${rel}: ${existing}, ${name}`);
		}

		targets.set(target, name);
		renames.set(name, target);
		if (name !== target) {
			referenceRenames.set(name, target);
		}
	}

	if (targets.size === 0) {
		errors.push(`No callable PHP handler exports found in ${rel}`);
	}

	if (errors.length > 0) {
		throw new Error(errors.join('\n'));
	}

	let normalized = source.replace(PHP_FUNCTION_RE, (full, byRef: string | undefined, name: string) => {
		const target = renames.get(name);
		return target ? full.replace(name, target) : full;
	});

	for (const [from, to] of referenceRenames) {
		normalized = normalized.replace(
			new RegExp(`\\b${escapeRegExp(from)}\\s*\\(`, 'g'),
			(call) => call.replace(from, to)
		);
	}

	return normalized;
}
