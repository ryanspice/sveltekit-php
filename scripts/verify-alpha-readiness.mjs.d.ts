export type AlphaReadinessCheck = {
	id: string;
	ok: boolean;
	message: string;
};

export function checkAlphaReadinessContract(input: AlphaReadinessInput): AlphaReadinessCheck[];

export function summarizeChecks(checks: AlphaReadinessCheck[]): {
	ok: boolean;
	passed: number;
	failed: number;
	failures: AlphaReadinessCheck[];
};

export type FullReadinessReport = import('../src/lib/alpha-readiness').AlphaReadinessReport & {
	collectedCommunityAnalytics:
		| import('./collect-alpha-community-analytics.mjs.d.ts').CommunityAnalyticsArtifact
		| null;
	hostedAlphaSmoke: unknown;
	hostedAlphaSmokeProof: ReturnType<
		typeof import('../src/lib/alpha-release-manifest').buildReleaseManifest
	>['hostedProofInterpretation'];
	hostedAlphaSmokeArtifact?: ReturnType<
		typeof import('../src/lib/alpha-release-manifest').buildReleaseManifest
	>['artifacts'][number];
};

/** Expected artifact shapes; runtime contract checks still adjudicate their actual content. */
export type GeneratedReadinessArtifacts = ValidationCandidate<{
	adapterSource?: string;
	alphaPage?: string;
	analytics?: import('./collect-alpha-community-analytics.mjs.d.ts').CommunityAnalyticsArtifact;
	bridgeReuse?: ReturnType<
		typeof import('../src/lib/alpha-bridge-reuse').buildBridgeReuseInventory
	>;
	communityAnalyticsMarkdown?: string;
	communityResearchPack?: ReturnType<
		typeof import('../src/lib/alpha-community-research-pack').buildCommunityResearchPack
	>;
	communitySignalsCsv?: string;
	communitySourcesCsv?: string;
	evidenceIndex?: ReturnType<
		typeof import('../src/lib/alpha-evidence-index').buildAlphaEvidenceIndex
	>;
	fullReport?: FullReadinessReport;
	gateMatrix?: ReturnType<typeof import('../src/lib/alpha-gate-matrix').buildAlphaGateMatrix>;
	hostedSmokeChecklist?: ReturnType<
		typeof import('../src/lib/alpha-hosted-smoke-checklist').buildHostedSmokeChecklist
	>;
	html?: string;
	latestSameMajorSmoke?: string;
	latestSvelteKitAudit?: string;
	latestSvelteKitAuditVerifier?: string;
	latestViteMajorSmoke?: string;
	manifest?: ReadinessManifest;
	markdown?: string;
	nativeHostBridgeSource?: string;
	nativeHostBridgeStatusSource?: string;
	nativeHostContract?: ReturnType<
		typeof import('../src/lib/alpha-native-host-contract').buildAlphaNativeHostContract
	>;
	nativeHostGuide?: string;
	nativeHostWrapperSmoke?: ReturnType<
		typeof import('../src/lib/alpha-native-host-wrapper-smoke').buildAlphaNativeHostWrapperSmoke
	>;
	nativeTitlebarSource?: string;
	nativeWindowShellSource?: string;
	noHydrationConfigSource?: string;
	noHydrationPageSource?: string;
	packageContract?: ReadinessPackageContract;
	readinessCsv?: string;
	releaseChecklist?: string;
	releaseChecklistEndpointSource?: string;
	releaseChecklistSource?: string;
	releaseNotes?: string;
	remoteFunctionsPolicy?: string;
	remoteFunctionsVerifier?: string;
	reviewIndex?: string;
	sourceMapSvg?: string;
	svg?: string;
}>;

export type AlphaReadinessInput = {
	report: import('../src/lib/alpha-readiness').AlphaReadinessReport;
	packageJson: Omit<
		ValidationCandidate<typeof import('../package.json')>,
		'exports' | 'scripts'
	> & { exports?: Record<string, unknown>; scripts?: Record<string, string> };
	gitignore: string;
	generated: GeneratedReadinessArtifacts;
};

/** Candidates may intentionally omit fields or contain nonconforming string values. */
export type ValidationCandidate<T> = T extends string
	? string
	: T extends number
		? number
		: T extends boolean
			? boolean
			: T extends readonly unknown[]
				? readonly ValidationCandidate<T[number]>[]
				: T extends object
					? { [K in keyof T]?: ValidationCandidate<T[K]> }
					: T;

type BuiltManifest = ReturnType<
	typeof import('../src/lib/alpha-release-manifest').buildReleaseManifest
>;
type ReadinessManifest = Omit<BuiltManifest, 'artifacts'> & {
	artifacts: (BuiltManifest['artifacts'][number] & { hostedSmokeStatus?: string })[];
};
type BuiltPackageContract = ReturnType<
	typeof import('../src/lib/alpha-package-contract').buildAlphaPackageContract
>;
type ReadinessPackageContract = Omit<BuiltPackageContract, 'publishShape'> & {
	publishShape: Omit<BuiltPackageContract['publishShape'], 'exports'> & {
		exports: Record<string, unknown>;
	};
};
