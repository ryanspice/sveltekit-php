import type { AdapterMode, AdapterOptions } from '../types.js';
export declare function normalizeBasePathOption(value: string | undefined): string | undefined;
export declare function normalizeFallbackOption(value: AdapterOptions['fallback']): boolean | string;
export declare function resolveContainedOutputPath(root: string, relativePath: string, label: string): string;
export declare function normalizeAdapterOptions(options?: AdapterOptions): AdapterOptions & {
    mode: AdapterMode;
    baseMode: 'fixed' | 'auto';
    fallback: boolean | string;
};
