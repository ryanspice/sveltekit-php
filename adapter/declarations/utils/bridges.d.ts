import type { Route } from '../types.js';
/** Fail closed: only option-only modules are understood; never execute consumer source. */
export declare function canOmitPageBridges(route: Route | null, routesRoot: string): Promise<boolean>;
/** Guard the document itself so direct index.php and web-server rewrites agree. */
export declare function getBridgeFreePageGuard(): string;
