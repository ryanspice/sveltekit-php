import type { AdapterOptions } from './types.js';
import type { Adapter } from '@sveltejs/kit';
export type { AdapterMode, AdapterOptions, BuildIdentityContract } from './types.js';
export default function sveltekitPhpAdapter(options?: AdapterOptions): Adapter;
