import type { AdapterOptions, Builder, BuildIdentityContract } from '../types.js';
export declare const DEFAULT_BUILD_IDENTITY_EXTENSIONS: string[];
export declare const RESERVED_ROUTE_SEGMENTS: Set<string>;
export declare const RESERVED_ROUTE_FILES: Set<string>;
export declare const REMOTE_FUNCTIONS_ALPHA_POLICY_MARKER = "remote-functions-alpha-policy";
export declare const REMOTE_FUNCTIONS_UNSUPPORTED_MESSAGE = "sveltekit-php: SvelteKit remote functions are not supported by the PHP runtime in 1.0.2-alpha. Remote functions generate server HTTP endpoints that are not yet mapped through the PHP router. Disable kit.experimental.remoteFunctions and remove .remote.* files, or use a Node/edge adapter until remote-functions-alpha-policy has fixture proof.";
export declare const REMOTE_FUNCTION_FILE_RE: RegExp;
export type ResolvedBuildIdentityContract = Required<Pick<BuildIdentityContract, 'required' | 'forbidden' | 'extensions'>> & Pick<BuildIdentityContract, 'name'>;
export declare function isInside(parent: string, child: string): boolean;
export declare function isInsideOrSame(parent: string, child: string): boolean;
export declare function collectRemoteFunctionFiles(root: string): Promise<string[]>;
export declare function assertRemoteFunctionsUnsupported(builder: Builder): Promise<void>;
export declare function normalizeMarkerList(value: unknown): string[];
export declare function normalizeSafeExternalRoots(value: string | undefined): string[];
export declare function resolveBuildIdentityContract(buildIdentity: AdapterOptions['buildIdentity']): ResolvedBuildIdentityContract | null;
export declare function verifyBuildIdentityContract(outDir: string, contract: ResolvedBuildIdentityContract, builder: Builder): Promise<void>;
export declare function normalizeRouteIdSegments(routeId: string): string[];
export declare function isRouteParamSegment(segment: string): boolean;
export declare function validateReservedRouteIds(routes: Builder['routes'], strict: boolean, builder: Builder): void;
/**
 * Guard against build cleanup targeting unsafe paths.
 *
 * The adapter rimrafs the output/temp dirs it owns. This guard rejects fs roots,
 * the repo, home, source trees, and (hardening, audit P1-7) common user/system
 * directories even when they are configured through SVELTEKIT_PHP_SAFE_EXTERNAL_ROOTS.
 */
export declare function assertSafeBuildTarget(target: string, label: string, routesRoot: string): void;
