export interface AdapterOptions {
	mode?: 'php-static' | 'node-ssr';
	ssr?: boolean;
	out?: string;
	assets?: string;
	precompress?: boolean;
	fallback?: boolean;
	strict?: boolean;
}

export interface Route {
	id: string;
	pattern: RegExp;
	prerender: boolean | 'auto';
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

	config: {
		kit: {
			files: {
				routes: string;
			};
		};
	};

	routes: Route[];
	prerendered: {
		pages: Map<string, PrerenderedPage>; // navPath -> { file }
	};
}
