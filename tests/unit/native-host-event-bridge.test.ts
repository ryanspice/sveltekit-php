import { describe, expect, it } from 'vitest';
import {
	desktopShellUiBinding,
	getDesktopShellUiCommandMapping,
	installNativeHostEventBridge,
	toDesktopShellUiTaskbarProgressState,
	type NativeHostCommandResult,
	type NativeWindowActionDetail
} from '../../src/lib/native-shell/native-host-event-bridge.ts';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

function dispatchNativeWindowAction(eventTarget: EventTarget, detail: unknown) {
	const event = new Event('native-window-action') as CustomEvent<unknown>;
	Object.defineProperty(event, 'detail', { value: detail });
	eventTarget.dispatchEvent(event);
}

describe('native host event bridge', () => {
	it('routes Mica, progress, clear-progress, and report-ready actions to optional host handlers', async () => {
		const eventTarget = new EventTarget();
		const handled: NativeWindowActionDetail[] = [];
		const results: NativeHostCommandResult[] = [];

		const bridge = installNativeHostEventBridge({
			eventTarget,
			onResult: (result) => {
				results.push(result);
			},
			controller: {
				setWindowEffect: (detail) => {
					handled.push(detail);
				},
				setProgress: (detail) => {
					handled.push(detail);
				},
				clearProgress: (detail) => {
					handled.push(detail);
				},
				reportReady: (detail) => {
					handled.push(detail);
				}
			}
		});

		dispatchNativeWindowAction(eventTarget, {
			action: 'set-window-effect',
			source: 'unit-test',
			windowEffect: 'mica'
		});
		dispatchNativeWindowAction(eventTarget, {
			action: 'set-progress',
			source: 'unit-test',
			progress: 128,
			progressStatus: 'normal'
		});
		dispatchNativeWindowAction(eventTarget, {
			action: 'clear-progress',
			source: 'unit-test',
			progressStatus: 'none'
		});
		dispatchNativeWindowAction(eventTarget, {
			action: 'report-ready',
			source: 'unit-test',
			reportHref: '/alpha-readiness/native-host-guide.md',
			reportKind: 'bundle',
			reportLabel: 'Alpha native evidence bundle'
		});

		await settle();

		expect(handled.map((detail) => detail.action)).toEqual([
			'set-window-effect',
			'set-progress',
			'clear-progress',
			'report-ready'
		]);
		expect(handled[0]).toMatchObject({ windowEffect: 'mica' });
		expect(handled[1]).toMatchObject({ progress: 100, progressStatus: 'normal' });
		expect(handled[2]).toMatchObject({ progressStatus: 'none' });
		expect(handled[3]).toMatchObject({
			reportHref: '/alpha-readiness/native-host-guide.md',
			reportKind: 'bundle',
			reportLabel: 'Alpha native evidence bundle'
		});
		expect(results).toHaveLength(4);
		expect(results.every((result) => result.handled && result.mode === 'native-host')).toBe(true);
		expect(results.map((result) => result.desktopShellUiHelper)).toEqual([
			'enableMicaWindowChrome',
			'syncTaskbarProgress',
			'syncTaskbarProgress',
			'host.reportReady'
		]);
		expect(bridge.getHistory().map((result) => result.action)).toEqual([
			'set-window-effect',
			'set-progress',
			'clear-progress',
			'report-ready'
		]);

		bridge.dispose();
	});

	it('records deterministic browser fallback results when extended host handlers are absent', () => {
		const eventTarget = new EventTarget();
		const bridge = installNativeHostEventBridge({ eventTarget });

		dispatchNativeWindowAction(eventTarget, {
			action: 'set-progress',
			source: 'unit-test',
			progress: 18,
			progressStatus: 'normal'
		});

		expect(bridge.getHistory()).toHaveLength(1);
		expect(bridge.getHistory()[0]).toMatchObject({
			action: 'set-progress',
			handled: false,
			mode: 'browser-fallback',
			source: 'unit-test',
			desktopShellUiHelper: 'syncTaskbarProgress',
			desktopShellUiSource: 'packages/desktop-shell-ui/src/index.ts'
		});
		expect(bridge.getHistory()[0].reason).toContain('No native host progress handler');
		expect(bridge.getHistory()[0].desktopShellUiEvidence).toContain('ProgressBarStatus');

		bridge.dispose();
	});

	it('records unsupported-action for malformed native-window-action details', () => {
		const eventTarget = new EventTarget();
		const bridge = installNativeHostEventBridge({ eventTarget });

		dispatchNativeWindowAction(eventTarget, {
			action: 'minimize',
			source: 'unit-test'
		});

		expect(bridge.getHistory()).toHaveLength(1);
		expect(bridge.getHistory()[0]).toMatchObject({
			action: 'unsupported-action',
			handled: false,
			mode: 'unsupported',
			source: 'unknown'
		});

		bridge.dispose();
	});

	it('keeps command history bounded by the configured limit', () => {
		const eventTarget = new EventTarget();
		const bridge = installNativeHostEventBridge({ eventTarget, historyLimit: 2 });

		dispatchNativeWindowAction(eventTarget, { action: 'set-window-effect', windowEffect: 'mica' });
		dispatchNativeWindowAction(eventTarget, { action: 'set-progress', progress: 18 });
		dispatchNativeWindowAction(eventTarget, { action: 'report-ready', reportHref: '/alpha-readiness/report.json' });

		expect(bridge.getHistory().map((result) => result.action)).toEqual([
			'set-progress',
			'report-ready'
		]);

		bridge.dispose();
	});

	it('documents the UltraGear desktop-shell helper mapping for every supported action', () => {
		expect(desktopShellUiBinding).toMatchObject({
			marker: 'desktopShellUiBinding',
			packageName: '@scriptgpt/desktop-shell-ui',
			sourcePackage: 'packages/desktop-shell-ui/src/index.ts',
			upstreamWidgetSource: 'packages/ultragear-widget-ui/src/app.ts',
			controllerGlobal: 'window.__SVELTEKIT_PHP_NATIVE_HOST__',
			installer: 'installSvelteKitPhpNativeHost'
		});
		expect(desktopShellUiBinding.requiredImports).toEqual([
			'enableMicaWindowChrome',
			'syncTaskbarProgress',
			'toggleWindowMaximize',
			'TaskbarProgressState'
		]);
		expect(desktopShellUiBinding.handlers.map((handler) => handler.helper)).toEqual([
			'win.startDragging',
			'toggleWindowMaximize',
			'enableMicaWindowChrome',
			'syncTaskbarProgress',
			'syncTaskbarProgress',
			'host.reportReady'
		]);
		expect(getDesktopShellUiCommandMapping('set-window-effect')).toMatchObject({
			helper: 'enableMicaWindowChrome',
			upstreamCall: 'enableMicaWindowChrome(win)'
		});
		expect(getDesktopShellUiCommandMapping('set-progress')?.evidence).toContain(
			'TaskbarProgressState'
		);
		expect(getDesktopShellUiCommandMapping('set-progress')?.upstreamCall).toContain(
			'toDesktopShellUiTaskbarProgressState'
		);
		expect(toDesktopShellUiTaskbarProgressState({ progressStatus: 'indeterminate' })).toEqual({
			saveInFlight: true,
			refreshInFlight: false,
			hasQueuedSave: false
		});
		expect(toDesktopShellUiTaskbarProgressState({ progressStatus: 'normal' })).toEqual({
			saveInFlight: false,
			refreshInFlight: false,
			hasQueuedSave: true
		});
		expect(toDesktopShellUiTaskbarProgressState({ progressStatus: 'none' })).toEqual({
			saveInFlight: false,
			refreshInFlight: false,
			hasQueuedSave: false
		});
	});
});
