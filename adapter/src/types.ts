export interface AdapterOptions {
	mode?: AdapterMode;
	ssr?: boolean;
	out?: string;
	assets?: string;
	precompress?: boolean;
	fallback?: boolean;
	strict?: boolean;
	basePath?: string;
	baseMode?: 'fixed' | 'auto';
}

export type AdapterMode = 'php-static' | 'js-ssr';

export interface Route {
	id: string;
	pattern: RegExp;
	prerender: boolean | 'auto';
	trailingSlash?: 'never' | 'always' | 'ignore';
}

export interface PrerenderedPage {
	file: string;
}

export interface Builder {
	log: {
		minor(msg: string): void;
		warn(msg: string): void;
		error(msg: string): void;
	};
	rimraf(dir: string): void;
	mkdirp(dir: string): void;
	getBuildDirectory(name: string): string;
	writeClient(dest: string): string[]; // returns file paths
	writePrerendered(dest: string): void;
	copy(src: string, dest: string): void;
	compress(dest: string): void;
	generateFallback(fallbackSrc: string): Promise<void> | void;
	writeServer(dest: string): void;
	generateManifest(options?: { relativePath: string }): string;

	config: {
		kit: {
			files: {
				routes: string;
			};
			paths: {
				base: string;
				assets?: string;
			};
			trailingSlash?: 'never' | 'always' | 'ignore';
		};
	};

	routes: Route[];
	prerendered: {
		pages: Map<string, PrerenderedPage>; // navPath -> { file }
	};
}
