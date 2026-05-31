import path from 'node:path';

export const posixify = (p: string) => p.split(path.sep).join(path.posix.sep);

export const stripLeadingSlash = (s: string) => (s.startsWith('/') ? s.slice(1) : s);

export function toPhpIdentifier(s: string) {
	// conservative: only [A-Za-z0-9_], never start with a digit
	const t = s.replace(/[^A-Za-z0-9_]/g, '_');
	return /^\d/.test(t) ? `_${t}` : t;
}

export function fnPrefixForServerFile(serverRelPosix: string) {
	// example: "(app)/blog/+page.server.php" -> "sk__app__blog__page_server"
	const base = serverRelPosix
		.replace(/^\//, '')
		.replace(/\.php$/i, '')
		.replace(/\//g, '_')
		.replace(/\+/g, '')
		.replace(/\./g, '_');
	return `sk_${toPhpIdentifier(base)}`;
}

export function phpRelToRootFromNav(navPath: string) {
	// navPath like "/a/b/" => depth 2 => "../../"
	const depth = navPath.split('/').filter(Boolean).length;
	return depth === 0 ? './' : `./${'../'.repeat(depth)}`;
}

export function phpArrayString(obj: any): string {
	if (obj === null || obj === undefined) return 'null';
	if (typeof obj === 'boolean') return obj ? 'true' : 'false';
	if (typeof obj === 'number') return String(obj);
	if (typeof obj === 'string') return `'${obj.replace(/'/g, "\\'")}'`;
	if (Array.isArray(obj)) {
		const items = obj.map(item => phpArrayString(item)).join(', ');
		return `[${items}]`;
	}
	if (typeof obj === 'object') {
		const entries = Object.entries(obj).map(([key, value]) => {
			const phpKey = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(key) ? `'${key}'` : `'${key}'`;
			return `${phpKey} => ${phpArrayString(value)}`;
		}).join(', ');
		return `[${entries}]`;
	}
	return 'null';
}
