export interface DebugPayload {
	app: Record<string, any>;
	message: Record<string, any>;
	navigation: Record<string, any>;
	timing: Record<string, any>;
	ids: Record<string, any>;
	runtime: Record<string, any>;
	cookies: Array<{ name: string; value?: string }>;
	flags: Record<string, any>;
	extras: Record<string, any>;
	display_hints: {
		hide_by_default: string[];
		primary_sections: string[];
		secondary_sections: string[];
	};
}

export interface TransformResult {
	structured: DebugPayload | null;
	keyPaths: string[];
	meta: {
		keyCount: number;
		estimatedSize: number; // bytes
		lastUpdated: string; // ISO
	};
}

const KNOWN_KEYS = new Set([
	'app_name',
	'app_version',
	'title',
	'description',
	'message',
	'redirected_from',
	'redirected_source',
	'server_time',
	'timestamp',
	'request_id',
	'layout_uuid',
	'page_uuid',
	'php_engine',
	'memory_usage',
	'cookies',
	'global_layout_loaded'
]);

export function transformDebugData(input: any): TransformResult {
	if (!input || typeof input !== 'object') {
		return {
			structured: null,
			keyPaths: [],
			meta: { keyCount: 0, estimatedSize: 0, lastUpdated: new Date().toISOString() }
		};
	}

	const groups: Omit<DebugPayload, 'display_hints'> = {
		app: {},
		message: {},
		navigation: {},
		timing: {},
		ids: {},
		runtime: {},
		cookies: [],
		flags: {},
		extras: {}
	};

	// Group A: app
	if (input.app_name !== undefined) groups.app.app_name = input.app_name;
	if (input.app_version !== undefined) groups.app.app_version = input.app_version;
	if (input.title !== undefined) groups.app.title = input.title;
	if (input.description !== undefined) groups.app.description = input.description;

	// Group B: message
	if (input.message) groups.message.message = input.message;

	// Group C: navigation
	if (input.redirected_from) groups.navigation.redirected_from = input.redirected_from;
	if (input.redirected_source) groups.navigation.redirected_source = input.redirected_source;

	// Group D: timing
	if (input.server_time) groups.timing.server_time = input.server_time;
	if (input.timestamp) groups.timing.timestamp = input.timestamp;

	// Derived timestamp_iso
	if (input.server_time) {
		groups.timing.timestamp_iso = input.server_time;
	} else if (input.timestamp) {
		// Assume timestamp is unix seconds
		try {
			groups.timing.timestamp_iso = new Date(Number(input.timestamp) * 1000)
				.toISOString()
				.replace('T', ' ')
				.split('.')[0];
		} catch {
			groups.timing.timestamp_iso = 'Invalid Date';
		}
	}

	// Group E: ids
	if (input.request_id) groups.ids.request_id = input.request_id;
	if (input.layout_uuid) groups.ids.layout_uuid = input.layout_uuid;
	if (input.page_uuid) groups.ids.page_uuid = input.page_uuid;

	// Group F: runtime
	if (input.php_engine) groups.runtime.php_engine = input.php_engine;

	// Derived memory
	if (input.memory_usage) {
		const bytes = parseInt(String(input.memory_usage), 10);
		if (!isNaN(bytes)) {
			groups.runtime.memory_usage_bytes = bytes;
			groups.runtime.memory_usage_kb = Math.round((bytes / 1024) * 10) / 10;
			groups.runtime.memory_usage_mb = Math.round((bytes / (1024 * 1024)) * 100) / 100;
		}
	}

	// Group G: cookies
	if (Array.isArray(input.cookies)) {
		groups.cookies = input.cookies.map((c: any) => {
			if (typeof c === 'string') return { name: c };
			return c && typeof c === 'object' ? c : { name: String(c) };
		});
	} else if (input.cookies && typeof input.cookies === 'object') {
		groups.cookies = Object.entries(input.cookies).map(([k, v]) => ({ name: k, value: String(v) }));
	}

	// Group H: flags
	if (input.global_layout_loaded !== undefined) {
		groups.flags.global_layout_loaded = input.global_layout_loaded;
	}

	// Catch other booleans & Extras
	for (const key in input) {
		if (!Object.prototype.hasOwnProperty.call(input, key)) continue;

		if (typeof input[key] === 'boolean' && key !== 'global_layout_loaded') {
			groups.flags[key] = input[key];
		} else if (!KNOWN_KEYS.has(key)) {
			groups.extras[key] = input[key];
		}
	}

	// Helper to clean object
	function clean(obj: Record<string, any>, allowKeys: string[] = []) {
		for (const key in obj) {
			if (obj[key] === null && !allowKeys.includes(key)) {
				delete obj[key];
			}
		}
	}

	clean(groups.app);
	clean(groups.message);

	const finalStruct: DebugPayload = {
		...groups,
		display_hints: {
			hide_by_default: ['ids', 'runtime'],
			primary_sections: ['app', 'message', 'navigation'],
			secondary_sections: ['timing', 'cookies', 'flags']
		}
	};

	// Flatten keys and count
	const paths: string[] = [];
	let keyCount = 0;

	function traverse(obj: any, path = '') {
		if (path === 'display_hints') return;

		if (obj && typeof obj === 'object') {
			if (Array.isArray(obj)) {
				// For arrays (like cookies), just count the array itself as one path or items?
				// Let's list the array path
				paths.push(path);
				keyCount++;
			} else {
				for (const key in obj) {
					const newPath = path ? `${path}.${key}` : key;
					if (typeof obj[key] === 'object' && obj[key] !== null) {
						traverse(obj[key], newPath);
					} else {
						paths.push(newPath);
						keyCount++;
					}
				}
			}
		}
	}

	traverse(finalStruct);

	// Rough size estimate
	const jsonString = JSON.stringify(finalStruct);
	const estimatedSize = jsonString ? new TextEncoder().encode(jsonString).length : 0;

	return {
		structured: finalStruct,
		keyPaths: paths.sort(), // Stable order
		meta: {
			keyCount,
			estimatedSize,
			lastUpdated: new Date().toISOString()
		}
	};
}
