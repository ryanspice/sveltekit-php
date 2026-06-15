export type AlphaReadinessCheck = {
	id: string;
	ok: boolean;
	message: string;
};

export function checkAlphaReadinessContract(input: {
	report: Record<string, any>;
	packageJson?: Record<string, any>;
	gitignore?: string;
	generated?: {
		analytics?: Record<string, any>;
		fullReport?: Record<string, any>;
		html?: string;
		markdown?: string;
	};
}): AlphaReadinessCheck[];

export function summarizeChecks(checks: AlphaReadinessCheck[]): {
	ok: boolean;
	passed: number;
	failed: number;
	failures: AlphaReadinessCheck[];
};
