import { existsSync, rmSync } from 'node:fs';
export declare function exists(p: string): Promise<boolean>;
export interface CleanBuildDirectoryOptions {
    strict: boolean;
    warn(message: string): void;
    remove?: typeof rmSync;
    pathExists?: typeof existsSync;
    wait?: (milliseconds: number) => Promise<void>;
}
export declare function cleanBuildDirectory(dir: string, { strict, warn, remove, pathExists, wait }: CleanBuildDirectoryOptions): Promise<void>;
