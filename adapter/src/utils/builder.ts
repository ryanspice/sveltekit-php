import type { Builder } from '../types.js';

/** Keep the internal Kit 2 config shape without mutating Kit's builder. */
export function normalizeBuilder(input: unknown): Builder {
	const builder = input as Builder;
	const config = builder.config as unknown as Builder['config'] & Builder['config']['kit'];
	// Kit 3 retains a deprecated compatibility getter; do not invoke it while detecting Kit 2.
	const legacyKit = Object.getOwnPropertyDescriptor(config, 'kit');
	if (legacyKit && 'value' in legacyKit && legacyKit.value) return builder;
	const normalized = Object.create(builder) as Builder;
	Object.defineProperty(normalized, 'config', { value: { kit: config } });
	return normalized;
}
