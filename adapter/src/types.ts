export interface AdapterOptions {
	/** Production runtime strategy. Defaults to `php-static`. */
	mode?: AdapterMode;
	/** @deprecated Runtime mode is selected with `mode`; retained for platform metadata compatibility. */
	ssr?: boolean;
	/** Generated route/runtime output directory. */
	out?: string;
	/** Client asset output directory, or an absolute asset URL. */
	assets?: string;
	/** Generate Brotli and gzip variants for emitted assets. */
	precompress?: boolean;
	/** Generate the default fallback, or a named relative fallback file. */
	fallback?: boolean | string;
	/** Fail instead of warning when safety or compatibility checks fail. */
	strict?: boolean;
	/** Fixed public base path such as `/sites/example.test`. */
	basePath?: string;
	/** Emit the configured base path, or defer base resolution to the host. */
	baseMode?: 'fixed' | 'auto';
	/** Optional markers used to reject a build from the wrong consumer repository. */
	buildIdentity?: BuildIdentityContract | false;
}

export type AdapterMode = 'php-static' | 'js-ssr';

export interface BuildIdentityContract {
	name?: string;
	required?: string[];
	forbidden?: string[];
	extensions?: string[];
}

/** @internal Reduced route shape used by adapter implementation helpers. */
export interface Route {
	id: string;
	pattern: RegExp;
	prerender: boolean | 'auto';
	trailingSlash?: 'never' | 'always' | 'ignore';
}

/** @internal Reduced builder shape used internally; the public factory returns SvelteKit's Adapter. */
export interface Builder {
	log: {
		minor(msg: string): void;
		warn(msg: string): void;
		error(msg: string): void;
	};
	rimraf(dir: string): void;
	mkdirp(dir: string): void;
	getBuildDirectory(name: string): string;
	writeClient(dest: string): string[];
	writePrerendered(dest: string): void;
	copy(src: string, dest: string): void;
	compress(dest: string): void;
	generateFallback(fallbackSrc: string): Promise<void> | void;
	writeServer(dest: string): void;
	generateManifest(options?: { relativePath: string }): string;
	generateServerInstance?: (dest: string, options?: { serverDirectory: string }) => void;
	hasServerInstrumentationFile?: () => boolean;
	createInstrumentationInitializer?: (options: { outputDirectory: string; serverDirectory: string }) => string;
	instrument?: (options: { entrypoint: string; instrumentation: string; start: string; initializer?: string; module: { exports: string[] } }) => void;
	config: {
		kit: {
			files: { routes: string };
			paths: { base: string; assets?: string };
			trailingSlash?: 'never' | 'always' | 'ignore';
		};
	};
	routes: Route[];
	prerendered: { pages: Map<string, { file: string }> };
}
