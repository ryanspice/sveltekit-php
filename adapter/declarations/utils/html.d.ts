export declare function detectInlineDataModeFromHtml(html: string): 'nodes' | 'payload' | 'unknown';
/**
 * Replaces the JSON array/object literal with a PHP echo statement.
 * Supports finding "const data = [...]" or "data: [...]" inside the HTML script tags.
 */
export declare function replaceInlineConstData(html: string): string | null;
