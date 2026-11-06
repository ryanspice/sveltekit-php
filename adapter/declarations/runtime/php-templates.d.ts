/** Shared by generated action entrypoints and the PHP-to-JavaScript proxy. */
export declare function getPhpRequestSecurity(): string;
export declare function getDataPhp(includes: string[], base?: string, compatRel?: string, relToRoot?: string): string;
export declare function getActionPhp(includes: string[], routeId: string, pagePrefix: string | null, compatRel?: string): string;
export declare function getBootstrapPhp(routeId: string, loadFns: string, templateJson: string, inlineMode: string, requirePrefix?: string): string;
export declare function getFooterPhp(appId: string): string;
export declare function getMinimalBootstrapPhp(requirePrefix?: string): string;
export declare function getApiPhp(includes: string[], prefix: string, base: string, routeRegex: string, routeParamMapPhp: string, compatRel?: string, relToRoot?: string): string;
export declare function getRouterPhp(base: string, mode: 'php-static' | 'js-ssr', fallback?: string | boolean): string;
