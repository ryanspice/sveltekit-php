export interface AdapterOptions {
    /** Production runtime strategy. Defaults to `php-static`. */
    mode?: AdapterMode;
    /** @deprecated Runtime mode is selected with `mode`; retained for platform metadata compatibility. */
    ssr?: boolean;
    /** Generated route/runtime output directory. */
    out?: string;
    /** Client asset output directory, or an absolute asset URL. */
    assets?: string;
    /** Generate Brotli and gzip variants for emitted assets. */
    precompress?: boolean;
    /** Generate the default fallback, or a named relative fallback file. */
    fallback?: boolean | string;
    /** Fail instead of warning when safety or compatibility checks fail. */
    strict?: boolean;
    /** Fixed public base path such as `/sites/example.test`. */
    basePath?: string;
    /** Emit the configured base path, or defer base resolution to the host. */
    baseMode?: 'fixed' | 'auto';
    /** Optional markers used to reject a build from the wrong consumer repository. */
    buildIdentity?: BuildIdentityContract | false;
}
export type AdapterMode = 'php-static' | 'js-ssr';
export interface BuildIdentityContract {
    name?: string;
    required?: string[];
    forbidden?: string[];
    extensions?: string[];
}
