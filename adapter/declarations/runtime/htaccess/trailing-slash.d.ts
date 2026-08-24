export interface TrailingSlashOptions {
    basePath: string;
    trailingSlash: 'always' | 'never' | 'ignore';
}
export declare function htaccessTrailingSlashBlock(options: TrailingSlashOptions): string;
