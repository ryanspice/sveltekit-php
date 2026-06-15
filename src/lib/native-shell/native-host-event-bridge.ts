export type NativeWindowAction =
	| 'start-dragging'
	| 'toggle-maximize'
	| 'set-window-effect'
	| 'set-progress'
	| 'clear-progress'
	| 'report-ready';

export type NativeHostCommandAction = NativeWindowAction | 'unsupported-action';

export type NativeWindowEffect = 'mica' | 'acrylic' | 'none';
export type NativeProgressStatus = 'indeterminate' | 'normal' | 'none';
export type NativeReportKind = 'json' | 'html' | 'markdown' | 'svg' | 'csv' | 'bundle';
export type DesktopShellUiHelperName =
	| 'enableMicaWindowChrome'
	| 'syncTaskbarProgress'
	| 'toggleWindowMaximize'
	| 'win.startDragging'
	| 'host.reportReady';

export type DesktopShellUiTaskbarProgressState = {
	saveInFlight: boolean;
	refreshInFlight: boolean;
	hasQueuedSave: boolean;
};

export type NativeWindowActionDetail = {
	action: NativeWindowAction;
	source?: string;
	dragStartThresholdPx?: number;
	windowEffect?: NativeWindowEffect;
	progress?: number;
	progressStatus?: NativeProgressStatus;
	reportHref?: string;
	reportKind?: NativeReportKind;
	reportLabel?: string;
};

export type NativeHostCommandResult = {
	action: NativeHostCommandAction;
	handled: boolean;
	mode: 'native-host' | 'browser-fallback' | 'unsupported';
	reason: string;
	source: string;
	timestamp: string;
	desktopShellUiHelper?: DesktopShellUiHelperName;
	desktopShellUiSource?: string;
	desktopShellUiEvidence?: string;
};

export type DesktopShellUiCommandMapping = {
	action: NativeWindowAction;
	handler: keyof NativeHostWindowController;
	helper: DesktopShellUiHelperName;
	upstreamCall: string;
	evidence: string;
	detailFields: Array<keyof NativeWindowActionDetail>;
};

export type NativeHostWindowController = {
	startDragging?: (detail: NativeWindowActionDetail) => void | Promise<void>;
	toggleMaximize?: (detail: NativeWindowActionDetail) => void | Promise<void>;
	setWindowEffect?: (detail: NativeWindowActionDetail) => void | Promise<void>;
	setProgress?: (detail: NativeWindowActionDetail) => void | Promise<void>;
	clearProgress?: (detail: NativeWindowActionDetail) => void | Promise<void>;
	reportReady?: (detail: NativeWindowActionDetail) => void | Promise<void>;
};

export type NativeHostEventBridge = {
	dispose: () => void;
	getHistory: () => NativeHostCommandResult[];
	isNativeHostAvailable: () => boolean;
};

export type NativeHostEventBridgeOptions = {
	eventTarget?: EventTarget;
	controller?: NativeHostWindowController;
	historyLimit?: number;
	onResult?: (result: NativeHostCommandResult) => void;
};

export const desktopShellUiBinding = {
	marker: 'desktopShellUiBinding',
	packageName: '@scriptgpt/desktop-shell-ui',
	sourcePackage: 'packages/desktop-shell-ui/src/index.ts',
	upstreamWidgetSource: 'packages/ultragear-widget-ui/src/app.ts',
	requiredImports: [
		'enableMicaWindowChrome',
		'syncTaskbarProgress',
		'toggleWindowMaximize',
		'TaskbarProgressState'
	],
	controllerGlobal: 'window.__SVELTEKIT_PHP_NATIVE_HOST__',
	installer: 'installSvelteKitPhpNativeHost',
	handlers: [
		{
			action: 'start-dragging',
			handler: 'startDragging',
			helper: 'win.startDragging',
			upstreamCall: 'win.startDragging()',
			evidence: 'ultragear-widget-ui app.ts routes start-dragging to win.startDragging()',
			detailFields: ['dragStartThresholdPx', 'source']
		},
		{
			action: 'toggle-maximize',
			handler: 'toggleMaximize',
			helper: 'toggleWindowMaximize',
			upstreamCall: 'toggleWindowMaximize(win)',
			evidence: 'desktop-shell-ui exports toggleWindowMaximize and widget app uses it for maximize',
			detailFields: ['source']
		},
		{
			action: 'set-window-effect',
			handler: 'setWindowEffect',
			helper: 'enableMicaWindowChrome',
			upstreamCall: 'enableMicaWindowChrome(win)',
			evidence: 'desktop-shell-ui enableMicaWindowChrome calls win.setEffects({ effects: [Effect.Mica] })',
			detailFields: ['windowEffect', 'source']
		},
		{
			action: 'set-progress',
			handler: 'setProgress',
			helper: 'syncTaskbarProgress',
			upstreamCall: 'syncTaskbarProgress(win, toDesktopShellUiTaskbarProgressState(detail))',
			evidence:
				'desktop-shell-ui syncTaskbarProgress receives TaskbarProgressState { saveInFlight, refreshInFlight, hasQueuedSave } and maps it to ProgressBarStatus',
			detailFields: ['progress', 'progressStatus', 'source']
		},
		{
			action: 'clear-progress',
			handler: 'clearProgress',
			helper: 'syncTaskbarProgress',
			upstreamCall:
				'syncTaskbarProgress(win, { saveInFlight: false, refreshInFlight: false, hasQueuedSave: false })',
			evidence:
				'desktop-shell-ui syncTaskbarProgress clears taskbar state when TaskbarProgressState has no in-flight or queued work, mapping to ProgressBarStatus.None',
			detailFields: ['progressStatus', 'source']
		},
		{
			action: 'report-ready',
			handler: 'reportReady',
			helper: 'host.reportReady',
			upstreamCall: 'host.reportReady({ reportHref, reportKind, reportLabel })',
			evidence: 'SvelteKit PHP host-owned report handoff keeps generated alpha evidence links native-safe',
			detailFields: ['reportHref', 'reportKind', 'reportLabel', 'source']
		}
	] satisfies DesktopShellUiCommandMapping[]
};

export const toDesktopShellUiTaskbarProgressState = (
	detail: Pick<NativeWindowActionDetail, 'progressStatus'>
): DesktopShellUiTaskbarProgressState => ({
	saveInFlight: detail.progressStatus === 'indeterminate',
	refreshInFlight: false,
	hasQueuedSave: detail.progressStatus === 'normal'
});

declare global {
	interface Window {
		__SVELTEKIT_PHP_NATIVE_HOST__?: NativeHostWindowController;
		__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__?: NativeHostCommandResult[];
	}
}

const EVENT_NAME = 'native-window-action';
const DEFAULT_HISTORY_LIMIT = 20;
const SUPPORTED_ACTIONS = new Set<NativeWindowAction>([
	'start-dragging',
	'toggle-maximize',
	'set-window-effect',
	'set-progress',
	'clear-progress',
	'report-ready'
]);
const SUPPORTED_WINDOW_EFFECTS = new Set<NativeWindowEffect>(['mica', 'acrylic', 'none']);
const SUPPORTED_PROGRESS_STATUSES = new Set<NativeProgressStatus>([
	'indeterminate',
	'normal',
	'none'
]);
const SUPPORTED_REPORT_KINDS = new Set<NativeReportKind>([
	'json',
	'html',
	'markdown',
	'svg',
	'csv',
	'bundle'
]);

const fallbackReasons: Record<NativeWindowAction, string> = {
	'start-dragging': 'No native host drag handler is registered; browser shell remains static',
	'toggle-maximize': 'No native host maximize handler is registered; browser shell keeps current bounds',
	'set-window-effect':
		'No native host window-effect handler is registered; browser shell keeps CSS Mica fallback',
	'set-progress':
		'No native host progress handler is registered; browser shell keeps report progress in-page',
	'clear-progress':
		'No native host progress-clear handler is registered; browser shell clears only in-page state',
	'report-ready':
		'No native host report-ready handler is registered; browser shell keeps report links in-page'
};

const getBrowserWindow = () => {
	if (typeof window === 'undefined') {
		return undefined;
	}

	return window;
};

const getDefaultEventTarget = () => {
	if (typeof document === 'undefined') {
		return undefined;
	}

	return document;
};

const isNativeWindowAction = (value: unknown): value is NativeWindowAction =>
	typeof value === 'string' && SUPPORTED_ACTIONS.has(value as NativeWindowAction);

const normalizeString = (value: unknown): string | undefined =>
	typeof value === 'string' && value.trim() ? value : undefined;

const normalizeFiniteNumber = (value: unknown): number | undefined =>
	typeof value === 'number' && Number.isFinite(value) ? value : undefined;

const normalizeProgress = (value: unknown): number | undefined => {
	const progress = normalizeFiniteNumber(value);

	if (progress === undefined) {
		return undefined;
	}

	return Math.max(0, Math.min(100, progress));
};

const normalizeWindowEffect = (value: unknown): NativeWindowEffect | undefined =>
	typeof value === 'string' && SUPPORTED_WINDOW_EFFECTS.has(value as NativeWindowEffect)
		? (value as NativeWindowEffect)
		: undefined;

const normalizeProgressStatus = (value: unknown): NativeProgressStatus | undefined =>
	typeof value === 'string' && SUPPORTED_PROGRESS_STATUSES.has(value as NativeProgressStatus)
		? (value as NativeProgressStatus)
		: undefined;

const normalizeReportKind = (value: unknown): NativeReportKind | undefined =>
	typeof value === 'string' && SUPPORTED_REPORT_KINDS.has(value as NativeReportKind)
		? (value as NativeReportKind)
		: undefined;

const normalizeNativeActionDetail = (detail: unknown): NativeWindowActionDetail | undefined => {
	if (!detail || typeof detail !== 'object') {
		return undefined;
	}

	const candidate = detail as Partial<NativeWindowActionDetail>;

	if (!isNativeWindowAction(candidate.action)) {
		return undefined;
	}

	return {
		action: candidate.action,
		source: normalizeString(candidate.source) ?? 'unknown',
		dragStartThresholdPx: normalizeFiniteNumber(candidate.dragStartThresholdPx),
		windowEffect: normalizeWindowEffect(candidate.windowEffect),
		progress: normalizeProgress(candidate.progress),
		progressStatus: normalizeProgressStatus(candidate.progressStatus),
		reportHref: normalizeString(candidate.reportHref),
		reportKind: normalizeReportKind(candidate.reportKind),
		reportLabel: normalizeString(candidate.reportLabel)
	};
};

const resolveNativeHostHandler = (
	controller: NativeHostWindowController | undefined,
	action: NativeWindowAction
) => {
	switch (action) {
		case 'start-dragging':
			return controller?.startDragging;
		case 'toggle-maximize':
			return controller?.toggleMaximize;
		case 'set-window-effect':
			return controller?.setWindowEffect;
		case 'set-progress':
			return controller?.setProgress;
		case 'clear-progress':
			return controller?.clearProgress;
		case 'report-ready':
			return controller?.reportReady;
	}
};

export const getDesktopShellUiCommandMapping = (
	action: NativeWindowAction
): DesktopShellUiCommandMapping | undefined =>
	desktopShellUiBinding.handlers.find((mapping) => mapping.action === action);

const getDesktopShellUiResultFields = (action: NativeWindowAction) => {
	const mapping = getDesktopShellUiCommandMapping(action);

	if (!mapping) {
		return {};
	}

	return {
		desktopShellUiHelper: mapping.helper,
		desktopShellUiSource: desktopShellUiBinding.sourcePackage,
		desktopShellUiEvidence: mapping.evidence
	};
};

const pushHistory = (
	windowRef: Window | undefined,
	history: NativeHostCommandResult[],
	result: NativeHostCommandResult,
	historyLimit: number
) => {
	history.push(result);

	if (history.length > historyLimit) {
		history.splice(0, history.length - historyLimit);
	}

	if (windowRef) {
		windowRef.__SVELTEKIT_PHP_NATIVE_HOST_HISTORY__ = [...history];
	}
};

export const getNativeHostWindowController = (): NativeHostWindowController | undefined =>
	getBrowserWindow()?.__SVELTEKIT_PHP_NATIVE_HOST__;

export const installNativeHostEventBridge = (
	options: NativeHostEventBridgeOptions = {}
): NativeHostEventBridge => {
	const windowRef = getBrowserWindow();
	const eventTarget = options.eventTarget ?? getDefaultEventTarget();
	const historyLimit = options.historyLimit ?? DEFAULT_HISTORY_LIMIT;
	const history: NativeHostCommandResult[] = [];

	const resolveController = () => options.controller ?? windowRef?.__SVELTEKIT_PHP_NATIVE_HOST__;

	const emitResult = (result: NativeHostCommandResult) => {
		pushHistory(windowRef, history, result, historyLimit);
		options.onResult?.(result);
	};

	const handleNativeWindowAction = (event: Event) => {
		const detail = normalizeNativeActionDetail((event as CustomEvent<unknown>).detail);

		if (!detail) {
			emitResult({
				action: 'unsupported-action',
				handled: false,
				mode: 'unsupported',
				reason: 'native-window-action event did not include a supported action detail',
				source: 'unknown',
				timestamp: new Date().toISOString()
			});
			return;
		}

		const controller = resolveController();
		const handler = resolveNativeHostHandler(controller, detail.action);

		if (!handler) {
			emitResult({
				action: detail.action,
				handled: false,
				mode: 'browser-fallback',
				reason: fallbackReasons[detail.action],
				source: detail.source ?? 'unknown',
				timestamp: new Date().toISOString(),
				...getDesktopShellUiResultFields(detail.action)
			});
			return;
		}

		try {
			void Promise.resolve(handler(detail))
				.then(() => {
					emitResult({
						action: detail.action,
						handled: true,
						mode: 'native-host',
						reason: 'Native host window controller accepted the command',
						source: detail.source ?? 'unknown',
						timestamp: new Date().toISOString(),
						...getDesktopShellUiResultFields(detail.action)
					});
				})
				.catch((error: unknown) => {
					emitResult({
						action: detail.action,
						handled: false,
						mode: 'unsupported',
						reason: error instanceof Error ? error.message : 'Native host window controller failed',
						source: detail.source ?? 'unknown',
						timestamp: new Date().toISOString(),
						...getDesktopShellUiResultFields(detail.action)
					});
				});
		} catch (error) {
			emitResult({
				action: detail.action,
				handled: false,
				mode: 'unsupported',
				reason: error instanceof Error ? error.message : 'Native host window controller failed',
				source: detail.source ?? 'unknown',
				timestamp: new Date().toISOString(),
				...getDesktopShellUiResultFields(detail.action)
			});
		}
	};

	eventTarget?.addEventListener(EVENT_NAME, handleNativeWindowAction);

	return {
		dispose: () => eventTarget?.removeEventListener(EVENT_NAME, handleNativeWindowAction),
		getHistory: () => [...history],
		isNativeHostAvailable: () => Boolean(resolveController())
	};
};

export {};
