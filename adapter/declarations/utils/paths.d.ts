export declare const posixify: (p: string) => string;
export declare const stripLeadingSlash: (s: string) => string;
export declare function toPhpIdentifier(s: string): string;
export declare function fnPrefixForServerFile(serverRelPosix: string): string;
export declare function phpRelToRootFromNav(navPath: string): string;
export declare function phpArrayString(obj: unknown): string;
