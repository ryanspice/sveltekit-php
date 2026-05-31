export interface TrailingSlashOptions {
	basePath: string;
	trailingSlash: 'always' | 'never' | 'ignore';
}

export function htaccessTrailingSlashBlock(options: TrailingSlashOptions): string {
	const { basePath, trailingSlash } = options;

	if (trailingSlash === 'ignore') {
		return '# trailingSlash: ignore';
	}

	if (trailingSlash === 'always') {
		return `
	# trailingSlash: always
	RewriteCond %{REQUEST_FILENAME} !-f
	RewriteCond %{REQUEST_URI} !/__data\\.json$ [NC]
	RewriteCond %{REQUEST_URI} !/__action$ [NC]
	RewriteCond %{REQUEST_URI} !/_app/ [NC]
	RewriteCond %{REQUEST_URI} !/$
	RewriteRule ^(.*[^/])$ ${basePath}$1/ [L,R=308]
`.trim();
	}

	if (trailingSlash === 'never') {
		return `
	# trailingSlash: never
	# We don't check !-d because Apache DirectorySlash On handles directories,
	# but SvelteKit wants 'never'.
	# Use THE_REQUEST to avoid loops with DirectorySlash On.
	# It ensures we only redirect if the client actually requested the slash.
	RewriteCond %{THE_REQUEST} \\s([^?]*)/+(\\s|\\?)
	RewriteCond %{REQUEST_URI} !/__data\\.json$ [NC]
	RewriteCond %{REQUEST_URI} !/__action$ [NC]
	RewriteCond %{REQUEST_URI} !/_app/ [NC]
	RewriteRule ^(.*)/$ ${basePath}$1 [L,R=308]
`.trim();
	}

	return '';
}
