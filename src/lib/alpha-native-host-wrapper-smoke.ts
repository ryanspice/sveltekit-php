import type { AlphaReadinessReport } from './alpha-readiness';
import { buildAlphaNativeHostContract } from './alpha-native-host-contract';
import {
	buildNativeHostWrapperProbe,
	getDesktopShellUiCommandMapping,
	toDesktopShellUiTaskbarProgressState
} from './native-shell/native-host-event-bridge';

const expectedActions = [
	'set-window-effect',
	'start-dragging',
	'toggle-maximize',
	'set-progress',
	'clear-progress',
	'report-ready'
] as const;

export function buildAlphaNativeHostWrapperSmoke(report: AlphaReadinessReport) {
	const contract = buildAlphaNativeHostContract(report);
	const probeSteps = buildNativeHostWrapperProbe();
	const probeActions = new Set(probeSteps.map((step) => step.action));
	const missingActions = expectedActions.filter((action) => !probeActions.has(action));
	const missingMappings = probeSteps
		.filter((step) => !getDesktopShellUiCommandMapping(step.action))
		.map((step) => step.action);
	const missingRequiredHostPermissions = probeSteps
		.filter((step) => !step.requiredHostPermission)
		.map((step) => step.action);
	const progressExpectations = probeSteps
		.filter((step) => step.detail.progressStatus)
		.map((step) => ({
			action: step.action,
			progressStatus: step.detail.progressStatus,
			progress: step.detail.progress ?? null,
			expectedTaskbarState: toDesktopShellUiTaskbarProgressState(step.detail)
		}));
	const eventReplayContract = {
		marker: 'native-host-wrapper-event-replay',
		eventName: 'native-window-action',
		controllerGlobal: 'window.__SVELTEKIT_PHP_NATIVE_HOST__',
		historyGlobal: 'window.__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__',
		expectedMode: 'native-host',
		expectedHandled: true,
		noFallbackAllowedForRealHost: true,
		requiredResultFields: [
			'action',
			'handled',
			'mode',
			'reason',
			'source',
			'timestamp',
			'desktopShellUiHelper',
			'desktopShellUiSource',
			'desktopShellUiEvidence',
			'requiredHostPermission'
		],
		proofUse:
			'Defines the exact native-window-action replay that a real Windows/macOS wrapper must satisfy before replacing realHostVerified:false with OS-native proof.'
	};
	const eventReplayTranscript = probeSteps.map((step, index) => ({
		order: index + 1,
		marker: 'native-host-wrapper-event-replay-step',
		eventName: eventReplayContract.eventName,
		action: step.action,
		dispatchDetail: step.detail,
		expectedHandler: step.expectedHandler,
		expectedDesktopShellUiHelper: step.desktopShellUiHelper,
		expectedUpstreamCall: step.upstreamCall,
		requiredHostPermission: step.requiredHostPermission,
		expectedHistoryResult: {
			action: step.action,
			handled: eventReplayContract.expectedHandled,
			mode: eventReplayContract.expectedMode,
			source: step.detail.source ?? 'native-host-wrapper-probe',
			desktopShellUiHelper: step.desktopShellUiHelper,
			desktopShellUiSource: '@scriptgpt/desktop-shell-ui packages/desktop-shell-ui/src/index.ts',
			desktopShellUiEvidence: step.evidence,
			requiredHostPermission: step.requiredHostPermission
		},
		expectedTaskbarState: step.expectedTaskbarState ?? null,
		proves:
			'A real wrapper can replay this CustomEvent detail, invoke the mapped handler/helper, and record handled native-host history without changing the PHP adapter runtime.'
	}));
	const failedProgressExpectations = progressExpectations.filter((expectation) => {
		const matchingStep = probeSteps.find(
			(step) =>
				step.action === expectation.action &&
				step.detail.progressStatus === expectation.progressStatus &&
				step.detail.progress === expectation.progress
		);

		if (!matchingStep?.expectedTaskbarState) {
			return true;
		}

		return (
			matchingStep.expectedTaskbarState.saveInFlight !== expectation.expectedTaskbarState.saveInFlight ||
			matchingStep.expectedTaskbarState.refreshInFlight !==
				expectation.expectedTaskbarState.refreshInFlight ||
			matchingStep.expectedTaskbarState.hasQueuedSave !==
				expectation.expectedTaskbarState.hasQueuedSave
		);
	});
	const status =
		missingActions.length === 0 &&
		missingMappings.length === 0 &&
		missingRequiredHostPermissions.length === 0 &&
		failedProgressExpectations.length === 0
			? 'contract-ready'
			: 'contract-needs-work';

	return {
		target: report.target,
		issued: report.issued,
		marker: 'native-host-wrapper-smoke',
		command: 'bun run alpha:native:smoke',
		status,
		realHostVerified: false,
		trustLevel: 'deterministic-host-wrapper-handoff',
		source: 'src/lib/native-shell/native-host-event-bridge.ts',
		provenanceMarkers: [
			'buildNativeHostWrapperProbe',
			'getDesktopShellUiCommandMapping',
			'toDesktopShellUiTaskbarProgressState'
		],
		contractEndpoint: '/alpha-readiness/native-host-contract.json',
		runtimeEndpoint: '/alpha-readiness/native-host-wrapper-smoke.json',
		artifact: 'report/alpha-native-host-wrapper-smoke.json',
		noNativeApiBoundary: {
			tauriImportsAllowed: false,
			nativeWindowCallsAllowed: false,
			reason:
				'This smoke contract validates wrapper handoff data only. Real Windows Mica, macOS titlebar, taskbar progress, and report reveal behavior remain host-owned.'
		},
		summary: {
			requiredActions: expectedActions,
			probeStepCount: probeSteps.length,
			missingActions,
			missingMappings,
			missingRequiredHostPermissions,
			failedProgressExpectations,
			requiredHelpers: contract.nativeHostWrapperProbe.requiredHelpers,
			requiredHostPermissionCount: probeSteps.filter((step) => step.requiredHostPermission).length,
			progressExpectationCount: progressExpectations.length,
			eventReplayExpectationCount: eventReplayTranscript.length
		},
		hostPermissionContract: {
			marker: 'lg-ultragear-host-permission-checklist',
			trustLevel: 'real-host-permission-cue-required',
			sourceCapability: 'B:/Dev/GPTLIGHTINGSTRENGTHTEST/lg-ultragear-bridge/src-tauri/capabilities/default.json',
			requiredCapabilityMarkers: [
				'src-tauri/capabilities/default.json',
				'core:window:allow-set-effects',
				'core:window:allow-set-progress-bar',
				'core:window:allow-start-dragging',
				'core:window:allow-is-maximized',
				'core:window:allow-maximize',
				'core:window:allow-unmaximize',
				'core:window:allow-toggle-maximize'
			],
			actionPermissions: probeSteps.map((step) => ({
				action: step.action,
				expectedHandler: step.expectedHandler,
				desktopShellUiHelper: step.desktopShellUiHelper,
				requiredHostPermission: step.requiredHostPermission
			})),
			proves:
				'Each deterministic wrapper-smoke action names the host permission or wrapper-owned handler that a real Windows/macOS shell must prove before realHostVerified can be true.'
		},
		progressExpectations,
		eventReplayContract,
		eventReplayTranscript,
		probeSteps,
		wrapperSmokeInstructions: [
			'Register window.__SVELTEKIT_PHP_NATIVE_HOST__ with the handlers listed in native-host-contract.json.',
			'Dispatch each probeSteps[].detail value as a native-window-action CustomEvent.',
			'Replay every eventReplayTranscript[] entry and assert expectedHistoryResult.handled=true with mode=native-host.',
			'Assert expectedHistoryResult.requiredHostPermission is covered by the wrapper capability manifest or documented wrapper-owned handler.',
			'Assert native-host history records handled=true for each action in a real wrapper.',
			'Assert set-progress and clear-progress map to the expected TaskbarProgressState values before calling syncTaskbarProgress.',
			'Keep @tauri-apps/api and @scriptgpt/desktop-shell-ui imports in the optional wrapper only, never in the PHP adapter runtime.'
		],
		stableBlocker:
			'This deterministic smoke contract is alpha handoff evidence. Stable 1.0.0 still requires a real Windows/macOS wrapper smoke run plus hosted PHP smoke.'
	};
}
