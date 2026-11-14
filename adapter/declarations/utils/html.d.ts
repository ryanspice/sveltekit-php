export declare function detectInlineDataModeFromHtml(html: string): 'nodes' | 'payload' | 'unknown';
/** Replace only the literal supplied to Kit's hydration options, never visible page text. */
export declare function replaceInlineConstData(html: string): string | null;
/** Share one selected range and mode when generating the PHP bridge and document. */
export declare function rewriteInlineData(html: string): {
    html: string;
    mode: 'nodes' | 'payload';
} | null;
