import type { Builder, Route } from '../types.js';
export declare function findRouteForNavPath(builder: Builder, navPath: string): Route | null;
export declare function compilePhpRouteMatcher(routeId: string): {
    phpRegex: string;
    phpMap: string;
};
export declare function buildLayoutChainCandidates(routeIdPosix: string): string[];
export interface RouteManifestEntry {
    re: string;
    type: 'page' | 'negotiate' | 'endpoint';
    shim?: string;
    page?: string;
    endpoint?: string;
    trailingSlash?: 'never' | 'always' | 'ignore';
}
export declare function generateRouteManifest(builder: Builder): Promise<RouteManifestEntry[]>;
/**
 * Read trailingSlash configuration from route files
 */
export declare function readTrailingSlashFromRoute(routeId: string, routesBasePath: string): Promise<'never' | 'always' | 'ignore' | undefined>;
