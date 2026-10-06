import type { Builder } from '../types.js';

/** Keep the internal Kit 2 config shape without mutating Kit's builder. */
export function normalizeBuilder(input: unknown): Builder {
	const builder = input as Builder;
	const config = builder.config as unknown as Builder['config'] & Builder['config']['kit'];
	if (config.kit) return builder;
	const normalized = Object.create(builder) as Builder;
	Object.defineProperty(normalized, 'config', { value: { kit: config } });
	return normalized;
}
